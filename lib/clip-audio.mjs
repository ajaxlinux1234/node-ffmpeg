#!/usr/bin/env node
import "zx/globals";
import { createHash } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { dirname, basename, extname, join } from "path";
import path from "path";

/**
 * 音频截取工具
 * @param {Array} audioConfigs - 音频配置数组
 * @param {string} audioConfigs[].url - 音频文件路径或URL
 * @param {number} [audioConfigs[].start=0] - 开始时间（秒）
 * @param {number} [audioConfigs[].duration] - 持续时间（秒），不指定则截取到结尾
 * @param {string} [audioConfigs[].output] - 输出文件名，不指定则自动生成
 */
export default async function runClipAudio(audioConfigs) {
  if (!Array.isArray(audioConfigs) || audioConfigs.length === 0) {
    throw new Error("audioConfigs must be a non-empty array");
  }

  console.log(`\n🎵 开始处理 ${audioConfigs.length} 个音频文件...`);

  // 确保输出目录存在
  const outputDir = "output/clip-audio";
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`✅ 创建输出目录: ${outputDir}`);
  }

  const results = [];

  for (let i = 0; i < audioConfigs.length; i++) {
    const config = audioConfigs[i];
    const { url, start = 0, duration, output } = config;

    if (!url) {
      console.warn(`⚠️  跳过第 ${i + 1} 个配置：缺少 url 参数`);
      continue;
    }

    console.log(
      `\n📂 处理第 ${i + 1}/${audioConfigs.length} 个音频: ${basename(url)}`
    );

    try {
      const result = await processAudioClip(
        url,
        start,
        duration,
        output,
        outputDir
      );
      results.push(result);
      console.log(`✅ 完成: ${result.outputPath}`);
    } catch (error) {
      console.error(`❌ 处理失败: ${error.message}`);
      results.push({ url, error: error.message });
    }
  }

  // 输出处理结果摘要
  console.log("\n📊 处理结果摘要:");
  const successful = results.filter((r) => !r.error);
  const failed = results.filter((r) => r.error);

  console.log(`✅ 成功: ${successful.length} 个`);
  if (failed.length > 0) {
    console.log(`❌ 失败: ${failed.length} 个`);
  }

  if (successful.length > 0) {
    console.log("\n🎉 成功处理的文件:");
    successful.forEach((result) => {
      console.log(`  📄 ${result.outputPath}`);
    });
  }

  return results;
}

/**
 * 处理单个音频截取
 */
async function processAudioClip(url, start, duration, customOutput, outputDir) {
  // 判断是否为远程URL
  const isRemoteUrl = url.startsWith("http://") || url.startsWith("https://");
  let inputPath = url;

  // 如果是远程URL，先下载
  if (isRemoteUrl) {
    inputPath = await downloadAudio(url);
  } else {
    // 本地路径处理
    if (!path.isAbsolute(url)) {
      inputPath = path.resolve(process.cwd(), url);
    }

    if (!existsSync(inputPath)) {
      throw new Error(`音频文件不存在: ${inputPath}`);
    }
  }

  // 生成输出文件名
  const originalName = basename(inputPath, extname(inputPath));
  const extension = extname(inputPath) || ".mp3";

  let outputFileName;
  if (customOutput) {
    outputFileName = customOutput.endsWith(extension)
      ? customOutput
      : `${customOutput}${extension}`;
  } else {
    const startSuffix = start > 0 ? `_start${start}s` : "";
    const durationSuffix = duration ? `_${duration}s` : "_clip";
    outputFileName = `${originalName}${startSuffix}${durationSuffix}${extension}`;
  }

  const outputPath = join(outputDir, outputFileName);

  // 构建FFmpeg命令
  const ffmpegArgs = ["-i", inputPath, "-ss", start.toString()];

  if (duration) {
    ffmpegArgs.push("-t", duration.toString());
  }

  // 音频编码参数
  ffmpegArgs.push(
    "-acodec",
    "libmp3lame",
    "-ab",
    "192k",
    "-ar",
    "44100",
    "-y", // 覆盖输出文件
    outputPath
  );

  console.log(
    `🔄 执行音频截取: ${basename(inputPath)} -> ${basename(outputPath)}`
  );
  console.log(
    `   开始时间: ${start}s${
      duration ? `, 持续时间: ${duration}s` : ", 截取到结尾"
    }`
  );

  // 执行FFmpeg命令
  await $`ffmpeg ${ffmpegArgs}`;

  // 清理临时下载文件
  if (isRemoteUrl && inputPath !== url) {
    try {
      await $`rm -f ${inputPath}`;
    } catch (error) {
      console.warn(`⚠️  清理临时文件失败: ${error.message}`);
    }
  }

  return {
    url,
    inputPath: isRemoteUrl ? url : inputPath,
    outputPath,
    start,
    duration,
    success: true,
  };
}

/**
 * 下载远程音频文件
 */
async function downloadAudio(url) {
  console.log(`📥 下载音频: ${url}`);

  // 生成基于URL的哈希文件名
  const hash = createHash("md5").update(url).digest("hex").substring(0, 12);
  const tempDir = "temp/clip-audio";

  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  // 尝试从URL获取文件扩展名
  let extension = ".mp3";
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const urlExt = extname(pathname);
    if (
      urlExt &&
      [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"].includes(
        urlExt.toLowerCase()
      )
    ) {
      extension = urlExt;
    }
  } catch (error) {
    // 使用默认扩展名
  }

  const tempPath = join(tempDir, `${hash}${extension}`);

  // 检查是否已经下载过
  if (existsSync(tempPath)) {
    console.log(`✅ 使用缓存文件: ${tempPath}`);
    return tempPath;
  }

  try {
    // 使用curl下载，支持更多的音频格式
    await $`curl -L -o ${tempPath} ${url}`;

    if (!existsSync(tempPath)) {
      throw new Error("下载的文件不存在");
    }

    console.log(`✅ 下载完成: ${tempPath}`);
    return tempPath;
  } catch (error) {
    throw new Error(`下载音频失败: ${error.message}`);
  }
}

/**
 * 获取音频信息
 */
async function getAudioInfo(filePath) {
  try {
    const result =
      await $`ffprobe -v quiet -print_format json -show_format -show_streams ${filePath}`;
    const info = JSON.parse(result.stdout);

    const audioStream = info.streams.find(
      (stream) => stream.codec_type === "audio"
    );
    const duration = parseFloat(info.format.duration);

    return {
      duration,
      codec: audioStream?.codec_name,
      bitrate: audioStream?.bit_rate,
      sampleRate: audioStream?.sample_rate,
      channels: audioStream?.channels,
    };
  } catch (error) {
    console.warn(`⚠️  无法获取音频信息: ${error.message}`);
    return null;
  }
}
