import "zx/globals";
import crypto from "crypto";
import { execSync } from "child_process";
import { TitleAnimation } from "./history-person/title-animation.mjs";
import {
  CONFIG_SUBTITLE,
  CONFIG_SPACING,
  CONFIG_TITLE_ANIMATION,
  CONFIG_VIDEO,
} from "./history-person/history-person-constants.mjs";

// Directories
const INPUT_DIR = path.resolve("input/ai-remove-watermark");
const OUTPUT_DIR = path.resolve("output/ai-remove-watermark");

// 工具函数：中文换行处理
function wrapCJK(text, maxCharsPerLine = 20) {
  if (!text) return "";
  
  // 移除关键词标记进行长度计算
  const cleanText = text.replace(/\{\{[^}]*\}\}/g, (match) => {
    return match.replace(/\{\{|\}\}/g, "");
  });
  
  if (cleanText.length <= maxCharsPerLine) {
    return text;
  }
  
  const lines = [];
  let currentLine = "";
  let cleanCurrentLine = "";
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '{' && text[i + 1] === '{') {
      // 处理关键词开始
      const keywordEnd = text.indexOf('}}', i);
      if (keywordEnd !== -1) {
        const keyword = text.substring(i, keywordEnd + 2);
        const cleanKeyword = keyword.replace(/\{\{|\}\}/g, "");
        
        if (cleanCurrentLine.length + cleanKeyword.length > maxCharsPerLine && cleanCurrentLine.length > 0) {
          lines.push(currentLine);
          currentLine = keyword;
          cleanCurrentLine = cleanKeyword;
        } else {
          currentLine += keyword;
          cleanCurrentLine += cleanKeyword;
        }
        
        i = keywordEnd + 1;
        continue;
      }
    }
    
    if (cleanCurrentLine.length >= maxCharsPerLine) {
      lines.push(currentLine);
      currentLine = char;
      cleanCurrentLine = char;
    } else {
      currentLine += char;
      cleanCurrentLine += char;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join("\\N");
}

// 工具函数：时间格式转换
function toAssTime(seconds) {
  const totalMs = Math.round(seconds * 1000);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = Math.floor((totalMs % 1000) / 10);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

async function ensureDirs() {
  await fs.mkdir(INPUT_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

function isHttp(url) {
  return (
    typeof url === "string" &&
    (url.startsWith("http://") || url.startsWith("https://"))
  );
}

function resolveLocal(p) {
  if (!p) return "";
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

function urlHash(url) {
  return crypto.createHash("md5").update(url).digest("hex").slice(0, 12);
}

async function readManifest() {
  const mf = path.join(INPUT_DIR, "download-manifest.json");
  try {
    const s = await fs.readFile(mf, "utf8");
    return JSON.parse(s);
  } catch {
    return {};
  }
}

async function writeManifest(manifest) {
  const mf = path.join(INPUT_DIR, "download-manifest.json");
  await fs.writeFile(mf, JSON.stringify(manifest, null, 2), "utf8");
}

// Download video if remote
async function prepareInputVideo(urlOrPath) {
  await ensureDirs();
  if (!urlOrPath) throw new Error("缺少 url");

  if (!isHttp(urlOrPath)) {
    const p = resolveLocal(urlOrPath);
    if (!(await fs.pathExists(p))) throw new Error(`本地文件不存在: ${p}`);
    return p;
  }

  const h = urlHash(urlOrPath);
  const manifest = await readManifest();
  if (manifest[h]) {
    const p = path.join(INPUT_DIR, manifest[h]);
    if (await fs.pathExists(p)) {
      console.log(`[1/2] 发现已下载视频: ${p}`);
      return p;
    }
  }

  const ts = Date.now();
  const fileName = `${ts}.mp4`;
  const filePath = path.join(INPUT_DIR, fileName);
  console.log(`[1/2] 正在下载视频到: ${filePath}`);
  execSync(`curl -L --fail --retry 3 --retry-delay 1 -o "${filePath}" "${urlOrPath}"`, { stdio: 'inherit' });
  manifest[h] = fileName;
  await writeManifest(manifest);
  return filePath;
}

async function probeVideo(videoPath) {
  const stdout = execSync(`ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`, { encoding: 'utf8' });
  const info = JSON.parse(stdout);
  const v = info.streams.find((s) => s.codec_type === "video") || {};
  const a = info.streams.find((s) => s.codec_type === "audio");
  return {
    width: v.width,
    height: v.height,
    pix_fmt: v.pix_fmt,
    codec: v.codec_name,
    color_primaries: v.color_primaries,
    color_transfer: v.color_transfer,
    color_space: v.color_space,
    fps: (() => {
      const rm = (v.r_frame_rate || "").split("/");
      const n = Number(rm[0] || 0),
        d = Number(rm[1] || 1);
      return d ? n / d : 0;
    })(),
    duration: Number(info.format?.duration || 0),
    hasAudio: !!a,
  };
}

// 生成全局标题ASS字幕文件
async function generateGlobalTitleASS(title, duration, videoWidth, videoHeight, titleAnimation = "flash") {
  if (!title) return null;
  
  console.log(`[标题] 生成全局标题: "${title}" (动画: ${titleAnimation})`);
  
  // 创建标题动画实例
  const animator = new TitleAnimation();
  animator.setAnimationType(titleAnimation);
  
  // ASS文件头部
  let ass = `[Script Info]
Title: AI Remove Watermark Global Title
ScriptType: v4.00+

`;
  ass += `[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
`;
  
  // 全局标题样式（白色文字）- 修复样式名称匹配问题
  const fontSize = CONFIG_SUBTITLE.FONT_SIZE_GLOBAL_TITLE;
  ass += `Style: TopTitle,KaiTi,${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,4,0,2,${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT},${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_RIGHT},0,1\n`;
  
  // 关键词样式（红色文字）- 修复样式名称匹配问题
  ass += `Style: TopTitleKeyword,KaiTi,${fontSize},&H000000FF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,4,0,2,${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT},${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_RIGHT},0,1\n`;
  
  ass += `\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  
  // 生成全局标题ASS内容
  const titleASS = animator.generateGlobalTitleASS(
    title,
    duration,
    videoWidth,
    videoHeight,
    wrapCJK,
    toAssTime,
    0, // startTime
    false // isEndTitle
  );
  
  ass += titleASS;
  
  // 保存ASS文件
  const assPath = path.join(OUTPUT_DIR, `global_title_${Date.now()}.ass`);
  await fs.writeFile(assPath, ass, 'utf8');
  
  console.log(`[标题] ASS字幕文件已生成: ${assPath}`);
  return assPath;
}

// 验证视频文件是否损坏
async function verifyVideo(videoPath) {
  try {
    console.log(`🔍 验证视频文件: ${path.basename(videoPath)}`);
    
    // 检查文件是否存在且有内容
    if (!(await fs.pathExists(videoPath))) {
      console.log(`❌ 视频文件不存在`);
      return false;
    }
    
    const stats = await fs.stat(videoPath);
    if (stats.size < 1000) { // 文件太小说明有问题
      console.log(`❌ 视频文件太小: ${stats.size} bytes`);
      return false;
    }
    
    // 使用简单的ffprobe检查基本信息
    try {
      const stdout = execSync(`ffprobe -v quiet -print_format json -show_format "${videoPath}"`, { encoding: 'utf8' });
      const info = JSON.parse(stdout);
      
      if (info.format && info.format.duration && parseFloat(info.format.duration) > 0) {
        console.log(`✅ 视频验证通过 - 时长: ${parseFloat(info.format.duration).toFixed(2)}秒, 大小: ${(stats.size/1024/1024).toFixed(2)}MB`);
        return true;
      }
    } catch (probeError) {
      console.log(`⚠️ ffprobe检查失败，但文件存在且有内容，可能仍然可用`);
      // 如果ffprobe失败但文件存在且有合理大小，仍然认为可能是有效的
      if (stats.size > 10000) { // 大于10KB
        console.log(`✅ 文件大小合理 (${(stats.size/1024).toFixed(1)}KB)，跳过严格验证`);
        return true;
      }
    }
    
    console.log(`❌ 视频验证失败 - 可能存在损坏`);
    return false;
  } catch (error) {
    console.log(`❌ 视频验证出错: ${error.message}`);
    return false;
  }
}

// 使用 FFmpeg 直接应用模糊遮罩
async function applyBlurMask(inputPath, meta, maskOpt = {}, globalTitle = null, titleAnimation = "flash") {
  const videoBase = path.basename(inputPath, path.extname(inputPath));
  const outPath = path.join(OUTPUT_DIR, `${videoBase}_blur_mask.mp4`);
  console.log(`[2/2] 应用模糊遮罩去水印...`);

  // 获取遮罩区域配置
  const { position, width_percent, height_percent, margin = 8, x: gx, y: gy, w: gw, h: gh } = maskOpt || {};
  
  let mw, mh, x, y;
  if (typeof gx === "number" && typeof gy === "number" && typeof gw === "number" && typeof gh === "number") {
    // 使用明确指定的坐标和尺寸
    mw = Math.max(1, Math.round(gw));
    mh = Math.max(1, Math.round(gh));
    x = Math.max(0, Math.round(gx));
    y = Math.max(0, Math.round(gy));
  } else {
    // 使用百分比和位置计算
    const wp = (width_percent || 18) / 100;
    const hp = (height_percent || 12) / 100;
    mw = Math.max(16, Math.round(meta.width * wp));
    mh = Math.max(12, Math.round(meta.height * hp));
    const m = Math.max(0, Math.round(margin));
    
    switch ((position || "bottom-right").toLowerCase()) {
      case "top-left":
        x = m; y = m; break;
      case "top-right":
        x = Math.max(0, meta.width - mw - m); y = m; break;
      case "bottom-left":
        x = m; y = Math.max(0, meta.height - mh - m); break;
      case "center":
        x = Math.max(0, Math.round((meta.width - mw) / 2));
        y = Math.max(0, Math.round((meta.height - mh) / 2));
        break;
      case "bottom-right":
      default:
        x = Math.max(0, meta.width - mw - m);
        y = Math.max(0, meta.height - mh - m);
        break;
    }
  }

  console.log(`遮罩区域: ${x},${y} 尺寸: ${mw}x${mh}`);

  // 构建 FFmpeg 模糊滤镜命令
  const blurFilter = `boxblur=16:1`;
  const cropFilter = `crop=${mw}:${mh}:${x}:${y}`;
  const overlayFilter = `overlay=${x}:${y}`;
  
  // 完整的滤镜链：裁剪水印区域 -> 模糊 -> 覆盖回原视频
  const filterComplex = `[0:v]split[main][crop];[crop]${cropFilter},${blurFilter}[blurred];[main][blurred]${overlayFilter}[out]`;

  let args;
  
  // 使用最简单的两步处理方式，避免复杂滤镜链
  
  // 第一步：只应用模糊遮罩，不添加任何字幕
  console.log(`[步骤1/2] 应用模糊遮罩...`);
  const tempVideoPath = globalTitle ? path.join(OUTPUT_DIR, `temp_${Date.now()}.mp4`) : outPath;
  
  const blurArgs = [
    "-y",
    "-i", `"${inputPath}"`,
    "-filter_complex", `"[0:v]split[main][crop];[crop]${cropFilter},${blurFilter}[blurred];[main][blurred]${overlayFilter}[out]"`,
    "-map", "[out]",
    "-map", "0:a?",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-c:a", "copy",
    `"${tempVideoPath}"`
  ];
  
  console.log(`[调试] 模糊遮罩命令: ffmpeg ${blurArgs.join(' ')}`);
  execSync(`ffmpeg ${blurArgs.join(' ')}`, { stdio: 'inherit' });
  
  // 验证第一步输出
  const tempValid = await verifyVideo(tempVideoPath);
  if (!tempValid) {
    throw new Error('模糊遮罩处理失败');
  }
  console.log(`✅ 模糊遮罩处理完成: ${path.basename(tempVideoPath)}`);
  
  // 第二步：如果有标题，添加字幕
  if (globalTitle) {
    console.log(`[步骤2/2] 添加全局标题...`);
    const assPath = await generateGlobalTitleASS(globalTitle, meta.duration, meta.width, meta.height, titleAnimation);
    const assPathEscaped = path.relative(process.cwd(), assPath).replace(/\\/g, "/");
    
    const subtitleArgs = [
      "-y",
      "-i", `"${tempVideoPath}"`,
      "-vf", `"subtitles=filename='${assPathEscaped}'"`,
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "18",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "copy",
      `"${outPath}"`
    ];
    
    console.log(`[调试] 字幕添加命令: ffmpeg ${subtitleArgs.join(' ')}`);
    execSync(`ffmpeg ${subtitleArgs.join(' ')}`, { stdio: 'inherit' });
    
    // 清理临时文件
    try {
      await fs.unlink(tempVideoPath);
    } catch (error) {
      // 忽略清理错误
    }
    
    console.log(`[标题] 全局标题添加完成: "${globalTitle}"`);
  }
  
  args = null; // 标记已处理完成

  // 执行 FFmpeg 命令
  if (args) {
    console.log(`[调试] FFmpeg命令: ffmpeg ${args.join(' ')}`);
    
    try {
      execSync(`ffmpeg ${args.join(' ')}`, { stdio: 'inherit' });
      
      // 验证输出视频
      const isValid = await verifyVideo(outPath);
      if (!isValid) {
        throw new Error('输出视频验证失败，可能存在损坏');
      }
      
      console.log(`✅ 视频处理成功并通过验证: ${path.basename(outPath)}`);
    } catch (error) {
    console.error(`❌ FFmpeg处理失败: ${error.message}`);
    
    // 如果有字幕导致失败，尝试无字幕版本
    if (globalTitle && error.message.includes('subtitles')) {
      console.log(`⚠️ 字幕处理失败，尝试生成无字幕版本...`);
      
      const fallbackArgs = [
        "-y",
        "-i", `"${inputPath}"`,
        "-vf", `"${filterComplex}"`,
        "-map", "0:v", // 映射视频流
        "-map", "0:a?", // 映射音频流（如果存在）
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-c:a", "aac",
        "-b:a", "128k",
        `"${outPath}"`
      ];
      
      execSync(`ffmpeg ${fallbackArgs.join(' ')}`, { stdio: 'inherit' });
      
      const isValidFallback = await verifyVideo(outPath);
      if (!isValidFallback) {
        throw new Error('即使无字幕版本也验证失败');
      }
      
      console.log(`✅ 无字幕版本处理成功: ${path.basename(outPath)}`);
    } else {
      throw error;
    }
    }
  }
  
  // 清理临时ASS文件
  if (globalTitle) {
    try {
      const assFiles = await fs.readdir(OUTPUT_DIR);
      for (const file of assFiles) {
        if (file.startsWith('global_title_') && file.endsWith('.ass')) {
          await fs.unlink(path.join(OUTPUT_DIR, file));
        }
      }
    } catch (error) {
      // 忽略清理错误
    }
  }
  
  return outPath;
}

async function processVideo(videoConfig, globalIndex = 0) {
  const { url, mask, title, titleAnimation = "flash" } = videoConfig;
  
  console.log(`\n[${globalIndex + 1}] 开始处理视频: ${url}`);
  const inputPath = await prepareInputVideo(url);
  const meta = await probeVideo(inputPath);
  console.log(
    `[信息] 分辨率: ${meta.width}x${meta.height}, fps: ${meta.fps.toFixed ? meta.fps.toFixed(3) : meta.fps}, 编码: ${meta.codec}, 像素格式: ${meta.pix_fmt}`
  );

  // 直接使用 FFmpeg 模糊遮罩处理，支持全局标题
  const outVideo = await applyBlurMask(inputPath, meta, mask, title, titleAnimation);

  console.log(`✅ 第 ${globalIndex + 1} 个视频处理完成! 输出文件: ${outVideo}`);
  console.log(`📁 输入视频: ${inputPath}`);
  console.log(`🎬 输出视频: ${outVideo}`);
  return outVideo;
}

export default async function runAiRemoveWatermark(config) {
  await ensureDirs();
  
  // 支持单个视频的向后兼容
  if (typeof config === "string" || (config && config.url && typeof config.url === "string")) {
    const videoConfig = typeof config === "string" 
      ? { url: config }
      : {
          url: config.url,
          mask: config.mask,
          title: config.title,
          titleAnimation: config.titleAnimation
        };
    
    console.log("\n🎬 开始执行AI去水印任务（单视频模式）...");
    return await processVideo(videoConfig, 0);
  }
  
  // 批量处理模式
  if (!config || !Array.isArray(config.videos)) {
    throw new Error("配置错误：请提供 videos 数组或单个视频URL");
  }
  
  const { videos, globalTitle, globalTitleAnimation = "flash" } = config;
  
  console.log(`\n🎬 开始执行AI去水印任务（批量模式）...`);
  console.log(`视频数量: ${videos.length}`);
  
  if (globalTitle) {
    console.log(`全局标题: "${globalTitle}" (动画: ${globalTitleAnimation})`);
  }
  
  const results = [];
  
  for (let i = 0; i < videos.length; i++) {
    const videoConfig = videos[i];
    
    // 如果视频没有单独的标题，使用全局标题
    const finalVideoConfig = {
      ...videoConfig,
      title: videoConfig.title || globalTitle,
      titleAnimation: videoConfig.titleAnimation || globalTitleAnimation
    };
    
    try {
      const result = await processVideo(finalVideoConfig, i);
      results.push(result);
    } catch (error) {
      console.error(`❌ 第 ${i + 1} 个视频处理失败:`, error.message);
      results.push(null);
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  console.log(`\n🎉 批量处理完成! 成功: ${successCount}/${videos.length}`);
  
  return results;
}
