import "zx/globals";
import crypto from "crypto";
import { execSync } from "child_process";
import {
  getOptimizedFFmpegParams,
  showOptimizationInfo,
} from "./ffmpeg-optimization.mjs";

// =============================================================================
// CONFIGURATION CONSTANTS - 视频合并相关的配置参数
// =============================================================================

/**
 * 文件路径配置
 */
const CONFIG_PATHS = {
  INPUT_DIR: "input/merge-video",
  OUTPUT_DIR: "output/merge-video",
  HASH_LENGTH: 12, // URL哈希长度
  MERGED_SUFFIX: "_merged", // 合并后缀
};

/**
 * 视频处理配置
 * 注意：实际编码参数会根据硬件加速情况动态调整
 * 默认启用高质量模式，在内存和GPU允许下最大化视频质量
 */
const CONFIG_VIDEO = {
  CRF_VALUE: 18, // 视频质量参数 (18为高质量值，在GPU/内存允许下提供最佳质量)
  PRESET: "slow", // 编码预设 (slow提供更好的质量)
  AUDIO_BITRATE: "256k", // 音频比特率 (提高到256k以获得更好的音频质量)
  VIDEO_CODEC: "libx264", // 视频编码器（会被硬件加速覆盖）
  PIXEL_FORMAT: "yuv420p", // 像素格式
  AUDIO_CODEC_COPY: "copy", // 音频编码（复制）
  AUDIO_CODEC_AAC: "aac", // 音频编码（AAC）

  // 获取优化的编码参数（默认启用高质量模式）
  getOptimizedParams(highQuality = true) {
    const params = getOptimizedFFmpegParams({
      enableGPU: true,
      enableMultiThread: true,
      preset: this.PRESET,
      crf: this.CRF_VALUE,
      highQuality: highQuality,
    });
    return params;
  },
};

/**
 * 转场效果配置
 */
const CONFIG_TRANSITIONS = {
  DEFAULT_DURATION: 1.0, // 默认转场时长（秒）
  SUPPORTED_EFFECTS: [
    "叠化", // fade/dissolve
    "淡入淡出", // fade in/out
    "推拉", // push/pull
    "擦除", // wipe
    "无转场", // no transition
    // 历史人物专用转场效果
    "时光流转", // 适合时间跨度大的历史事件衔接
    "岁月如歌", // 适合人物成长历程的温馨转场
    "历史回眸", // 适合重要历史时刻的庄重转场
    "命运转折", // 适合人物命运转折点的戏剧性转场
    "精神传承", // 适合表现精神品质传承的升华转场
    "时代变迁", // 适合不同历史时期的宏大转场
    "心路历程", // 适合内心世界变化的细腻转场
    "光影交错", // 适合现实与回忆交织的艺术转场
  ],
  // 历史人物转场效果的应用场景说明
  HISTORICAL_SCENES: {
    时光流转:
      "适用于跨越多年的人生阶段转换，如从童年到青年、从求学到工作等重要人生节点",
    岁月如歌:
      "适用于温馨的成长历程，如家庭生活、求学经历、师生情谊等温暖时光的衔接",
    历史回眸:
      "适用于重大历史事件的庄重呈现，如重要发现、历史性时刻、国家大事等严肃场景",
    命运转折:
      "适用于人物命运的重大转折，如人生选择、事业转向、历史机遇等戏剧性时刻",
    精神传承:
      "适用于表现人物精神品质的传承，如师承关系、价值观传递、精神财富延续",
    时代变迁:
      "适用于不同历史时期的宏大叙事，如社会变革、时代背景转换、历史进程推进",
    心路历程:
      "适用于人物内心世界的细腻变化，如思想觉悟、情感波动、心理成长过程",
    光影交错: "适用于现实与回忆的交织呈现，如追忆往昔、对比今昔、时空穿越效果",
  },
};

/**
 * 执行命令的辅助函数，替代zx的模板字符串
 * @param {string} command - 要执行的命令
 * @returns {Object} - {stdout: string, stderr: string}
 */
function execCommand(command) {
  try {
    const stdout = execSync(command, { encoding: "utf8" });
    return { stdout, stderr: "" };
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

/**
 * 处理路径配置，支持 https 和本地路径
 * @param {string} pathConfig - 配置中的路径
 * @returns {string} - 处理后的路径
 */
function resolvePath(pathConfig) {
  if (!pathConfig) return "";
  // 如果是 https 路径，直接返回
  if (pathConfig.startsWith("https://") || pathConfig.startsWith("http://")) {
    return pathConfig;
  }

  // 本地路径处理
  if (path.isAbsolute(pathConfig)) {
    return pathConfig;
  } else {
    // 相对路径，加上 process.cwd()
    return path.resolve(process.cwd(), pathConfig);
  }
}

/**
 * 下载视频到指定目录，避免重复下载
 * @param {string} url - 视频URL（可能包含 CLIP: 前缀）
 * @param {string} inputDir - 输入目录
 * @param {boolean} useCacheVideo - 是否使用缓存视频，默认true
 * @returns {string} - 下载的文件路径
 */
async function downloadVideo(url, inputDir, useCacheVideo = true) {
  await fs.mkdir(inputDir, { recursive: true });

  // 检查是否是 CLIP 格式的URL
  // 格式: CLIP:{start}-{end}:{originalUrl}
  let actualUrl = url;
  let clipInfo = null;

  if (url.startsWith("CLIP:")) {
    const clipMatch = url.match(/^CLIP:(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?):(.+)$/);
    if (clipMatch) {
      const [, startTime, endTime, originalUrl] = clipMatch;
      clipInfo = {
        start: parseFloat(startTime),
        end: parseFloat(endTime),
      };
      actualUrl = originalUrl;
      console.log(`🎬 检测到视频裁剪需求: ${startTime}s - ${endTime}s`);
    }
  }

  // 生成URL哈希用于识别重复下载
  const urlHash = crypto
    .createHash("md5")
    .update(actualUrl)
    .digest("hex")
    .substring(0, CONFIG_PATHS.HASH_LENGTH);

  let downloadedPath;

  // 检查是否使用缓存视频
  if (useCacheVideo) {
    // 检查是否已经下载过
    const existingFiles = await fs.readdir(inputDir).catch(() => []);
    const existingFile = existingFiles.find(
      (file) => file.includes(urlHash) && !file.includes("_clipped")
    );

    if (existingFile) {
      downloadedPath = path.join(inputDir, existingFile);
      console.log(`📁 使用缓存视频: ${downloadedPath}`);
    } else {
      // 下载新视频
      downloadedPath = await performDownload(actualUrl, inputDir, urlHash);
    }
  } else {
    // 强制重新下载
    console.log(`🔄 强制重新下载视频 (useCacheVideo=false)`);
    downloadedPath = await performDownload(actualUrl, inputDir, urlHash);
  }

  // 如果需要裁剪，执行裁剪操作
  if (clipInfo) {
    const duration = clipInfo.end - clipInfo.start;
    const clippedFileName = `${Date.now()}_${urlHash}_clipped_${clipInfo.start}-${clipInfo.end}.mp4`;
    const clippedPath = path.join(inputDir, clippedFileName);

    // 检查是否已有裁剪后的缓存文件
    if (useCacheVideo) {
      const existingFiles = await fs.readdir(inputDir).catch(() => []);
      const existingClippedFile = existingFiles.find(
        (file) =>
          file.includes(urlHash) &&
          file.includes("_clipped") &&
          file.includes(`${clipInfo.start}-${clipInfo.end}`)
      );

      if (existingClippedFile) {
        const existingClippedPath = path.join(inputDir, existingClippedFile);
        console.log(`📁 使用缓存的裁剪视频: ${existingClippedPath}`);
        return existingClippedPath;
      }
    }

    console.log(
      `✂️  正在裁剪视频: ${clipInfo.start}s - ${clipInfo.end}s (时长: ${duration}s)`
    );

    // 使用 FFmpeg 裁剪视频
    execCommand(
      `ffmpeg -y -ss ${clipInfo.start} -i "${downloadedPath}" -t ${duration} -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} -avoid_negative_ts 1 "${clippedPath}"`
    );

    console.log(`✅ 视频裁剪完成: ${clippedPath}`);
    return clippedPath;
  }

  return downloadedPath;
}

/**
 * 执行视频下载
 * @param {string} url - 视频URL
 * @param {string} inputDir - 输入目录
 * @param {string} urlHash - URL哈希
 * @returns {string} - 下载的文件路径
 */
async function performDownload(url, inputDir, urlHash) {
  const ts = Date.now();
  const fileName = `${ts}_${urlHash}.mp4`;
  const downloadedPath = path.join(inputDir, fileName);

  console.log(`📥 正在下载视频到: ${downloadedPath}`);
  execCommand(
    `curl -L --fail --retry 3 --retry-delay 1 -o "${downloadedPath}" "${url}"`
  );

  return downloadedPath;
}

/**
 * 替换视频片段
 * @param {string} mergedVideoPath - 合并后的视频路径
 * @param {Array} videoReplaceUrls - 替换配置数组
 * @param {string} outputDir - 输出目录
 * @param {string} inputDir - 输入目录（用于下载替换视频）
 * @returns {Promise<string>} - 替换后的视频路径
 */
async function replaceVideoSegments(
  mergedVideoPath,
  videoReplaceUrls,
  outputDir,
  inputDir,
  useCacheVideo = true // 新增参数
) {
  console.log(`   - 替换片段数量: ${videoReplaceUrls.length}`);

  // 获取合并后视频的总时长
  const mergedInfo = await getVideoInfo(mergedVideoPath);
  const totalDuration = mergedInfo.duration;
  console.log(`   - 合并后视频总时长: ${totalDuration.toFixed(2)}s`);

  // 按时间范围排序替换项
  const sortedReplacements = [...videoReplaceUrls].sort(
    (a, b) => a.timeRange[0] - b.timeRange[0]
  );

  // 构建视频片段列表
  const segments = [];
  let currentTime = 0;

  for (const replacement of sortedReplacements) {
    const [startTime, endTime] = replacement.timeRange;

    // 验证时间范围
    if (startTime >= totalDuration) {
      console.warn(`   ⚠️  跳过替换：开始时间 ${startTime}s 超出视频总时长`);
      continue;
    }

    const actualEndTime = Math.min(endTime, totalDuration);

    // 添加替换前的原视频片段
    if (currentTime < startTime) {
      segments.push({
        type: "original",
        start: currentTime,
        end: startTime,
        source: mergedVideoPath,
      });
      console.log(
        `   📹 保留原视频: ${currentTime.toFixed(2)}s - ${startTime.toFixed(2)}s`
      );
    }

    // 下载并裁剪替换视频
    console.log(
      `   🔄 替换片段: ${startTime.toFixed(2)}s - ${actualEndTime.toFixed(2)}s`
    );
    const replacementDuration = actualEndTime - startTime;

    // 下载替换视频
    const replacementVideoPath = await downloadVideo(
      replacement.url,
      inputDir,
      useCacheVideo
    );

    segments.push({
      type: "replacement",
      start: startTime,
      end: actualEndTime,
      source: replacementVideoPath,
      duration: replacementDuration,
    });

    currentTime = actualEndTime;
  }

  // 添加最后的原视频片段
  if (currentTime < totalDuration) {
    segments.push({
      type: "original",
      start: currentTime,
      end: totalDuration,
      source: mergedVideoPath,
    });
    console.log(
      `   📹 保留原视频: ${currentTime.toFixed(2)}s - ${totalDuration.toFixed(2)}s`
    );
  }

  // 如果没有任何替换，直接返回原视频
  if (segments.length === 1 && segments[0].type === "original") {
    console.log(`   ℹ️  没有有效的替换，保持原视频不变`);
    return mergedVideoPath;
  }

  // 裁剪各个片段
  console.log(`\n   ✂️  裁剪视频片段...`);
  const segmentPaths = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const segmentPath = path.join(outputDir, `segment_${i}_${Date.now()}.mp4`);

    if (segment.type === "original") {
      // 从原视频裁剪
      const duration = segment.end - segment.start;
      execCommand(
        `ffmpeg -y -ss ${segment.start} -i "${segment.source}" -t ${duration} -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${segmentPath}"`
      );
    } else {
      // 使用替换视频（可能需要裁剪到指定时长）
      const replacementInfo = await getVideoInfo(segment.source);
      if (replacementInfo.duration >= segment.duration) {
        // 替换视频足够长，裁剪到需要的时长
        execCommand(
          `ffmpeg -y -i "${segment.source}" -t ${segment.duration} -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${segmentPath}"`
        );
      } else {
        // 替换视频不够长，直接使用全部
        console.warn(`   ⚠️  替换视频时长不足，使用全部内容`);
        execCommand(
          `ffmpeg -y -i "${segment.source}" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${segmentPath}"`
        );
      }
    }

    segmentPaths.push(segmentPath);
    console.log(`   ✅ 片段 ${i + 1}/${segments.length} 已准备`);
  }

  // 合并所有片段
  console.log(`\n   🔗 合并所有片段...`);
  const concatListPath = path.join(
    outputDir,
    `concat_replace_${Date.now()}.txt`
  );
  const concatContent = segmentPaths
    .map((p) => `file '${path.resolve(p).replace(/\\/g, "/")}'`)
    .join("\n");
  await fs.writeFile(concatListPath, concatContent);

  const finalPath = path.join(outputDir, `merged_${Date.now()}_replaced.mp4`);
  execCommand(
    `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} "${finalPath}"`
  );

  // 清理临时文件
  if (useCacheVideo) {
    console.log(`   📁 保留片段替换的临时文件用作缓存 (useCacheVideo=true)`);
    for (const segmentPath of segmentPaths) {
      console.log(`      - ${segmentPath}`);
    }
  } else {
    console.log(`   🗑️ 清理片段替换的临时文件 (useCacheVideo=false)`);
    for (const segmentPath of segmentPaths) {
      await fs.remove(segmentPath).catch(() => {});
    }
  }
  await fs.remove(concatListPath).catch(() => {});

  console.log(`   ✅ 视频片段替换完成`);
  return finalPath;
}

/**
 * 获取视频信息
 * @param {string} videoPath - 视频文件路径
 * @returns {Object} - 视频信息对象
 */
async function getVideoInfo(videoPath) {
  const probe = execCommand(
    `ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`
  );
  const info = JSON.parse(probe.stdout);
  const videoStream = info.streams.find((s) => s.codec_type === "video");
  const audioStream = info.streams.find((s) => s.codec_type === "audio");

  return {
    width: videoStream?.width || 0,
    height: videoStream?.height || 0,
    duration:
      parseFloat(info?.format?.duration || videoStream?.duration || 0) || 0,
    fps: eval(videoStream?.r_frame_rate || "30/1") || 30,
    hasAudio: !!audioStream,
    format: info.format,
    videoStream,
    audioStream,
  };
}

/**
 * 转换视频到指定比例
 * @param {string} videoPath - 输入视频路径
 * @param {string} targetAspect - 目标比例，如 "9:16"
 * @param {string} outputDir - 输出目录
 * @returns {Promise<string>} - 转换后的视频路径
 */
async function convertToAspectRatio(videoPath, targetAspect, outputDir) {
  const videoInfo = await getVideoInfo(videoPath);
  const currentWidth = videoInfo.width;
  const currentHeight = videoInfo.height;
  const currentAspect = currentWidth / currentHeight;

  // 解析目标比例
  const [targetW, targetH] = targetAspect.split(":").map(Number);
  const targetAspectRatio = targetW / targetH;

  // 计算比例差异（允许0.01的误差）
  if (Math.abs(currentAspect - targetAspectRatio) < 0.01) {
    console.log(`✅ 视频已经是 ${targetAspect} 比例，无需转换`);
    return videoPath;
  }

  console.log(
    `🔄 转换视频比例: ${currentWidth}x${currentHeight} (${currentAspect.toFixed(2)}) -> ${targetAspect} (${targetAspectRatio.toFixed(2)})`
  );

  // 计算裁剪尺寸
  let cropW, cropH, cropX, cropY;

  if (currentAspect > targetAspectRatio) {
    // 当前视频太宽，需要左右裁剪
    cropH = currentHeight;
    cropW = Math.round(currentHeight * targetAspectRatio);
    cropX = Math.round((currentWidth - cropW) / 2);
    cropY = 0;
  } else {
    // 当前视频太高，需要上下裁剪
    cropW = currentWidth;
    cropH = Math.round(currentWidth / targetAspectRatio);
    cropX = 0;
    cropY = Math.round((currentHeight - cropH) / 2);
  }

  // 确保裁剪尺寸为偶数（视频编码要求）
  cropW = cropW - (cropW % 2);
  cropH = cropH - (cropH % 2);

  const base = path.basename(videoPath, path.extname(videoPath));
  const outputPath = path.join(
    outputDir,
    `${base}_${targetAspect.replace(":", "x")}.mp4`
  );

  console.log(`   裁剪区域: ${cropW}x${cropH} (从 ${cropX},${cropY} 开始)`);

  // 使用crop滤镜裁剪，保持原始画质
  const cropFilter = `crop=${cropW}:${cropH}:${cropX}:${cropY}`;

  // 使用copy编码保持原始画质（如果可能），否则使用高质量重编码
  let encodeParams;
  try {
    // 尝试使用copy模式（最快，无损）
    execCommand(
      `ffmpeg -y -i "${videoPath}" -vf "${cropFilter}" -c:v copy -c:a copy "${outputPath}"`
    );
    console.log(`✅ 使用无损模式转换完成`);
    return outputPath;
  } catch (error) {
    // copy模式失败，使用高质量重编码
    console.log(`⚠️ 无损模式不可用，使用高质量重编码`);

    const params = CONFIG_VIDEO.getOptimizedParams(true);
    encodeParams = `-c:v ${params.videoCodec} ${params.outputParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE}`;

    execCommand(
      `ffmpeg -y -i "${videoPath}" -vf "${cropFilter}" ${encodeParams} "${outputPath}"`
    );
    console.log(`✅ 高质量重编码完成`);
    return outputPath;
  }
}

/**
 * 生成转场效果的FFmpeg滤镜
 * @param {string} effect - 转场效果名称
 * @param {number} duration - 转场时长
 * @param {number} offset - 转场开始时间偏移
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateTransitionFilter(effect, duration, offset) {
  switch (effect) {
    case "叠化":
    case "fade":
    case "dissolve":
      return `xfade=transition=fade:duration=${duration}:offset=${offset}`;

    case "淡入淡出":
    case "fadeinout":
      return `xfade=transition=fade:duration=${duration}:offset=${offset}`;

    case "推拉":
    case "push":
      return `xfade=transition=slideleft:duration=${duration}:offset=${offset}`;

    case "擦除":
    case "wipe":
      return `xfade=transition=wipeleft:duration=${duration}:offset=${offset}`;

    // 历史人物专用转场效果
    case "时光流转":
      // 圆形缩放转场，象征时间的流逝和轮回
      return `xfade=transition=circleopen:duration=${duration}:offset=${offset}`;

    case "岁月如歌":
      // 温柔的淡化转场，营造温馨氛围
      return `xfade=transition=fade:duration=${duration}:offset=${offset}`;

    case "历史回眸":
      // 庄重的垂直擦除，象征历史的厚重
      return `xfade=transition=wipeup:duration=${duration}:offset=${offset}`;

    case "命运转折":
      // 对角线转场，象征命运的转折
      return `xfade=transition=diagtl:duration=${duration}:offset=${offset}`;

    case "精神传承":
      // 圆形扩散转场，象征精神的传播
      return `xfade=transition=circleopen:duration=${duration}:offset=${offset}`;

    case "时代变迁":
      // 水平推拉转场，象征时代的推进
      return `xfade=transition=slideright:duration=${duration}:offset=${offset}`;

    case "心路历程":
      // 柔和的淡化，表现内心的细腻变化
      return `xfade=transition=fade:duration=${duration}:offset=${offset}`;

    case "光影交错":
      // 径向转场效果，营造回忆与现实交织的感觉
      return `xfade=transition=radial:duration=${duration}:offset=${offset}`;

    case "无转场":
    case "none":
    default:
      return null; // 无转场效果
  }
}

/**
 * 合并多个视频文件
 * @param {string[]} videoPaths - 视频文件路径数组
 * @param {string} transitionEffect - 转场效果
 * @param {string} outputDir - 输出目录
 * @returns {string} - 合并后的视频路径
 */
async function mergeVideos(
  videoPaths,
  transitionEffects,
  outputDir,
  useCacheVideo = true
) {
  if (!videoPaths || videoPaths.length === 0) {
    throw new Error("没有提供视频文件");
  }

  if (videoPaths.length === 1) {
    console.log("只有一个视频文件，直接复制到输出目录");
    const singleVideoPath = videoPaths[0];
    const outputPath = path.join(
      outputDir,
      `single_video${CONFIG_PATHS.MERGED_SUFFIX}.mp4`
    );
    execCommand(`cp "${singleVideoPath}" "${outputPath}"`);
    return outputPath;
  }

  await fs.mkdir(outputDir, { recursive: true });

  // 支持单个转场效果（向后兼容）或转场效果数组
  let effectsArray = [];
  if (Array.isArray(transitionEffects)) {
    effectsArray = transitionEffects;
  } else {
    // 向后兼容：单个转场效果
    effectsArray = new Array(videoPaths.length - 1).fill(transitionEffects);
  }

  console.log(`开始合并 ${videoPaths.length} 个视频文件`);
  console.log(`转场效果: ${effectsArray.join(" → ")}`);

  // 获取第一个视频的信息作为参考
  const firstVideoInfo = await getVideoInfo(videoPaths[0]);
  console.log(
    `参考视频信息: ${firstVideoInfo.width}x${firstVideoInfo.height}, ${firstVideoInfo.fps}fps, 时长: ${firstVideoInfo.duration}s`
  );

  const ts = Date.now();
  const outputPath = path.join(
    outputDir,
    `merged_${ts}${CONFIG_PATHS.MERGED_SUFFIX}.mp4`
  );

  // 检查是否所有转场都是无转场
  const allNoTransition = effectsArray.every(
    (effect) => effect === "无转场" || effect === "none"
  );

  if (allNoTransition) {
    // 无转场效果，直接拼接
    console.log("使用无转场拼接模式");

    // 获取所有视频的信息
    const videoInfos = [];
    let someHaveAudio = false;
    for (const videoPath of videoPaths) {
      const info = await getVideoInfo(videoPath);
      videoInfos.push(info);
      if (info.hasAudio) {
        someHaveAudio = true;
      }
    }

    // 检查视频分辨率是否一致
    const resolutions = videoInfos.map(
      (info) => `${info.width}x${info.height}`
    );
    const uniqueResolutions = [...new Set(resolutions)];

    // 统一转换为9:16比例
    console.log("统一所有视频为9:16比例进行拼接");
    const targetWidth = 1080; // 9:16比例的标准宽度
    const targetHeight = 1920; // 9:16比例的标准高度

    // 检查是否所有视频都已经是9:16比例
    const allAre916 = videoInfos.every(
      (info) => info.width === targetWidth && info.height === targetHeight
    );

    if (allAre916) {
      // 所有视频都是9:16，使用简单拼接
      const fileListPath = path.join(outputDir, `filelist_${ts}.txt`);
      const fileListContent = videoPaths
        .map((p) => `file '${path.resolve(p)}'`)
        .join("\n");
      await fs.writeFile(fileListPath, fileListContent, "utf8");

      execCommand(
        `ffmpeg -y -f concat -safe 0 -i "${fileListPath}" -c copy "${outputPath}"`
      );

      // 清理临时文件
      if (useCacheVideo) {
        console.log(
          `📁 保留合并过程的临时文件用作缓存 (useCacheVideo=true): ${fileListPath}`
        );
      } else {
        await fs.remove(fileListPath).catch(() => {});
      }
    } else {
      // 分辨率不一致，统一为9:16比例进行拼接
      console.log("检测到不同分辨率，统一为9:16比例进行拼接");
      // 使用标准的9:16比例，选择合适的分辨率
      const targetWidth = 1080; // 9:16比例的标准宽度
      const targetHeight = 1920; // 9:16比例的标准高度

      let inputs = "";
      let filterComplex = "";

      // 构建输入和滤镜
      for (let i = 0; i < videoPaths.length; i++) {
        inputs += `-i "${videoPaths[i]}" `;
        const currentRatio = videoInfos[i].width / videoInfos[i].height;
        const targetRatio = targetWidth / targetHeight; // 9:16 = 0.5625

        if (
          videoInfos[i].width !== targetWidth ||
          videoInfos[i].height !== targetHeight
        ) {
          if (currentRatio > targetRatio) {
            // 视频太宽，需要左右裁剪
            const cropWidth = Math.round(videoInfos[i].height * targetRatio);
            const cropX = Math.round((videoInfos[i].width - cropWidth) / 2);
            filterComplex += `[${i}:v]crop=${cropWidth}:${videoInfos[i].height}:${cropX}:0,scale=${targetWidth}:${targetHeight},setsar=1[v${i}];`;
          } else if (currentRatio < targetRatio) {
            // 视频太高，需要上下裁剪
            const cropHeight = Math.round(videoInfos[i].width / targetRatio);
            const cropY = Math.round((videoInfos[i].height - cropHeight) / 2);
            filterComplex += `[${i}:v]crop=${videoInfos[i].width}:${cropHeight}:0:${cropY},scale=${targetWidth}:${targetHeight},setsar=1[v${i}];`;
          } else {
            // 比例相同，只需要缩放
            filterComplex += `[${i}:v]scale=${targetWidth}:${targetHeight},setsar=1[v${i}];`;
          }
        } else {
          filterComplex += `[${i}:v]setsar=1[v${i}];`;
        }
      }

      // 拼接视频
      filterComplex +=
        videoPaths.map((_, i) => `[v${i}]`).join("") +
        `concat=n=${videoPaths.length}:v=1:a=0[v];`;

      // 处理音频 - 只处理有音频的视频
      if (someHaveAudio) {
        const audioInputs = [];
        for (let i = 0; i < videoPaths.length; i++) {
          if (videoInfos[i].hasAudio) {
            audioInputs.push(`[${i}:a]`);
          }
        }

        if (audioInputs.length > 0) {
          if (audioInputs.length === 1) {
            // 只有一个音频流，直接使用（不需要滤镜，直接映射）
            execCommand(
              `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v]" -map "${audioInputs[0].replace("[", "").replace("]", "")}" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${outputPath}"`
            );
          } else {
            // 多个音频流，进行拼接
            filterComplex +=
              audioInputs.join("") +
              `concat=n=${audioInputs.length}:v=0:a=1[a];`;
            execCommand(
              `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${outputPath}"`
            );
          }
        } else {
          execCommand(
            `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${outputPath}"`
          );
        }
      } else {
        execCommand(
          `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${outputPath}"`
        );
      }
    }
  } else {
    // 有转场效果，使用xfade滤镜
    console.log(`使用转场效果: ${effectsArray.join(" → ")}`);

    const transitionDuration = CONFIG_TRANSITIONS.DEFAULT_DURATION;
    let filterComplex = "";
    let inputs = "";

    // 构建输入参数
    for (let i = 0; i < videoPaths.length; i++) {
      inputs += `-i "${videoPaths[i]}" `;
    }

    // 检查所有视频的音频情况
    const videoInfos = [];
    let allHaveAudio = true;
    let someHaveAudio = false;
    for (let i = 0; i < videoPaths.length; i++) {
      const videoPath = videoPaths[i];
      const info = await getVideoInfo(videoPath);
      videoInfos.push(info);
      console.log(
        `视频 ${i + 1} (${path.basename(videoPath)}) 音频检测: ${info.hasAudio ? "有音频" : "无音频"}`
      );
      if (info.hasAudio) {
        someHaveAudio = true;
      } else {
        allHaveAudio = false;
      }
    }

    console.log(
      `音频检测结果: ${allHaveAudio ? "所有视频都有音频" : someHaveAudio ? "部分视频有音频" : "所有视频都无音频"}`
    );

    // 检查视频分辨率是否一致，如果不一致则统一分辨率
    const resolutions = videoInfos.map(
      (info) => `${info.width}x${info.height}`
    );
    const uniqueResolutions = [...new Set(resolutions)];

    // 统一转换为9:16比例进行转场合并
    console.log("统一所有视频为9:16比例进行转场合并");
    const targetWidth = 720; // 9:16比例的标准宽度
    const targetHeight = 1280; // 9:16比例的标准高度

    // 检查是否需要缩放
    const needsScaling = videoInfos.some(
      (info) => info.width !== targetWidth || info.height !== targetHeight
    );

    // 为不同分辨率的视频添加裁剪和缩放滤镜
    let scaleFilters = "";

    if (needsScaling) {
      for (let i = 0; i < videoPaths.length; i++) {
        const currentRatio = videoInfos[i].width / videoInfos[i].height;
        const targetRatio = targetWidth / targetHeight; // 9:16 = 0.5625

        if (
          videoInfos[i].width !== targetWidth ||
          videoInfos[i].height !== targetHeight
        ) {
          if (currentRatio > targetRatio) {
            // 视频太宽，需要左右裁剪
            const cropWidth = Math.round(videoInfos[i].height * targetRatio);
            const cropX = Math.round((videoInfos[i].width - cropWidth) / 2);
            scaleFilters += `[${i}:v]crop=${cropWidth}:${videoInfos[i].height}:${cropX}:0,scale=${targetWidth}:${targetHeight},setsar=1[v${i}scaled];`;
          } else if (currentRatio < targetRatio) {
            // 视频太高，需要上下裁剪
            const cropHeight = Math.round(videoInfos[i].width / targetRatio);
            const cropY = Math.round((videoInfos[i].height - cropHeight) / 2);
            scaleFilters += `[${i}:v]crop=${videoInfos[i].width}:${cropHeight}:0:${cropY},scale=${targetWidth}:${targetHeight},setsar=1[v${i}scaled];`;
          } else {
            // 比例相同，只需要缩放
            scaleFilters += `[${i}:v]scale=${targetWidth}:${targetHeight},setsar=1[v${i}scaled];`;
          }
        } else {
          scaleFilters += `[${i}:v]setsar=1[v${i}scaled];`;
        }
      }

      // 更新输入标签
      for (let i = 0; i < videoPaths.length; i++) {
        filterComplex = scaleFilters;
      }
    }

    // 构建滤镜链
    if (videoPaths.length === 2) {
      // 两个视频的简单情况
      const videoInfo1 = videoInfos[0];
      const offset = videoInfo1.duration;
      const transitionFilter = generateTransitionFilter(
        effectsArray[0],
        transitionDuration,
        offset
      );

      // 根据是否需要缩放调整滤镜输入
      const v1Input = needsScaling ? "[v0scaled]" : "[0:v]";
      const v2Input = needsScaling ? "[v1scaled]" : "[1:v]";

      if (transitionFilter) {
        if (allHaveAudio) {
          // 两个视频都有音频，使用音频交叉淡化
          const scalePrefix = needsScaling ? scaleFilters : "";
          filterComplex = `-filter_complex "${scalePrefix}${v1Input}${v2Input}${transitionFilter}[v];[0:a][1:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[a]" -map "[v]" -map "[a]"`;
        } else if (someHaveAudio) {
          // 部分视频有音频，需要智能处理
          const video1HasAudio = videoInfos[0].hasAudio;
          const video2HasAudio = videoInfos[1].hasAudio;

          if (video1HasAudio && !video2HasAudio) {
            // 第一个有音频，第二个没有：只保留第一个的音频
            const scalePrefix = needsScaling ? scaleFilters : "";
            filterComplex = `-filter_complex "${scalePrefix}${v1Input}${v2Input}${transitionFilter}[v]" -map "[v]" -map "0:a"`;
          } else if (!video1HasAudio && video2HasAudio) {
            // 第一个没音频，第二个有：只保留第二个的音频
            const scalePrefix = needsScaling ? scaleFilters : "";
            filterComplex = `-filter_complex "${scalePrefix}${v1Input}${v2Input}${transitionFilter}[v]" -map "[v]" -map "1:a"`;
          } else {
            // 都没有音频
            const scalePrefix = needsScaling ? scaleFilters : "";
            filterComplex = `-filter_complex "${scalePrefix}${v1Input}${v2Input}${transitionFilter}[v]" -map "[v]"`;
          }
        } else {
          // 都没有音频
          const scalePrefix = needsScaling ? scaleFilters : "";
          filterComplex = `-filter_complex "${scalePrefix}${v1Input}${v2Input}${transitionFilter}[v]" -map "[v]"`;
        }
      } else {
        if (allHaveAudio) {
          // 两个视频都有音频，直接拼接
          const scalePrefix = needsScaling ? scaleFilters : "";
          filterComplex = `-filter_complex "${scalePrefix}[v0scaled][v1scaled]concat=n=2:v=1:a=0[v];[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[v]" -map "[a]"`;
        } else if (someHaveAudio) {
          // 部分视频有音频，需要智能处理
          const video1HasAudio = videoInfos[0].hasAudio;
          const video2HasAudio = videoInfos[1].hasAudio;

          if (video1HasAudio && !video2HasAudio) {
            // 第一个有音频，第二个没有：只保留第一个的音频
            const scalePrefix = needsScaling ? scaleFilters : "";
            const videoInputs = needsScaling
              ? "[v0scaled][v1scaled]"
              : "[0:v][1:v]";
            filterComplex = `-filter_complex "${scalePrefix}${videoInputs}concat=n=2:v=1:a=0[v]" -map "[v]" -map "0:a"`;
          } else if (!video1HasAudio && video2HasAudio) {
            // 第一个没音频，第二个有：只保留第二个的音频
            const scalePrefix = needsScaling ? scaleFilters : "";
            const videoInputs = needsScaling
              ? "[v0scaled][v1scaled]"
              : "[0:v][1:v]";
            filterComplex = `-filter_complex "${scalePrefix}${videoInputs}concat=n=2:v=1:a=0[v]" -map "[v]" -map "1:a"`;
          } else {
            // 都没有音频
            const scalePrefix = needsScaling ? scaleFilters : "";
            const videoInputs = needsScaling
              ? "[v0scaled][v1scaled]"
              : "[0:v][1:v]";
            filterComplex = `-filter_complex "${scalePrefix}${videoInputs}concat=n=2:v=1:a=0[v]" -map "[v]"`;
          }
        } else {
          // 都没有音频
          const scalePrefix = needsScaling ? scaleFilters : "";
          const videoInputs = needsScaling
            ? "[v0scaled][v1scaled]"
            : "[0:v][1:v]";
          filterComplex = `-filter_complex "${scalePrefix}${videoInputs}concat=n=2:v=1:a=0[v]" -map "[v]"`;
        }
      }
    } else {
      // 多个视频的复杂情况，逐步合并
      console.log("多视频合并，使用逐步处理方式");

      // 先合并前两个视频
      let currentOutput = path.join(outputDir, `temp_merge_0_${ts}.mp4`);
      const videoInfo1 = videoInfos[0];
      const offset = Math.max(0, videoInfo1.duration - transitionDuration);
      const transitionFilter = generateTransitionFilter(
        effectsArray[0],
        transitionDuration,
        offset
      );

      // 检查前两个视频的音频情况
      const firstTwoHaveAudio =
        videoInfos[0].hasAudio && videoInfos[1].hasAudio;
      const firstTwoSomeHaveAudio =
        videoInfos[0].hasAudio || videoInfos[1].hasAudio;

      if (transitionFilter) {
        if (firstTwoHaveAudio) {
          execCommand(
            `ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]${transitionFilter}[v];[0:a][1:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`
          );
        } else if (firstTwoSomeHaveAudio) {
          // 智能处理混合音频情况
          const video1HasAudio = videoInfos[0].hasAudio;
          const video2HasAudio = videoInfos[1].hasAudio;

          if (video1HasAudio && !video2HasAudio) {
            execCommand(
              `ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]${transitionFilter}[v]" -map "[v]" -map "0:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`
            );
          } else if (!video1HasAudio && video2HasAudio) {
            execCommand(
              `ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]${transitionFilter}[v]" -map "[v]" -map "1:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`
            );
          }
        } else {
          execCommand(
            `ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]${transitionFilter}[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${currentOutput}"`
          );
        }
      } else {
        if (firstTwoHaveAudio) {
          execCommand(
            `ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v];[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`
          );
        } else if (firstTwoSomeHaveAudio) {
          // 智能处理混合音频情况
          const video1HasAudio = videoInfos[0].hasAudio;
          const video2HasAudio = videoInfos[1].hasAudio;

          if (video1HasAudio && !video2HasAudio) {
            execCommand(
              `ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -map "0:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`
            );
          } else if (!video1HasAudio && video2HasAudio) {
            execCommand(
              `ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -map "1:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`
            );
          }
        } else {
          execCommand(
            `ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${currentOutput}"`
          );
        }
      }

      // 逐步合并剩余视频
      for (let i = 2; i < videoPaths.length; i++) {
        const nextOutput =
          i === videoPaths.length - 1
            ? outputPath
            : path.join(outputDir, `temp_merge_${i - 1}_${ts}.mp4`);
        const currentInfo = await getVideoInfo(currentOutput);
        const nextVideoInfo = videoInfos[i];
        const nextOffset = currentInfo.duration;
        const nextTransitionFilter = generateTransitionFilter(
          effectsArray[i - 1],
          transitionDuration,
          nextOffset
        );

        // 检查当前输出和下一个视频是否有音频
        const currentHasAudio = currentInfo.hasAudio || nextVideoInfo.hasAudio;

        if (nextTransitionFilter) {
          if (currentHasAudio) {
            // 智能音频处理：如果两个视频都有音频则交叉淡化，否则直接复制有音频的流
            if (currentInfo.hasAudio && nextVideoInfo.hasAudio) {
              execCommand(
                `ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]${nextTransitionFilter}[v];[0:a][1:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`
              );
            } else if (currentInfo.hasAudio) {
              execCommand(
                `ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]${nextTransitionFilter}[v]" -map "[v]" -map "0:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`
              );
            } else {
              execCommand(
                `ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]${nextTransitionFilter}[v]" -map "[v]" -map "1:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`
              );
            }
          } else {
            execCommand(
              `ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]${nextTransitionFilter}[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${nextOutput}"`
            );
          }
        } else {
          if (currentHasAudio) {
            // 智能音频处理：如果两个视频都有音频则连接，否则直接复制有音频的流
            if (currentInfo.hasAudio && nextVideoInfo.hasAudio) {
              execCommand(
                `ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v];[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`
              );
            } else if (currentInfo.hasAudio) {
              execCommand(
                `ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -map "0:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`
              );
            } else {
              execCommand(
                `ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -map "1:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`
              );
            }
          } else {
            execCommand(
              `ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${nextOutput}"`
            );
          }
        }

        // 清理上一个临时文件
        if (i > 2) {
          if (useCacheVideo) {
            console.log(`📁 保留合并临时文件用作缓存: ${currentOutput}`);
          } else {
            await fs.remove(currentOutput).catch(() => {});
          }
        }
        currentOutput = nextOutput;
      }

      // 清理最后一个临时文件
      if (videoPaths.length > 2) {
        const lastTempFile = path.join(outputDir, `temp_merge_0_${ts}.mp4`);
        if (useCacheVideo) {
          console.log(`📁 保留最后的合并临时文件用作缓存: ${lastTempFile}`);
        } else {
          await fs.remove(lastTempFile).catch(() => {});
        }
      }

      return outputPath;
    }

    // 执行合并命令（两个视频的情况）
    if (someHaveAudio) {
      execCommand(
        `ffmpeg -y ${inputs} ${filterComplex} -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${outputPath}"`
      );
    } else {
      execCommand(
        `ffmpeg -y ${inputs} ${filterComplex} -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${outputPath}"`
      );
    }
  }

  console.log(`视频合并完成: ${outputPath}`);
  return outputPath;
}

/**
 * 获取转场效果的应用场景说明
 * @param {string} effect - 转场效果名称
 * @returns {string} - 应用场景说明
 */
function getTransitionSceneDescription(effect) {
  const description = CONFIG_TRANSITIONS.HISTORICAL_SCENES[effect];
  return description || "通用转场效果，适用于各种场景衔接";
}

/**
 * 显示所有可用的转场效果及其应用场景
 */
function displayAvailableTransitions() {
  console.log("\n📋 可用的转场效果及应用场景：");
  console.log("━".repeat(80));

  // 基础转场效果
  console.log("\n🔧 基础转场效果：");
  const basicEffects = ["叠化", "淡入淡出", "推拉", "擦除", "无转场"];
  basicEffects.forEach((effect) => {
    console.log(
      `  • ${effect.padEnd(8)} - ${getTransitionSceneDescription(effect)}`
    );
  });

  // 历史人物专用转场效果
  console.log("\n🎭 历史人物专用转场效果：");
  const historicalEffects = [
    "时光流转",
    "岁月如歌",
    "历史回眸",
    "命运转折",
    "精神传承",
    "时代变迁",
    "心路历程",
    "光影交错",
  ];
  historicalEffects.forEach((effect) => {
    console.log(
      `  • ${effect.padEnd(8)} - ${getTransitionSceneDescription(effect)}`
    );
  });

  console.log("━".repeat(80));
}

/**
 * 清理临时文件
 * @param {string[]} tempFiles - 临时文件路径数组
 */
async function cleanupTempFiles(tempFiles) {
  console.log(`正在清理临时文件...`);
  for (const file of tempFiles) {
    try {
      if (await fs.pathExists(file)) {
        await fs.remove(file);
        console.log(`已删除临时文件: ${file}`);
      }
    } catch (e) {
      console.warn(`清理临时文件失败: ${file}`, e.message);
    }
  }
}

/**
 * 生成配置的哈希值，用于缓存检查
 * @param {Object} config - 配置对象
 * @returns {string} - 配置的MD5哈希值
 */
function generateConfigHash(config) {
  const {
    urls,
    videoReplaceUrls,
    switch: transitionEffect,
    transitions,
  } = config;

  // 创建用于哈希的配置对象，只包含影响输出的关键参数
  const hashConfig = {
    urls: urls || [],
    videoReplaceUrls: videoReplaceUrls || [],
    transitionEffect: transitionEffect || "叠化",
    transitions: transitions || [],
  };

  // 生成配置的JSON字符串并计算MD5
  const configStr = JSON.stringify(hashConfig, null, 0);
  return crypto.createHash("md5").update(configStr).digest("hex");
}

/**
 * 检查是否存在有效的缓存视频
 * @param {string} configHash - 配置哈希值
 * @param {string} outputDir - 输出目录
 * @returns {Promise<string|null>} - 缓存视频路径或null
 */
async function checkCachedVideo(configHash, outputDir) {
  try {
    // 缓存信息文件路径
    const cacheInfoPath = path.join(outputDir, ".merge-cache.json");

    // 检查缓存信息文件是否存在
    if (!(await fs.pathExists(cacheInfoPath))) {
      return null;
    }

    // 读取缓存信息
    const cacheInfo = JSON.parse(await fs.readFile(cacheInfoPath, "utf-8"));

    // 检查配置哈希是否匹配
    if (cacheInfo.configHash !== configHash) {
      console.log(`📋 配置已变更，缓存无效`);
      return null;
    }

    // 检查缓存的视频文件是否存在
    if (!(await fs.pathExists(cacheInfo.videoPath))) {
      console.log(`📋 缓存视频文件不存在: ${cacheInfo.videoPath}`);
      return null;
    }

    // 检查缓存时间（可选：设置缓存过期时间）
    const cacheAge = Date.now() - cacheInfo.timestamp;
    const maxCacheAge = 24 * 60 * 60 * 1000; // 24小时

    if (cacheAge > maxCacheAge) {
      console.log(
        `📋 缓存已过期 (${Math.floor(cacheAge / (60 * 60 * 1000))}小时前)`
      );
      return null;
    }

    console.log(`✅ 找到有效缓存视频: ${cacheInfo.videoPath}`);
    console.log(
      `📋 缓存时间: ${new Date(cacheInfo.timestamp).toLocaleString()}`
    );

    return cacheInfo.videoPath;
  } catch (error) {
    console.warn(`⚠️ 检查缓存时出错: ${error.message}`);
    return null;
  }
}

/**
 * 保存缓存信息
 * @param {string} configHash - 配置哈希值
 * @param {string} videoPath - 视频文件路径
 * @param {string} outputDir - 输出目录
 * @param {Object} config - 原始配置对象（可选）
 */
async function saveCacheInfo(configHash, videoPath, outputDir, config = {}) {
  try {
    const cacheInfoPath = path.join(outputDir, ".merge-cache.json");

    const cacheInfo = {
      configHash,
      videoPath,
      timestamp: Date.now(),
      config: {
        // 保存一些基本信息用于调试
        urlsCount: config.urls?.length || 0,
        hasVideoReplace: !!config.videoReplaceUrls?.length,
        transitionEffect: config.switch || "叠化",
        hasTransitions: !!config.transitions?.length,
      },
    };

    await fs.writeFile(
      cacheInfoPath,
      JSON.stringify(cacheInfo, null, 2),
      "utf-8"
    );
    console.log(`💾 缓存信息已保存: ${cacheInfoPath}`);
  } catch (error) {
    console.warn(`⚠️ 保存缓存信息失败: ${error.message}`);
  }
}

/**
 * 主函数：执行 merge-video 命令
 * @param {Object} config - 配置对象
 */
export default async function runMergeVideo(config) {
  if (!config) {
    throw new Error("缺少 merge-video 配置");
  }

  const {
    urls,
    switch: transitionEffect,
    transitions,
    videoReplaceUrls,
    useCacheVideo = true, // 新增参数，默认为true（使用缓存）
  } = config;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    throw new Error("配置中缺少 urls 数组或数组为空");
  }

  console.log(`\n开始处理 merge-video 任务...`);
  console.log(`视频数量: ${urls.length}`);
  console.log(
    `缓存模式: ${useCacheVideo ? "✅ 启用 (使用已下载的视频)" : "🔄 禁用 (强制重新下载)"}`
  );

  // 智能缓存检查：如果启用缓存且配置未变更，直接返回缓存的视频
  if (useCacheVideo) {
    const outputDir = path.resolve(CONFIG_PATHS.OUTPUT_DIR);
    await fs.mkdir(outputDir, { recursive: true });

    const configHash = generateConfigHash(config);
    console.log(`📋 配置哈希: ${configHash.substring(0, 8)}...`);

    const cachedVideoPath = await checkCachedVideo(configHash, outputDir);
    if (cachedVideoPath) {
      console.log(`\n🚀 使用缓存视频，跳过重新处理`);
      console.log(`📁 缓存视频路径: ${cachedVideoPath}`);

      // 显示缓存视频信息
      try {
        const finalInfo = await getVideoInfo(cachedVideoPath);
        console.log(
          `📊 缓存视频信息: ${finalInfo.width}x${finalInfo.height}, ${finalInfo.fps}fps, 时长: ${finalInfo.duration.toFixed(2)}s`
        );
      } catch (e) {
        console.warn("无法获取缓存视频信息:", e.message);
      }

      return cachedVideoPath;
    }
  }

  // 支持两种配置方式：
  // 1. switch: "统一转场效果" (原有方式)
  // 2. transitions: ["转场1", "转场2", ...] (新方式，为每个转场单独设置)
  let effectNames = [];

  if (transitions && Array.isArray(transitions)) {
    // 新方式：为每个转场单独设置效果
    effectNames = transitions;
    console.log(`使用分别设置的转场效果`);
  } else {
    // 原有方式：统一转场效果
    const effectName = transitionEffect || "叠化";
    effectNames = new Array(urls.length - 1).fill(effectName);
    console.log(`使用统一转场效果: ${effectName}`);
  }

  // 确保转场效果数量正确（应该比视频数量少1）
  if (effectNames.length !== urls.length - 1) {
    console.warn(
      `⚠️ 转场效果数量(${effectNames.length})与视频间隔数量(${urls.length - 1})不匹配`
    );
    // 自动调整：不足的用第一个效果填充，多余的截断
    while (effectNames.length < urls.length - 1) {
      effectNames.push(effectNames[0] || "叠化");
    }
    effectNames = effectNames.slice(0, urls.length - 1);
  }

  console.log(`\n开始处理 merge-video 任务...`);
  console.log(`视频数量: ${urls.length}`);
  console.log(
    `缓存模式: ${useCacheVideo ? "✅ 启用 (使用已下载的视频)" : "🔄 禁用 (强制重新下载)"}`
  );

  // 显示优化配置
  showOptimizationInfo();

  // 显示转场效果配置
  console.log(`转场效果配置:`);
  effectNames.forEach((effect, index) => {
    const sceneDescription = getTransitionSceneDescription(effect);
    console.log(
      `  视频${index + 1} → 视频${index + 2}: ${effect} (${sceneDescription})`
    );
  });

  console.log(`\n视频列表:`);
  urls.forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`);
  });

  // 检查是否有不支持的转场效果
  const unsupportedEffects = effectNames.filter(
    (effect) => !CONFIG_TRANSITIONS.SUPPORTED_EFFECTS.includes(effect)
  );

  if (unsupportedEffects.length > 0) {
    console.warn(`⚠️  发现不支持的转场效果: ${unsupportedEffects.join(", ")}`);
    displayAvailableTransitions();
    console.log(`\n不支持的效果将使用默认转场效果: 叠化`);

    // 替换不支持的效果
    for (let i = 0; i < effectNames.length; i++) {
      if (!CONFIG_TRANSITIONS.SUPPORTED_EFFECTS.includes(effectNames[i])) {
        effectNames[i] = "叠化";
      }
    }
  }

  try {
    const inputDir = path.resolve(CONFIG_PATHS.INPUT_DIR);
    const outputDir = path.resolve(CONFIG_PATHS.OUTPUT_DIR);

    // 获取目标比例配置（默认 9:16）
    const targetAspect = config.aspectRatio || "9:16";
    console.log(`🎯 目标视频比例: ${targetAspect}`);

    // 1. 处理所有视频（下载远程视频，解析本地路径）
    console.log(`\n[1/4] 准备视频文件...`);
    const videoPaths = [];
    const tempFiles = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`处理视频 ${i + 1}/${urls.length}: ${url}`);

      // 检查是否是远程视频（包括 CLIP: 格式）
      if (
        url.startsWith("https://") ||
        url.startsWith("http://") ||
        url.startsWith("CLIP:")
      ) {
        // 远程视频，需要下载（downloadVideo 会处理 CLIP: 格式）
        const downloadedPath = await downloadVideo(
          url,
          inputDir,
          useCacheVideo
        );
        videoPaths.push(downloadedPath);
        tempFiles.push(downloadedPath); // 标记为临时文件，用于后续清理
      } else {
        // 本地视频
        const localPath = resolvePath(url);
        const exists = await fs.pathExists(localPath);
        if (!exists) {
          throw new Error(`本地视频文件不存在: ${localPath}`);
        }
        videoPaths.push(localPath);
        console.log(`使用本地视频: ${localPath}`);
      }
    }

    // 2. 转换视频比例（如果需要）
    console.log(`\n[2/4] 检查并转换视频比例...`);
    const convertedVideoPaths = [];
    for (let i = 0; i < videoPaths.length; i++) {
      console.log(`\n检查视频 ${i + 1}/${videoPaths.length} 的比例...`);
      const convertedPath = await convertToAspectRatio(
        videoPaths[i],
        targetAspect,
        outputDir
      );
      convertedVideoPaths.push(convertedPath);

      // 如果生成了新文件，标记为临时文件
      if (convertedPath !== videoPaths[i]) {
        tempFiles.push(convertedPath);
      }
    }

    // 3. 合并视频
    console.log(`\n[3/4] 合并视频文件...`);
    const mergedVideoPath = await mergeVideos(
      convertedVideoPaths,
      effectNames,
      outputDir,
      useCacheVideo // 传递 useCacheVideo 参数
    );

    // 4. 清理临时文件（包括下载的远程视频和转换后的视频）
    if (tempFiles.length > 0) {
      if (useCacheVideo) {
        console.log(`\n[4/4] 保留临时文件用作缓存 (useCacheVideo=true)`);
        console.log(`📁 保留的缓存文件数量: ${tempFiles.length}`);
        for (const file of tempFiles) {
          console.log(`   - ${file}`);
        }
      } else {
        console.log(`\n[4/4] 清理临时文件 (useCacheVideo=false)...`);
        await cleanupTempFiles(tempFiles);
      }
    } else {
      console.log(`\n[4/4] 无需清理临时文件`);
    }

    // 处理视频片段替换（如果配置了 videoReplaceUrls）
    let finalVideoPath = mergedVideoPath;
    if (
      videoReplaceUrls &&
      Array.isArray(videoReplaceUrls) &&
      videoReplaceUrls.length > 0
    ) {
      console.log(`\n🔄 开始处理视频片段替换...`);
      finalVideoPath = await replaceVideoSegments(
        mergedVideoPath,
        videoReplaceUrls,
        outputDir,
        inputDir,
        useCacheVideo // 传递useCacheVideo参数
      );

      // 如果生成了新视频，将原合并视频标记为临时文件
      if (finalVideoPath !== mergedVideoPath) {
        tempFiles.push(mergedVideoPath);
      }
    }

    console.log(`\n✅ merge-video 任务完成！`);
    console.log(`🎬 合并后视频: ${finalVideoPath}`);

    // 显示最终视频信息
    try {
      const finalInfo = await getVideoInfo(finalVideoPath);
      console.log(
        `📊 最终视频信息: ${finalInfo.width}x${finalInfo.height}, ${finalInfo.fps}fps, 时长: ${finalInfo.duration.toFixed(2)}s`
      );
    } catch (e) {
      console.warn("无法获取最终视频信息:", e.message);
    }

    // 保存缓存信息（如果启用缓存）
    if (useCacheVideo) {
      const configHash = generateConfigHash(config);
      await saveCacheInfo(configHash, finalVideoPath, outputDir, config);
    }

    // 最终清理（包括原合并视频，如果有替换的话）
    if (tempFiles.length > 0 && finalVideoPath !== mergedVideoPath) {
      if (useCacheVideo) {
        console.log(`\n[清理] 保留中间文件用作缓存 (useCacheVideo=true)`);
        console.log(`📁 保留的中间文件:`);
        for (const file of tempFiles) {
          if (await fs.pathExists(file)) {
            console.log(`   - ${file}`);
          }
        }
      } else {
        console.log(`\n[清理] 清理中间文件 (useCacheVideo=false)...`);
        for (const file of tempFiles) {
          try {
            if (await fs.pathExists(file)) {
              await fs.remove(file);
              console.log(`已删除中间文件: ${file}`);
            }
          } catch (err) {
            console.warn(`清理文件失败: ${file}`, err.message);
          }
        }
      }
    }

    // 返回最终视频路径
    return finalVideoPath;
  } catch (error) {
    console.error(`\n❌ merge-video 任务失败:`, error.message);
    throw error;
  }
}

/**
 * 显示所有可用转场效果的帮助信息
 * 可以通过 npx node-ffmpeg-tools merge-video --help 调用
 */
export function showTransitionHelp() {
  console.log("\n🎬 merge-video 转场效果使用指南");
  console.log("═".repeat(80));

  console.log("\n📖 使用方法：");
  console.log("在 config.mjs 的 merge-video 配置中设置 switch 参数：");
  console.log("```javascript");
  console.log('"merge-video": {');
  console.log('  urls: ["视频1", "视频2"],');
  console.log('  switch: "时光流转"  // 选择合适的转场效果');
  console.log("}");
  console.log("```");

  displayAvailableTransitions();

  console.log("\n💡 使用建议：");
  console.log("• 根据历史人物故事的情感基调选择合适的转场效果");
  console.log('• 重要历史时刻建议使用"历史回眸"或"命运转折"');
  console.log('• 温馨的成长历程适合使用"岁月如歌"');
  console.log('• 跨越时间的叙事推荐"时光流转"或"时代变迁"');
  console.log('• 表现精神传承时使用"精神传承"效果最佳');

  console.log("\n═".repeat(80));
}
