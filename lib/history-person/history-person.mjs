import "zx/globals";
import crypto from "crypto";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import { TitleAnimation } from "./title-animation.mjs";
import {
  CONFIG_SUBTITLE,
  CONFIG_SPACING,
  CONFIG_WATERMARK,
  CONFIG_VIDEO,
  CONFIG_PATHS,
  CONFIG_CLEANUP,
  CONFIG_TITLE_ANIMATION,
  CONFIG_MASK,
} from "./history-person-constants.mjs";

// =============================================================================
// HELPER FUNCTIONS - 辅助函数
// =============================================================================

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
    // 确保即使出错也返回正确的结构
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

/**
 * 生成优化的FFmpeg编码参数
 * @param {string} qualityMode - 质量模式: 'high', 'balanced', 'fast', 'turbo'
 * @param {boolean} enableSpeedOptimization - 是否启用速度优化
 * @returns {string} - FFmpeg编码参数字符串
 */
function getOptimizedEncodingParams(
  qualityMode = "high",
  enableSpeedOptimization = false
) {
  const baseParams = `-c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT}`;

  // 速度优化参数：多线程 + 硬件加速检测
  const speedParams = enableSpeedOptimization
    ? `-threads 0 -thread_type slice -thread_queue_size 1024`
    : `-threads 0`;

  switch (qualityMode) {
    case "high":
      // 高质量模式：接近无损，文件稍大但质量最佳
      return `${speedParams} ${baseParams} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${enableSpeedOptimization ? CONFIG_VIDEO.PRESET_MEDIUM : CONFIG_VIDEO.PRESET_SLOW} -profile:v ${CONFIG_VIDEO.VIDEO_CODEC_PROFILE} -level ${CONFIG_VIDEO.VIDEO_CODEC_LEVEL} -tune ${CONFIG_VIDEO.TUNE_OPTION} -me_method ${CONFIG_VIDEO.MOTION_ESTIMATION} -subq ${CONFIG_VIDEO.SUBPIXEL_REFINEMENT} -refs ${CONFIG_VIDEO.REFERENCE_FRAMES} -maxrate ${CONFIG_VIDEO.MAX_BITRATE} -bufsize ${CONFIG_VIDEO.BUFFER_SIZE}`;

    case "balanced":
      // 平衡模式：质量与文件大小平衡
      return `${speedParams} ${baseParams} -crf ${CONFIG_VIDEO.CRF_VALUE_BALANCED} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} -profile:v ${CONFIG_VIDEO.VIDEO_CODEC_PROFILE} -tune ${CONFIG_VIDEO.TUNE_OPTION}`;

    case "fast":
      // 快速模式：处理速度优先
      return `${speedParams} ${baseParams} -crf ${CONFIG_VIDEO.CRF_VALUE_BALANCED} -preset ${CONFIG_VIDEO.PRESET_FAST} -tune zerolatency`;

    case "turbo":
      // 极速模式：最快处理速度，质量适中
      return `${speedParams} ${baseParams} -crf 28 -preset ultrafast -tune zerolatency -x264opts keyint=30:min-keyint=3:no-scenecut -bf 0 -refs 1 -subq 1 -me_method dia -trellis 0 -aq-mode 0`;

    default:
      return `${speedParams} ${baseParams} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_SLOW}`;
  }
}

/**
 * 获取平台特定的字体名称
 * @returns {string} - 平台特定的字体名称
 */
function getPlatformFont() {
  const platform = process.platform;

  switch (platform) {
    case "darwin": // macOS
      return "BiauKai"; // 标楷体
    case "win32": // Windows
      return "KaiTi"; // 楷体
    case "linux": // Linux
      return "AR PL UKai CN"; // Linux 下的楷体
    default:
      return "KaiTi"; // 默认楷体
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
 * 使用 AI 模型增强画质（优先使用 realesrgan-ncnn-vulkan；若不可用则使用 FFmpeg 增强链作为降级）
 * - 建议优先在裁剪/缩放之前执行，以尽可能保留细节
 * @param {string} videoPath
 * @param {string} outputDir
 * @param {{scale?:number, model?:string}} options
 * @returns {Promise<string>} 输出路径
 */
async function applyAIEnhance(videoPath, outputDir, options) {
  const scale = options?.scale ?? 2; // 放大倍数（2 或 4），后续还会标准化到 1080x1920
  const model = options?.model ?? "realesrgan-x4plus";
  const base = path.basename(videoPath, path.extname(videoPath));
  const outPath = path.join(outputDir, `${base}_ai.mp4`);

  // 尝试检测 realesrgan-ncnn-vulkan 是否可用
  let hasRealesrgan = false;
  try {
    // Windows上使用where命令而不是which
    const whichCmd =
      process.platform === "win32"
        ? "where realesrgan-ncnn-vulkan"
        : "which realesrgan-ncnn-vulkan";
    const result = execCommand(whichCmd);
    hasRealesrgan = result.stdout.trim().length > 0;
  } catch {
    hasRealesrgan = false;
  }

  if (hasRealesrgan) {
    console.log(`[4.4/5] 使用 Real-ESRGAN 增强画质（${model}, x${scale}）...`);
    // 先输出到无音视频文件（realesrgan 输出通常仅图像序列或视频无音轨），再复用原音频
    const tmpPngMp4 = path.join(outputDir, `${base}_ai_tmp.mp4`);
    const tmpEnhanced = path.join(outputDir, `${base}_ai_enhanced.mp4`);

    // 提取为无损帧序列可能很大，直接用 realesrgan 对视频输入进行处理（多数发行版支持 -i/-o 视频）
    // 若当前 realesrgan 版本不支持视频输入，用户可安装支持版本或改为帧序列模式。
    try {
      execCommand(
        `realesrgan-ncnn-vulkan -i "${videoPath}" -o "${tmpEnhanced}" -n ${model} -s ${scale}`
      );
    } catch (e) {
      console.warn(
        `[警告] Real-ESRGAN 处理失败: ${e.message}，将使用 FFmpeg 增强链`
      );
    }

    // 如果增强文件存在，则合并音轨（若有）并规范参数
    if (await fs.pathExists(tmpEnhanced)) {
      const encodingParams = getOptimizedEncodingParams(
        options?.qualityMode || "high",
        options?.enableSpeedOptimization || false
      );
      execCommand(
        `ffmpeg -y -i "${tmpEnhanced}" -i "${videoPath}" -map 0:v -map 1:a? ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${outPath}"`
      );
      // 清理临时
      await fs.remove(tmpEnhanced).catch(() => {});
      await fs.remove(tmpPngMp4).catch(() => {});
      console.log(`[4.4/5] AI 增强完成: ${outPath}`);
      return outPath;
    }
    // 若 realesrgan 执行但未生成文件，则继续走降级链
  } else {
    console.log(
      `[4.4/5] 未检测到 Real-ESRGAN，可安装 realesrgan-ncnn-vulkan 获得最佳效果。将使用 FFmpeg 增强链。`
    );
  }

  // 降级：FFmpeg 增强链（去噪 + 锐化 + 轻度对比/饱和）
  console.log(`[4.4/5] 使用 FFmpeg 增强链...`);
  const vf = `hqdn3d=1.5:1.5:6:6,unsharp=5:5:1.0:5:5:0.0,eq=contrast=1.05:brightness=0.02:saturation=1.05`;
  const encodingParams = getOptimizedEncodingParams(
    options?.qualityMode || "high",
    options?.enableSpeedOptimization || false
  );
  execCommand(
    `ffmpeg -y -i "${videoPath}" -vf "${vf}" ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${outPath}"`
  );
  console.log(`[4.4/5] FFmpeg 增强完成: ${outPath}`);
  return outPath;
}

/**
 * 在视频上添加模糊遮罩（近似圆角，使用模糊的 alpha mask 视觉等效半径≈5px）
 * @param {string} videoPath
 * @param {string} outputDir
 * @param {{x:number,y:number,w:number,h:number,sigma?:number,maskSigma?:number,qualityMode?:string}} opt
 * @returns {Promise<string>} 输出路径
 */
async function addBlurMask(videoPath, outputDir, opt) {
  const {
    x = 13,
    y = 13,
    w = 80,
    h = 35,
    sigma = 12,
    maskSigma = 3,
  } = opt || {};
  const base = path.basename(videoPath, path.extname(videoPath));
  const outPath = path.join(outputDir, `${base}_blurmask.mp4`);

  // 获取帧尺寸用于生成 mask 尺寸
  const probe = execCommand(
    `ffprobe -v quiet -print_format json -show_streams "${videoPath}"`
  );
  const info = JSON.parse(probe.stdout);
  const v = info.streams.find((s) => s.codec_type === "video");
  const W = v?.width || CONFIG_VIDEO.DEFAULT_WIDTH;
  const H = v?.height || CONFIG_VIDEO.DEFAULT_HEIGHT;

  // filtergraph 说明：
  // 1) 基础与模糊分支：对整帧做 gblur 得到[blurred]
  // 2) 生成 alpha mask：全透明底 -> 在(x,y,w,h)画白色实心框 -> 对 mask 做轻微模糊，柔化边缘（近似圆角/羽化）
  // 3) 将 [blurred] 与 [mask] alphamerge 得到带透明度的模糊层 [blurmasked]
  // 4) overlay 到原始帧顶上
  const filter = `split[base][tmp];[tmp]gblur=sigma=${sigma}[blurred];color=c=black@0:s=${W}x${H}:d=1[maskbase];[maskbase]drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=white@1:t=fill,gblur=sigma=${maskSigma}[mask];[blurred][mask]alphamerge[blurmasked];[base][blurmasked]overlay=0:0[out]`;

  const encodingParams = getOptimizedEncodingParams(
    opt?.qualityMode || "high",
    opt?.enableSpeedOptimization || false
  );
  execCommand(
    `ffmpeg -y -i "${videoPath}" -filter_complex "${filter}" -map "[out]" -map 0:a? ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${outPath}"`
  );
  return outPath;
}

/**
 * 将视频标准化为严格的目标比例与分辨率
 * - 当前实现：fitMode === 'crop'，居中微裁剪以匹配目标比例，然后缩放至目标分辨率
 * @param {string} videoPath
 * @param {string} outputDir
 * @param {{targetAspect:string, targetResolution:string, fitMode:'crop'|'pad', qualityMode?:string}} options
 * @returns {Promise<string>} 输出的视频路径
 */
async function standardizeAspect(videoPath, outputDir, options) {
  const {
    targetAspect = CONFIG_VIDEO.DEFAULT_ASPECT_RATIO,
    targetResolution = CONFIG_VIDEO.DEFAULT_RESOLUTION,
    fitMode = CONFIG_VIDEO.DEFAULT_FIT_MODE,
  } = options || {};
  if (fitMode !== "crop") {
    console.log(`[4.5/5] 当前仅实现 crop 模式，忽略其它模式: ${fitMode}`);
  }

  // 解析目标分辨率
  const m = String(targetResolution).match(/^(\d+)x(\d+)$/);
  if (!m) throw new Error(`无效的 target_resolution: ${targetResolution}`);
  const targetW = parseInt(m[1], 10);
  const targetH = parseInt(m[2], 10);

  // 解析目标比例 a:b
  const am = String(targetAspect).match(/^(\d+)\s*:\s*(\d+)$/);
  if (!am) throw new Error(`无效的 target_aspect: ${targetAspect}`);
  const arNum = parseInt(am[1], 10);
  const arDen = parseInt(am[2], 10);
  const ar = arNum / arDen;

  // 获取源信息
  const probe = execCommand(
    `ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`
  );
  const info = JSON.parse(probe.stdout);
  const v = info.streams.find((s) => s.codec_type === "video");
  if (!v) throw new Error("无法读取视频流");
  const W = v.width;
  const H = v.height;

  // 计算裁剪尺寸（保证裁剪宽高为偶数，便于编码）
  let cropW = W;
  let cropH = H;
  const srcAr = W / H;
  if (srcAr > ar) {
    // 过宽 -> 裁宽
    cropW = Math.round(H * ar);
    // 保证偶数
    if (cropW % 2) cropW -= 1;
    if (cropW < 2) cropW = 2;
  } else if (srcAr < ar) {
    // 过高 -> 裁高
    cropH = Math.round(W / ar);
    if (cropH % 2) cropH -= 1;
    if (cropH < 2) cropH = 2;
  }
  // 居中偏移，允许奇数偏移，从而在 704->702 这类情况下左右各裁 1px，不偏向一侧
  let offX = Math.max(0, Math.floor((W - cropW) / 2));
  let offY = Math.max(0, Math.floor((H - cropH) / 2));
  if (offX < 0) offX = 0;
  if (offY < 0) offY = 0;

  const filter = `crop=${cropW}:${cropH}:${offX}:${offY},scale=${targetW}:${targetH}`;
  const base = path.basename(videoPath, path.extname(videoPath));
  const outPath = path.join(outputDir, `${base}_${targetW}x${targetH}.mp4`);

  console.log(
    `[4.5/5] 强制比例: 源=${W}x${H}(${srcAr.toFixed(
      4
    )}), 目标=${arNum}:${arDen} -> 裁剪到 ${cropW}x${cropH} @ (${offX},${offY}), 缩放至 ${targetW}x${targetH}`
  );
  const encodingParams = getOptimizedEncodingParams(
    options?.qualityMode || "high",
    options?.enableSpeedOptimization || false
  );
  execCommand(
    `ffmpeg -y -i "${videoPath}" -vf "${filter}" ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${outPath}"`
  );

  console.log(
    `[4.5/5] 已输出严格 ${arNum}:${arDen} 分辨率 ${targetW}x${targetH}: ${outPath}`
  );
  return outPath;
}

/**
 * 下载视频到指定目录，避免重复下载，或处理本地文件路径
 * @param {string} url - 视频URL或本地文件路径
 * @param {string} inputDir - 输入目录
 * @returns {string} - 下载的文件路径或本地文件路径
 */
async function downloadVideo(url, inputDir) {
  await fs.mkdir(inputDir, { recursive: true });

  // 检查是否为本地文件路径
  const resolvedPath = resolvePath(url);
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    // 本地文件路径
    if (await fs.pathExists(resolvedPath)) {
      console.log(`[1/5] 使用本地视频文件: ${resolvedPath}`);
      return resolvedPath;
    } else {
      throw new Error(`本地视频文件不存在: ${resolvedPath}`);
    }
  }

  // 网络URL，需要下载
  // 生成URL哈希用于识别重复下载
  const urlHash = crypto
    .createHash("md5")
    .update(url)
    .digest("hex")
    .substring(0, CONFIG_PATHS.HASH_LENGTH);

  // 检查是否已经下载过
  const existingFiles = await fs.readdir(inputDir).catch(() => []);
  const existingFile = existingFiles.find((file) => file.includes(urlHash));

  if (existingFile) {
    const existingPath = path.join(inputDir, existingFile);
    console.log(`[1/5] 发现已下载的视频: ${existingPath}`);
    return existingPath;
  }

  // 下载新视频
  const ts = Date.now();
  const fileName = `${ts}_${urlHash}.mp4`;
  const filePath = path.join(inputDir, fileName);

  console.log(`[1/5] 正在下载视频到: ${filePath}`);
  execCommand(
    `curl -L --fail --retry 3 --retry-delay 1 -o "${filePath}" "${url}"`
  );

  return filePath;
}

/**
 * 为视频添加镜头标题（每5秒添加一个标题）
 * @param {string} videoPath - 视频文件路径
 * @param {Array} sectionTitles - 镜头标题数组
 * @param {string} outputDir - 输出目录
 * @returns {string} - 带标题的视频路径
 */
/**
 * 添加镜头标题和顶部标题到视频
 * @param {string} videoPath - 视频文件路径
 * @param {string[]} sectionTitles - 镜头标题数组
 * @param {string} outputDir - 输出目录
 * @param {string} watermark - 水印文本
 * @param {string} topTitle - 顶部标题文本
 * @param {string} titleAnimation - 标题动画效果
 * @param {string} sectionTitleAnimation - 分镜标题动画效果
 * @param {string} qualityMode - 质量模式
 * @param {number} titleDuration - 全局标题显示时长（秒）
 * @param {string} endTitle - 结尾标题文本
 * @param {number} endTitleDuration - 结尾标题显示时长（秒）
 * @param {string} endTitleAnimation - 结尾标题动画效果
 * @param {string} endTitleSound - 结尾标题声音效果
 * @param {boolean} enableSpeedOptimization - 是否启用速度优化
 * @returns {string} - 处理后的视频路径
 */
async function addSectionTitles(
  videoPath,
  sectionTitles,
  outputDir,
  watermark,
  topTitle,
  titleAnimation,
  sectionTitleAnimation,
  qualityMode,
  titleDuration,
  endTitle,
  endTitleDuration,
  endTitleAnimation,
  endTitleSound,
  enableSpeedOptimization,
  useBabyCry,
  disclaimerText,
  sectionFirstTitleTime
) {
  if (
    (!sectionTitles || sectionTitles.length === 0) &&
    !watermark &&
    !topTitle &&
    !endTitle &&
    !disclaimerText
  ) {
    console.log(`[3/5] 没有任何字幕内容，跳过字幕生成步骤`);
    return videoPath;
  }

  console.log(
    `[3/5] 开始处理字幕，标题数量: ${sectionTitles ? sectionTitles.length : 0}`
  );

  await fs.mkdir(outputDir, { recursive: true });

  const videoName = path.basename(videoPath, path.extname(videoPath));
  const tempVideoPath = path.join(
    outputDir,
    `${videoName}_with_titles_temp.mp4`
  );

  console.log(
    `[3/5] 正在添加 ${sectionTitles ? sectionTitles.length : 0} 个镜头标题...`
  );

  try {
    // 获取视频尺寸与时长
    const probe = execCommand(
      `ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`
    );
    const info = JSON.parse(probe.stdout);
    const v = info.streams.find((s) => s.codec_type === "video");
    const W = v?.width || CONFIG_VIDEO.DEFAULT_WIDTH;
    const H = v?.height || CONFIG_VIDEO.DEFAULT_HEIGHT;
    const duration =
      parseFloat(info?.format?.duration || v?.duration || 0) || 0;
    // 字体大小为 50px，提高可见性
    const fontSize = CONFIG_SUBTITLE.FONT_SIZE_TITLE;

    // 创建 ASS 字幕文件，完全控制样式（顶端左对齐、20px 顶部边距、左右 5px、自动换行、鲜艳颜色、淡入淡出）
    const assPath = path.join(
      outputDir,
      `${videoName}${CONFIG_PATHS.ASS_SUFFIX}`
    );
    let ass = "";
    ass += `[Script Info]\n`;
    ass += `ScriptType: v4.00+\n`;
    ass += `PlayResX: ${W}\n`;
    ass += `PlayResY: ${H}\n`;
    ass += `WrapStyle: 2\n`;
    ass += `ScaledBorderAndShadow: yes\n`;
    ass += `Collisions: Normal\n`;
    ass += `Timer: 100.0000\n\n`;

    ass += `[V4+ Styles]\n`;
    ass += `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n`;
    // 说明：ASS 颜色为 &HAABBGGRR（AA=alpha, 00不透明）。选用黄色文字，黑色描边。
    // Outline=3, Shadow=2 适中可读性；颜色改为黄色，居中对齐；从底部40%位置
    // Alignment=2 表示底部居中对齐，左右边距100px，底部边距设置为40%
    // 加粗字体Bold=1，字体大小适中确保完整显示
    const largerFontSize = CONFIG_SUBTITLE.FONT_SIZE_TITLE; // 字体大小设置为50px
    const bottomMargin = Math.floor(
      H * CONFIG_SUBTITLE.SUBTITLE_POSITION_Y_PERCENT
    ); // 底部40%位置
    // 设置行间距，避免多行文字重叠 - 增加到字体大小的1.8倍确保足够间距
    const lineSpacing = Math.floor(largerFontSize * 1.8); // 行间距为字体大小的1.8倍 (50px * 1.8 = 90px)
    // 字符间距设置为0，避免字符间距过大
    const charSpacing = 0; // 字符间距设置为0
    const platformFont = getPlatformFont(); // 获取平台特定字体
    ass += `Style: Title, ${platformFont}, ${largerFontSize}, &H0000FFFF, &H0000FFFF, &H80000000, &H80000000, 1, 0, 0, 0, 100, 100, ${charSpacing}, 0, 1, 3, 2, 2, ${CONFIG_SUBTITLE.LEFT_MARGIN}, ${CONFIG_SUBTITLE.RIGHT_MARGIN}, ${bottomMargin}, 0\n`;
    // 关键词样式：红色填充，黑色描边，50px字体，与Title相同，居中对齐
    ass += `Style: Keyword, ${platformFont}, ${largerFontSize}, &H000000FF, &H000000FF, &H80000000, &H80000000, 1, 0, 0, 0, 100, 100, ${charSpacing}, 0, 1, 3, 2, 2, ${CONFIG_SUBTITLE.LEFT_MARGIN}, ${CONFIG_SUBTITLE.RIGHT_MARGIN}, ${bottomMargin}, 0\n`;
    // 顶部标题样式：白色文字，黑色描边，使用配置的字体大小，顶部位置居中，无阴影
    // 说明：ASS 颜色为 &HAABBGGRR（AA=alpha, 00不透明）。白色文字，黑色描边，无阴影。
    // Alignment=8 表示顶部居中对齐，实现水平居中效果
    ass += `Style: TopTitle, ${platformFont}, ${CONFIG_SUBTITLE.FONT_SIZE_GLOBAL_TITLE}, &H80FFFFFF, &H80FFFFFF, &H00000000, &H80000000, 1, 0, 0, 0, 100, 100, 0, 0, 1, 4, 0, 8, ${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT}, ${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_RIGHT}, 0, 0\n`;
    // 顶部标题关键词样式：红色填充，黑色描边，其他参数与TopTitle相同
    ass += `Style: TopTitleKeyword, ${platformFont}, ${CONFIG_SUBTITLE.FONT_SIZE_GLOBAL_TITLE}, &H000000FF, &H000000FF, &H00000000, &H80000000, 1, 0, 0, 0, 100, 100, 0, 0, 1, 4, 0, 8, ${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT}, ${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_RIGHT}, 0, 0\n\n`;
    // 水印样式（普通字体白色，极低不透明度≈0.02 -> AA≈FA），起点/中段/终点；去除描边和阴影
    // 注意：ASS 颜色为 &HAABBGGRR，AA 越接近 FF 越透明
    // 水印使用简洁的 Arial 字体，保持良好的可读性
    ass += `Style: WM_BL, Arial, ${CONFIG_WATERMARK.FONT_SIZE}, ${CONFIG_WATERMARK.OPACITY_HEX}, ${CONFIG_WATERMARK.OPACITY_HEX}, ${CONFIG_WATERMARK.NO_OUTLINE_COLOR}, ${CONFIG_WATERMARK.NO_OUTLINE_COLOR}, 0, 0, 0, 0, 100, 100, 0, 0, 1, 0, 0, 1, ${CONFIG_SUBTITLE.LEFT_MARGIN}, ${CONFIG_SUBTITLE.RIGHT_MARGIN}, 20, 0\n`;
    ass += `Style: WM_M,  Arial, ${CONFIG_WATERMARK.FONT_SIZE}, ${CONFIG_WATERMARK.OPACITY_HEX}, ${CONFIG_WATERMARK.OPACITY_HEX}, ${CONFIG_WATERMARK.NO_OUTLINE_COLOR}, ${CONFIG_WATERMARK.NO_OUTLINE_COLOR}, 0, 0, 0, 0, 100, 100, 0, 0, 1, 0, 0, 5, ${CONFIG_SUBTITLE.LEFT_MARGIN}, ${CONFIG_SUBTITLE.RIGHT_MARGIN}, 20, 0\n`;
    ass += `Style: WM_TR, Arial, ${CONFIG_WATERMARK.FONT_SIZE}, ${CONFIG_WATERMARK.OPACITY_HEX}, ${CONFIG_WATERMARK.OPACITY_HEX}, ${CONFIG_WATERMARK.NO_OUTLINE_COLOR}, ${CONFIG_WATERMARK.NO_OUTLINE_COLOR}, 0, 0, 0, 0, 100, 100, 0, 0, 1, 0, 0, 9, ${CONFIG_SUBTITLE.LEFT_MARGIN}, ${CONFIG_SUBTITLE.RIGHT_MARGIN}, 20, 0\n`;

    ass += `\n`;

    ass += `[Events]\n`;
    ass += `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

    // 时间格式化为 h:mm:ss.cs（centiseconds）
    const toAssTime = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const cs = Math.floor((seconds % 1) * 100);
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
    };

    // 更合理的 CJK 换行：根据视频宽度和字体大小计算每行字符数
    const estCharWidthFactor = CONFIG_SUBTITLE.CHAR_WIDTH_FACTOR; // 每字符大约占用 fontSize * 0.8 宽度
    const safePadding = CONFIG_SUBTITLE.SAFE_PADDING; // 左边距100px + 右边距100px
    const usableWidth = Math.max(
      CONFIG_SUBTITLE.MIN_USABLE_WIDTH,
      W - safePadding
    ); // 去除左右边距，确保100px边距
    const maxCharsPerLine = Math.max(
      CONFIG_SUBTITLE.MIN_CHARS_PER_LINE,
      Math.floor(usableWidth / (largerFontSize * estCharWidthFactor))
    ); // 最小3字符，确保能显示

    console.log(
      `[3/5] 自动换行设置: 视频宽度=${W}px, 字体大小=${largerFontSize}px, 可用宽度=${usableWidth}px, 每行最大字符=${maxCharsPerLine}`
    );

    // 创建临时动画实例用于解析关键词
    const tempAnimator = new TitleAnimation();

    const wrapCJK = (s) => {
      const inputText = String(s).trim();

      // 检查是否包含手动换行符 \n
      if (inputText.includes("\n")) {
        // 手动换行：按 \n 分割
        const manualLines = inputText.split("\n");

        // 处理每一行，保留关键词标记但移除多余空格
        const processedLines = manualLines
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        return processedLines.join("\\N"); // 使用 ASS 换行符连接
      }

      // 自动换行：先移除关键词标记，然后进行换行处理
      const cleanText = tempAnimator.removeKeywordMarkers(inputText);
      if (cleanText.length <= maxCharsPerLine) {
        return inputText; // 短文本不换行，保留原始关键词标记
      }

      const lines = [];
      let currentLine = "";
      let currentOriginalLine = "";
      let originalIndex = 0;

      for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];

        // 如果当前行加上这个字符会超出限制，就换行
        if (currentLine.length >= maxCharsPerLine) {
          lines.push(currentOriginalLine);
          currentLine = char;
          // 重新开始构建原始行（包含关键词标记）
          currentOriginalLine = "";
          // 找到对应的原始字符位置
          while (
            originalIndex < inputText.length &&
            tempAnimator.removeKeywordMarkers(
              inputText.substring(0, originalIndex + 1)
            ).length <=
              i - currentLine.length + 1
          ) {
            originalIndex++;
          }
        } else {
          currentLine += char;
        }

        // 构建包含关键词标记的原始行
        while (
          originalIndex < inputText.length &&
          tempAnimator.removeKeywordMarkers(
            inputText.substring(0, originalIndex + 1)
          ).length <=
            i + 1
        ) {
          currentOriginalLine += inputText[originalIndex];
          originalIndex++;
        }
      }

      // 添加最后一行
      if (currentLine) {
        // 添加剩余的原始字符
        while (originalIndex < inputText.length) {
          currentOriginalLine += inputText[originalIndex];
          originalIndex++;
        }
        lines.push(currentOriginalLine);
      }

      return lines.join("\\N"); // 使用 ASS 换行符
    };

    for (let i = 0; i < sectionTitles.length; i++) {
      let start;
      let titleDuration;
      
      if (i === 0 && sectionFirstTitleTime) {
        // 第一个字幕使用特殊时长
        start = 0;
        titleDuration = sectionFirstTitleTime;
        console.log(`[3/5] 第一个字幕特殊处理: 显示时长 ${sectionFirstTitleTime}s`);
      } else if (i === sectionTitles.length - 1) {
        // 最后一个字幕在倒数第二秒开始
        start = duration - 2.0;
        titleDuration = CONFIG_SUBTITLE.SECTION_TITLE_DURATION;
      } else {
        // 其他字幕按间隔显示，需要考虑第一个字幕的特殊时长
        const firstTitleOffset = sectionFirstTitleTime || CONFIG_SUBTITLE.SECTION_TITLE_DURATION;
        if (i === 1 && sectionFirstTitleTime) {
          // 第二个字幕从第一个字幕结束后开始
          start = firstTitleOffset;
        } else {
          // 后续字幕按正常间隔计算
          const adjustedIndex = sectionFirstTitleTime ? i - 1 : i;
          start = firstTitleOffset + adjustedIndex * CONFIG_SUBTITLE.SECTION_TITLE_DURATION;
        }
        titleDuration = CONFIG_SUBTITLE.SECTION_TITLE_DURATION;
      }
      
      const end = Math.min(
        start + titleDuration - 1,
        duration
      ); // 确保不超出视频时长

      // 解析关键词并生成带颜色的打字机效果
      const parsedChars = tempAnimator.parseKeywords(sectionTitles[i]);
      const wrapped = wrapCJK(sectionTitles[i]);
      const text = wrapped.replace(/\\N/g, "\n"); // 保留换行符以便处理多行
      const lines = text.split("\n");
      const typewriterSpeed = CONFIG_SUBTITLE.TYPEWRITER_SPEED; // 每个字符显示间隔（秒）
      let totalCharIndex = 0;

      // 创建字符到关键词状态的映射
      const charKeywordMap = new Map();
      let cleanCharIndex = 0;
      for (const parsedChar of parsedChars) {
        charKeywordMap.set(cleanCharIndex, parsedChar.isKeyword);
        cleanCharIndex++;
      }

      // 处理所有行，构建完整的多行字幕（使用\N换行符）
      let fullStyledText = "";
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];

        // 解析这一行的关键词
        const lineWithKeywords = tempAnimator.parseKeywords(line);

        // 构建带样式的行内容
        let styledLine = "";
        for (const parsedChar of lineWithKeywords) {
          const escapedChar = parsedChar.char
            .replace(/{/g, "\\{")
            .replace(/}/g, "\\}");
          if (parsedChar.isKeyword) {
            styledLine += `{\\r\\c&H000000FF&}${escapedChar}{\\r}`;
          } else {
            styledLine += escapedChar;
          }
        }

        // 添加到完整文本，行间使用\N分隔
        if (lineIndex > 0) {
          fullStyledText += "\\N"; // ASS换行符
        }
        fullStyledText += styledLine;
      }

      // 根据sectionTitleAnimation生成动画效果
      let animationEffect = "";
      if (sectionTitleAnimation) {
        switch (sectionTitleAnimation) {
          case "flash":
            // 闪光效果：快速亮度变化
            animationEffect = `{\\fad(100,100)\\t(0,400,\\1a&H00&\\3a&H00&)\\t(400,800,\\1a&H80&\\3a&H80&)\\t(800,1200,\\1a&H00&\\3a&H00&)}`;
            break;
          case "fade":
            // 淡入淡出效果
            animationEffect = `{\\fad(500,500)}`;
            break;
          case "scale":
            // 缩放效果
            animationEffect = `{\\fad(200,200)\\t(0,400,\\fscx120\\fscy120)\\t(400,800,\\fscx100\\fscy100)}`;
            break;
          case "slide":
            // 滑动效果（从左滑入）
            animationEffect = `{\\fad(200,200)\\move(-100,0,0,0,0,400)}`;
            break;
          case "sweep_glow":
            // 辉光效果：淡入 + 轻微缩放 + 模糊
            animationEffect = `{\\fad(300,300)\\t(0,600,\\fscx105\\fscy105\\blur2)\\t(600,1200,\\fscx100\\fscy100\\blur0)}`;
            break;
          case "sweep_fast":
            // 快速扫光效果
            animationEffect = `{\\fad(200,200)\\t(0,300,\\1a&H40&\\3a&H40&)\\t(300,600,\\1a&H80&\\3a&H80&)}`;
            break;
          case "sweep_slow":
            // 慢速扫光效果
            animationEffect = `{\\fad(400,400)\\t(0,800,\\1a&H20&\\3a&H20&)\\t(800,1600,\\1a&H80&\\3a&H80&)}`;
            break;
          case "sweep_pulse":
            // 脉冲扫光效果
            animationEffect = `{\\fad(300,300)\\t(0,500,\\fscx110\\fscy110\\1a&H40&)\\t(500,1000,\\fscx100\\fscy100\\1a&H00&)\\t(1000,1500,\\fscx110\\fscy110\\1a&H40&)}`;
            break;
          case "sweep_rainbow":
            // 彩虹扫光效果（颜色变化）
            animationEffect = `{\\fad(200,200)\\t(0,400,\\c&H0000FF&)\\t(400,800,\\c&H00FF00&)\\t(800,1200,\\c&HFF0000&)\\t(1200,1600,\\c&H0000FFFF&)}`;
            break;
          case "sweep_wave":
            // 波浪扫光效果
            animationEffect = `{\\fad(300,300)\\t(0,600,\\blur3\\1a&H60&)\\t(600,1200,\\blur0\\1a&H00&)}`;
            break;
          case "sweep_laser":
            // 激光扫光效果
            animationEffect = `{\\fad(100,100)\\t(0,200,\\c&H00FFFF&\\1a&H00&)\\t(200,400,\\c&H0000FFFF&\\1a&H80&)}`;
            break;
          case "sweep_neon":
            // 霓虹扫光效果
            animationEffect = `{\\fad(250,250)\\t(0,500,\\c&HFF00FF&\\3c&HFF00FF&\\blur2)\\t(500,1000,\\c&H0000FFFF&\\3c&H00000000&\\blur0)}`;
            break;
          case "sweep_electric":
            // 电光扫光效果
            animationEffect = `{\\fad(150,150)\\t(0,200,\\c&H00FFFF&\\1a&H00&)\\t(200,300,\\c&H0000FFFF&\\1a&H80&)\\t(300,400,\\c&H00FFFF&\\1a&H00&)}`;
            break;
          case "sweep_diamond":
            // 钻石扫光效果
            animationEffect = `{\\fad(200,200)\\t(0,400,\\fscx105\\fscy105\\1a&H40&)\\t(400,800,\\fscx110\\fscy110\\1a&H20&)\\t(800,1200,\\fscx100\\fscy100\\1a&H00&)}`;
            break;
          case "freeze":
            // 冰冻动画效果（结冰效果）
            animationEffect = `{\\fad(250,250)\\t(0,800,\\1c&HFFFF00&\\3c&HFF8000&\\1a&H20&\\3a&H20&\\blur2\\fscx95\\fscy95)\\t(800,2000,\\1c&HFFFFFF&\\3c&H000000&\\1a&H80&\\3a&H80&\\blur0\\fscx100\\fscy100)}`;
            break;
          case "none":
            // 无动画
            animationEffect = "";
            break;
          default:
            // 默认淡入效果
            animationEffect = `{\\fad(${CONFIG_SUBTITLE.FADE_IN_OUT_MS},${CONFIG_SUBTITLE.FADE_IN_OUT_MS * 6})}`;
        }
      } else {
        // 默认淡入效果
        animationEffect = `{\\fad(${CONFIG_SUBTITLE.FADE_IN_OUT_MS},${CONFIG_SUBTITLE.FADE_IN_OUT_MS * 6})}`;
      }

      // 生成单个字幕事件，包含所有行
      ass += `Dialogue: 0,${toAssTime(start)},${toAssTime(end)},Title,,0,0,0,,${animationEffect}${fullStyledText}\n`;

      console.log(
        `[3/5] 添加居中对齐字幕 ${i + 1}/${sectionTitles.length}: "${
          sectionTitles[i]
        }" -> ${lines.length}行 (${start}s-${end}s, 动画: ${sectionTitleAnimation || "默认"})`
      );
    }

    // 添加水印动画（如果配置提供）：第1秒左下角，最后1秒右上角，中间走弧线（两段直线近似）
    if (watermark && duration > 0) {
      const wmEsc = String(watermark)
        .replace(/\\/g, "\\\\")
        .replace(/{/g, "\\{")
        .replace(/}/g, "\\}");
      const wmLen = Array.from(String(watermark)).length;
      const fsz = CONFIG_WATERMARK.FONT_SIZE;
      const estW = Math.max(1, wmLen * fsz * 0.6);
      const estH = fsz;
      // 以中心对齐估算移动路径，使用配置的水印边距
      const cx1 = Math.max(CONFIG_SPACING.WATERMARK_MARGIN + estW / 2, 0);
      const cy1 = Math.max(H - CONFIG_SPACING.WATERMARK_MARGIN - estH / 2, 0);
      const cx2 = Math.max(W - CONFIG_SPACING.WATERMARK_MARGIN - estW / 2, 0);
      const cy2 = Math.max(CONFIG_SPACING.WATERMARK_MARGIN + estH / 2, 0);
      // 取中点，向上抬高形成弧线效果
      const mx = Math.floor(W / 2);
      const my = Math.floor(H * CONFIG_WATERMARK.ARC_CENTER_Y_PERCENT); // 折线中点更靠上，形成弧线观感
      const t1 = CONFIG_WATERMARK.MOVEMENT_START_MS; // 1s 开始移动
      const tEnd = Math.max(
        0,
        Math.floor(duration * 1000) - CONFIG_WATERMARK.STAY_END_MS
      ); // 倒数1s 开始停留
      const travelMs = Math.max(0, tEnd - t1);
      const halfMs = Math.floor(travelMs / CONFIG_WATERMARK.HALF_WAY_FACTOR);
      // 0-1s：左下角停留（使用配置的水印边距）
      ass += `Dialogue: 0,${toAssTime(0)},${toAssTime(
        1
      )},WM_BL,,0,0,0,,{\\pos(${CONFIG_SPACING.WATERMARK_MARGIN},${
        H - CONFIG_SPACING.WATERMARK_MARGIN
      })}${wmEsc}\n`;
      // 1s-中点：BL -> Mid
      ass += `Dialogue: 0,${toAssTime(1)},${toAssTime(
        1 + travelMs / CONFIG_WATERMARK.TRAVEL_DURATION_FACTOR
      )},WM_M,,0,0,0,,{\\move(${cx1},${cy1},${mx},${my},0,${halfMs})}${wmEsc}\n`;
      // 中点-最后1s：Mid -> TR
      ass += `Dialogue: 0,${toAssTime(
        1 + travelMs / CONFIG_WATERMARK.TRAVEL_DURATION_FACTOR
      )},${toAssTime(
        Math.max(1, duration - 1)
      )},WM_M,,0,0,0,,{\\move(${mx},${my},${cx2},${cy2},0,${Math.max(
        0,
        travelMs - halfMs
      )})}${wmEsc}\n`;
      // 最后1s：右上角停留（使用配置的水印边距）
      const endStart = Math.max(0, duration - 1.0);
      ass += `Dialogue: 0,${toAssTime(endStart)},${toAssTime(
        duration
      )},WM_TR,,0,0,0,,{\\pos(${W - CONFIG_SPACING.WATERMARK_MARGIN},${
        CONFIG_SPACING.WATERMARK_MARGIN
      })}${wmEsc}\n`;
    }

    // 添加顶部标题（如果配置提供）：使用动画类生成
    if (topTitle && duration > 0) {
      // 创建动画实例并设置动画类型
      const titleAnimator = new TitleAnimation();
      if (titleAnimation) {
        titleAnimator.setAnimationType(titleAnimation);
      }

      // 使用自定义时长或默认时长
      const actualTitleDuration =
        titleDuration && titleDuration > 0 ? titleDuration : duration;
      console.log(`[3/5] 全局标题显示时长: ${actualTitleDuration}s`);

      // 使用动画类生成全局标题ASS内容
      const globalTitleASS = titleAnimator.generateGlobalTitleASS(
        topTitle,
        actualTitleDuration,
        W,
        H,
        wrapCJK,
        toAssTime
      );

      ass += globalTitleASS;
    }

    // 添加结尾标题（如果配置提供）
    if (endTitle && duration > (endTitleDuration || 2)) {
      const finalEndTitleDuration = endTitleDuration || 2;
      console.log(
        `[3/5] 添加结尾标题: "${endTitle}" (时长: ${finalEndTitleDuration}秒)`
      );

      // 创建动画实例并设置动画类型
      const endTitleAnimator = new TitleAnimation();
      const finalEndTitleAnimation = endTitleAnimation || titleAnimation;
      if (finalEndTitleAnimation) {
        endTitleAnimator.setAnimationType(finalEndTitleAnimation);
      }

      // 结尾标题在最后指定秒数显示
      const endTitleStart = duration - finalEndTitleDuration;
      const endTitleEnd = duration;

      // 生成打字机音效（如果是打字机动画）
      let typewriterSoundPath = null;
      if (
        finalEndTitleAnimation === "typewriter" &&
        endTitleSound === "typewriter"
      ) {
        const soundsDir = path.join(outputDir, "sounds");
        await fs.mkdir(soundsDir, { recursive: true });
        const soundOutputPath = path.join(soundsDir, "typewriter_endtitle.wav");

        try {
          typewriterSoundPath = await endTitleAnimator.generateTypewriterSound(
            endTitle,
            finalEndTitleDuration,
            soundOutputPath
          );
          if (typewriterSoundPath) {
            console.log(`🎵 结尾标题打字机音效已生成: ${typewriterSoundPath}`);
          }
        } catch (error) {
          console.warn(`⚠️ 生成打字机音效失败: ${error.message}`);
        }
      }

      // 使用动画类生成结尾标题ASS内容
      const endTitleASS = endTitleAnimator.generateGlobalTitleASS(
        endTitle,
        finalEndTitleDuration,
        W,
        H,
        wrapCJK,
        toAssTime,
        endTitleStart, // 指定开始时间
        true // 标记为结尾标题
      );

      ass += endTitleASS;

      // 存储打字机音效信息
      if (typewriterSoundPath) {
        // 将音效信息存储在全局变量中，供后续合成使用
        global.typewriterSoundInfo = {
          path: typewriterSoundPath,
          start: endTitleStart,
          duration: finalEndTitleDuration,
        };
      }
    }

    // 添加底部免责声明（如果配置了）
    if (disclaimerText) {
      console.log(`[3/5] 添加底部免责声明`);

      try {
        const disclaimerAnimator = new TitleAnimation();
        const disclaimerASS = disclaimerAnimator.generateDisclaimerASS(
          disclaimerText,
          duration,
          W,
          H,
          wrapCJK,
          toAssTime
        );

        ass += disclaimerASS;
      } catch (error) {
        console.log(
          `[警告] 底部免责声明处理失败: ${error.message}，继续处理其他字幕`
        );
      }
    }

    // 处理婴儿哭声（如果启用）
    if (useBabyCry) {
      console.log(`[3/5] 准备添加婴儿哭声音效`);

      const babyCryPath = path.join(process.cwd(), "sounds", "婴儿哭声.mp3");
      try {
        await fs.access(babyCryPath);

        // 裁剪婴儿哭声为2秒（使用第2-4秒）
        const soundsDir = path.join(outputDir, "sounds");
        await fs.mkdir(soundsDir, { recursive: true });
        const babyCryOutputPath = path.join(soundsDir, "baby_cry_2s.wav");

        execCommand(
          `ffmpeg -y -i "${babyCryPath}" -ss 2 -t 2 "${babyCryOutputPath}"`
        );

        // 存储婴儿哭声信息
        global.babyCryInfo = {
          path: babyCryOutputPath,
          duration: 2,
        };

        console.log(`🍼 婴儿哭声已准备: ${babyCryOutputPath} (2秒)`);
      } catch (error) {
        console.warn(`⚠️ 婴儿哭声文件不存在: ${babyCryPath}`);
      }
    }

    // 使用UTF-8编码写入ASS文件
    await fs.writeFile(assPath, ass, { encoding: "utf8" });
    console.log(`[3/5] ASS字幕文件已创建: ${assPath}`);
    console.log(`[3/5] ASS文件大小: ${(await fs.stat(assPath)).size} bytes`);

    console.log(`[3/5] 开始烧录字幕到视频...`);
    console.log(`[3/5] 输入视频: ${videoPath}`);
    console.log(`[3/5] 输出视频: ${tempVideoPath}`);
    console.log(
      `[3/5] 视频尺寸: ${W}x${H}, 字体大小: ${largerFontSize}px, 每行最大字符: ${maxCharsPerLine}`
    );
    // 直接使用 ASS 字幕一次性烧录，确保长标题自动换行/硬换行完整显示
    const assPathEscaped = path
      .relative(process.cwd(), assPath)
      .replace(/\\/g, "/");
    const encodingParams = getOptimizedEncodingParams(
      qualityMode || "high",
      enableSpeedOptimization || false
    );
    const burnCmd = `ffmpeg -y -i "${videoPath}" -vf "subtitles=filename='${assPathEscaped}'" ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${tempVideoPath}"`;
    console.log(`[3/5] 执行字幕烧录命令: ${burnCmd.substring(0, 140)}...`);
    execCommand(burnCmd);

    // 验证最终输出文件
    const outputExists = await fs.pathExists(tempVideoPath);
    if (outputExists) {
      console.log(`[3/5] 字幕视频生成成功: ${tempVideoPath}`);

      // 验证视频中是否真的包含字幕 - 生成测试截图
      try {
        const testScreenshotPath = path.join(
          outputDir,
          `subtitle_test_${Date.now()}.png`
        );
        // 在第一个字幕应该出现的时间点截图
        execCommand(
          `ffmpeg -y -ss 2 -i "${tempVideoPath}" -vframes 1 "${testScreenshotPath}"`
        );

        const screenshotExists = await fs.pathExists(testScreenshotPath);
        if (screenshotExists) {
          console.log(`[3/5] 字幕验证截图已生成并验证完成`);
          // 立即删除测试截图
          await fs.remove(testScreenshotPath).catch(() => {});
          console.log(`[3/5] 测试截图已清理`);
        }
      } catch (screenshotError) {
        console.warn(`[3/5] 生成验证截图失败: ${screenshotError.message}`);
      }

      // 清理ASS字幕文件
      await fs.remove(assPath).catch(() => {});
      return tempVideoPath;
    } else {
      console.error(`[3/5] 字幕视频生成失败，文件不存在: ${tempVideoPath}`);
      return videoPath;
    }
  } catch (error) {
    console.warn(`[警告] 标题处理失败: ${error.message}，跳过标题添加步骤`);
    return videoPath;
  }
}

/**
 * 合成背景音乐，保持原始比例
 * @param {string} videoPath - 视频文件路径
 * @param {string} bgMusicPath - 背景音乐路径
 * @param {string} outputDir - 输出目录
 * @param {string} qualityMode - 质量模式
 * @param {boolean} enableSpeedOptimization - 是否启用速度优化
 * @returns {string} - 最终输出视频路径
 */
async function compositeWithMusic(
  videoPath,
  bgMusicPath,
  outputDir,
  qualityMode,
  enableSpeedOptimization
) {
  await fs.mkdir(outputDir, { recursive: true });

  const originalVideoName = path.basename(videoPath, path.extname(videoPath));
  // 使用固定的输出文件名，避免每次运行都生成新文件
  const cleanVideoName = originalVideoName
    .replace(/_with_titles_temp$/, "")
    .replace(/_\d+_[a-f0-9]+$/, "");
  const finalVideoPath = path.join(
    outputDir,
    `${cleanVideoName}${CONFIG_PATHS.PROCESSED_SUFFIX}.mp4`
  );

  console.log(`[4/5] 正在合成背景音乐，保持原始视频比例...`);

  // 获取原始视频信息
  try {
    const videoInfoResult = execCommand(
      `ffprobe -v quiet -print_format json -show_streams "${videoPath}"`
    );
    const videoInfo = JSON.parse(videoInfoResult.stdout);
    const videoStream = videoInfo.streams.find((s) => s.codec_type === "video");

    if (videoStream) {
      console.log(
        `[4/5] 保持原始尺寸: ${videoStream.width}x${videoStream.height}`
      );
    }
  } catch (e) {
    console.warn(`[警告] 无法获取视频信息: ${e.message}`);
  }

  const resolvedBgMusicPath = resolvePath(bgMusicPath);

  // 检查背景音乐文件是否存在
  let useBgMusic = false;
  if (resolvedBgMusicPath && !resolvedBgMusicPath.startsWith("http")) {
    try {
      const exists = await fs.pathExists(resolvedBgMusicPath);
      if (exists) {
        useBgMusic = true;
      } else {
        console.warn(
          `[警告] 背景音乐文件不存在: ${resolvedBgMusicPath}，将只处理视频`
        );
      }
    } catch (e) {
      console.warn(
        `[警告] 无法验证背景音乐路径: ${resolvedBgMusicPath}，将只处理视频`
      );
    }
  }

  if (useBgMusic) {
    console.log(`[4/5] 使用背景音乐: ${resolvedBgMusicPath}`);

    // 检查原视频是否有音频轨道并获取视频时长
    const probe = execCommand(
      `ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`
    );
    const info = JSON.parse(probe.stdout);
    const hasOriginalAudio = info.streams.some((s) => s.codec_type === "audio");
    const videoDuration = parseFloat(
      info.format?.duration ||
        info.streams.find((s) => s.codec_type === "video")?.duration ||
        0
    );

    const encodingParams = getOptimizedEncodingParams(
      qualityMode || "high",
      enableSpeedOptimization || false
    );

    console.log(
      `[4/5] 视频时长: ${videoDuration}s，背景音乐将循环播放匹配视频长度`
    );

    // 检查是否有打字机音效需要添加
    const typewriterSound = global.typewriterSoundInfo;
    let hasTypewriterSound = false;
    if (typewriterSound && typewriterSound.path) {
      try {
        await fs.access(typewriterSound.path);
        hasTypewriterSound = true;
        console.log(`[4/5] 检测到打字机音效: ${typewriterSound.path}`);
        console.log(
          `[4/5] 打字机音效时间: ${typewriterSound.start}s - ${typewriterSound.start + typewriterSound.duration}s`
        );
      } catch (error) {
        console.warn(`⚠️ 打字机音效文件不存在: ${typewriterSound.path}`);
      }
    }

    // 检查是否需要添加婴儿哭声
    const babyCryInfo = global.babyCryInfo;
    let hasBabyCry = false;
    if (babyCryInfo && babyCryInfo.path) {
      try {
        await fs.access(babyCryInfo.path);
        hasBabyCry = true;
        console.log(`[4/5] 检测到婴儿哭声: ${babyCryInfo.path}`);
        console.log(`[4/5] 婴儿哭声时间: 0s - ${babyCryInfo.duration}s`);
      } catch (error) {
        console.warn(`⚠️ 婴儿哭声文件不存在: ${babyCryInfo.path}`);
      }
    }

    if (hasOriginalAudio) {
      const audioEffects = [];
      if (hasTypewriterSound) audioEffects.push("打字机音效");
      if (hasBabyCry) audioEffects.push("婴儿哭声");
      const effectsText =
        audioEffects.length > 0 ? `、${audioEffects.join("、")}` : "";
      console.log(
        `[4/5] 检测到原视频有音频，将混合原音频、背景音乐${effectsText}`
      );

      if (hasTypewriterSound && hasBabyCry) {
        // 混合原视频音频、背景音乐、打字机音效和婴儿哭声（4轨混合）
        console.log(
          `🎵 打字机音效时间: ${typewriterSound.start}s - ${typewriterSound.start + typewriterSound.duration}s (延迟${typewriterSound.start * 1000}ms)`
        );
        execCommand(
          `ffmpeg -y -i "${videoPath}" -stream_loop -1 -i "${resolvedBgMusicPath}" -i "${typewriterSound.path}" -i "${babyCryInfo.path}" -filter_complex "[0:a]volume=0.25[a0];[1:a]volume=0.3,apad=pad_dur=${videoDuration}[a1];[2:a]adelay=${typewriterSound.start * 1000}|${typewriterSound.start * 1000},volume=2.0[a2];[3:a]volume=0.6,apad=pad_dur=2[a3];[a0][a1][a2][a3]amix=inputs=4:duration=longest[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
        );
      } else if (hasTypewriterSound) {
        // 混合原视频音频、背景音乐和打字机音效
        console.log(
          `🎵 打字机音效时间: ${typewriterSound.start}s - ${typewriterSound.start + typewriterSound.duration}s (延迟${typewriterSound.start * 1000}ms)`
        );
        execCommand(
          `ffmpeg -y -i "${videoPath}" -stream_loop -1 -i "${resolvedBgMusicPath}" -i "${typewriterSound.path}" -filter_complex "[0:a]volume=0.25[a0];[1:a]volume=0.4,apad=pad_dur=${videoDuration}[a1];[2:a]adelay=${typewriterSound.start * 1000}|${typewriterSound.start * 1000},volume=2.0[a2];[a0][a1][a2]amix=inputs=3:duration=longest[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
        );
      } else if (hasBabyCry) {
        // 混合原视频音频、背景音乐和婴儿哭声
        execCommand(
          `ffmpeg -y -i "${videoPath}" -stream_loop -1 -i "${resolvedBgMusicPath}" -i "${babyCryInfo.path}" -filter_complex "[0:a]volume=0.3[a0];[1:a]volume=0.5,apad=pad_dur=${videoDuration}[a1];[2:a]volume=0.8,apad=pad_dur=2[a2];[a0][a1][a2]amix=inputs=3:duration=longest[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
        );
      } else {
        // 混合原视频音频和背景音乐：背景音乐循环播放，原音频音量0.4，背景音乐音量0.6
        execCommand(
          `ffmpeg -y -i "${videoPath}" -stream_loop -1 -i "${resolvedBgMusicPath}" -filter_complex "[0:a]volume=0.4[a0];[1:a]volume=0.6,apad=pad_dur=${videoDuration}[a1];[a0][a1]amix=inputs=2:duration=longest[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
        );
      }
    } else {
      const audioEffects = [];
      if (hasTypewriterSound) audioEffects.push("打字机音效");
      if (hasBabyCry) audioEffects.push("婴儿哭声");
      const effectsText =
        audioEffects.length > 0 ? `、${audioEffects.join("、")}` : "";
      console.log(`[4/5] 原视频无音频，使用背景音乐${effectsText}`);

      if (hasTypewriterSound && hasBabyCry) {
        // 混合背景音乐、打字机音效和婴儿哭声
        console.log(
          `🎵 打字机音效时间: ${typewriterSound.start}s - ${typewriterSound.start + typewriterSound.duration}s (延迟${typewriterSound.start * 1000}ms)`
        );
        execCommand(
          `ffmpeg -y -i "${videoPath}" -stream_loop -1 -i "${resolvedBgMusicPath}" -i "${typewriterSound.path}" -i "${babyCryInfo.path}" -filter_complex "[1:a]volume=0.4,apad=pad_dur=${videoDuration}[a1];[2:a]adelay=${typewriterSound.start * 1000}|${typewriterSound.start * 1000},volume=2.0[a2];[3:a]volume=0.6,apad=pad_dur=2[a3];[a1][a2][a3]amix=inputs=3:duration=longest[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
        );
      } else if (hasTypewriterSound) {
        // 混合背景音乐和打字机音效
        console.log(
          `🎵 打字机音效时间: ${typewriterSound.start}s - ${typewriterSound.start + typewriterSound.duration}s (延迟${typewriterSound.start * 1000}ms)`
        );
        execCommand(
          `ffmpeg -y -i "${videoPath}" -stream_loop -1 -i "${resolvedBgMusicPath}" -i "${typewriterSound.path}" -filter_complex "[1:a]volume=0.5,apad=pad_dur=${videoDuration}[a1];[2:a]adelay=${typewriterSound.start * 1000}|${typewriterSound.start * 1000},volume=2.0[a2];[a1][a2]amix=inputs=2:duration=longest[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
        );
      } else if (hasBabyCry) {
        // 混合背景音乐和婴儿哭声
        execCommand(
          `ffmpeg -y -i "${videoPath}" -stream_loop -1 -i "${resolvedBgMusicPath}" -i "${babyCryInfo.path}" -filter_complex "[1:a]volume=0.7,apad=pad_dur=${videoDuration}[a1];[2:a]volume=0.8,apad=pad_dur=2[a2];[a1][a2]amix=inputs=2:duration=longest[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
        );
      } else {
        // 原视频无音频，背景音乐循环播放匹配视频长度
        execCommand(
          `ffmpeg -y -i "${videoPath}" -stream_loop -1 -i "${resolvedBgMusicPath}" -map 0:v -map 1:a:0 -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
        );
      }
    }
  } else {
    // 检查是否有音效需要添加（即使没有背景音乐）
    const typewriterSound = global.typewriterSoundInfo;
    const babyCryInfo = global.babyCryInfo;
    let hasTypewriterSound = false;
    let hasBabyCry = false;

    if (typewriterSound && typewriterSound.path) {
      try {
        await fs.access(typewriterSound.path);
        hasTypewriterSound = true;
        console.log(`[4/5] 检测到打字机音效: ${typewriterSound.path}`);
      } catch (error) {
        console.warn(`⚠️ 打字机音效文件不存在: ${typewriterSound.path}`);
      }
    }

    if (babyCryInfo && babyCryInfo.path) {
      try {
        await fs.access(babyCryInfo.path);
        hasBabyCry = true;
        console.log(`[4/5] 检测到婴儿哭声: ${babyCryInfo.path}`);
      } catch (error) {
        console.warn(`⚠️ 婴儿哭声文件不存在: ${babyCryInfo.path}`);
      }
    }

    if (hasTypewriterSound || hasBabyCry) {
      const audioEffects = [];
      if (hasTypewriterSound) audioEffects.push("打字机音效");
      if (hasBabyCry) audioEffects.push("婴儿哭声");
      console.log(`[4/5] 不使用背景音乐，但添加${audioEffects.join("、")}`);

      // 获取视频时长
      const probe = execCommand(
        `ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`
      );
      const info = JSON.parse(probe.stdout);
      const hasOriginalAudio = info.streams.some(
        (s) => s.codec_type === "audio"
      );
      const videoDuration = parseFloat(
        info.format?.duration ||
          info.streams.find((s) => s.codec_type === "video")?.duration ||
          0
      );

      const encodingParams = getOptimizedEncodingParams(
        qualityMode || "high",
        enableSpeedOptimization || false
      );

      if (hasOriginalAudio) {
        if (hasTypewriterSound && hasBabyCry) {
          // 原视频有音频，混合原音频、打字机音效和婴儿哭声
          execCommand(
            `ffmpeg -y -i "${videoPath}" -i "${typewriterSound.path}" -i "${babyCryInfo.path}" -filter_complex "[0:a]volume=0.6[a0];[1:a]adelay=${typewriterSound.start * 1000}|${typewriterSound.start * 1000},volume=1.2[a1];[2:a]volume=0.8,apad=pad_dur=2[a2];[a0][a1][a2]amix=inputs=3:duration=longest[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
          );
        } else if (hasTypewriterSound) {
          // 原视频有音频，混合原音频和打字机音效
          execCommand(
            `ffmpeg -y -i "${videoPath}" -i "${typewriterSound.path}" -filter_complex "[0:a]volume=0.8[a0];[1:a]adelay=${typewriterSound.start * 1000}|${typewriterSound.start * 1000},volume=1.2[a1];[a0][a1]amix=inputs=2:duration=longest[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
          );
        } else if (hasBabyCry) {
          // 原视频有音频，混合原音频和婴儿哭声
          execCommand(
            `ffmpeg -y -i "${videoPath}" -i "${babyCryInfo.path}" -filter_complex "[0:a]volume=0.8[a0];[1:a]volume=0.8,apad=pad_dur=2[a1];[a0][a1]amix=inputs=2:duration=longest[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
          );
        }
      } else {
        if (hasTypewriterSound && hasBabyCry) {
          // 原视频无音频，添加打字机音效和婴儿哭声
          execCommand(
            `ffmpeg -y -i "${videoPath}" -i "${typewriterSound.path}" -i "${babyCryInfo.path}" -filter_complex "[1:a]adelay=${typewriterSound.start * 1000}|${typewriterSound.start * 1000},volume=1.2[a1];[2:a]volume=0.8,apad=pad_dur=2[a2];[a1][a2]amix=inputs=2:duration=longest,apad=pad_dur=${videoDuration}[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
          );
        } else if (hasTypewriterSound) {
          // 原视频无音频，只添加打字机音效
          execCommand(
            `ffmpeg -y -i "${videoPath}" -i "${typewriterSound.path}" -filter_complex "[1:a]adelay=${typewriterSound.start * 1000}|${typewriterSound.start * 1000},volume=1.2,apad=pad_dur=${videoDuration}[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
          );
        } else if (hasBabyCry) {
          // 原视频无音频，只添加婴儿哭声
          execCommand(
            `ffmpeg -y -i "${videoPath}" -i "${babyCryInfo.path}" -filter_complex "[1:a]volume=0.8,apad=pad_dur=${videoDuration}[aout]" -map 0:v -map "[aout]" -t ${videoDuration} ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${finalVideoPath}"`
          );
        }
      }
    } else {
      console.log(`[4/5] 不使用背景音乐，仅处理视频`);
      const encodingParams = getOptimizedEncodingParams(
        qualityMode || "high",
        enableSpeedOptimization || false
      );
      execCommand(
        `ffmpeg -y -i "${videoPath}" -map 0:v -map 0:a? ${encodingParams} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${finalVideoPath}"`
      );
    }
  }

  console.log(`[4/5] 最终视频已生成: ${finalVideoPath}`);

  // 清理全局音效信息
  if (global.typewriterSoundInfo) {
    console.log(`🎵 打字机音效已成功合成到视频中`);
    delete global.typewriterSoundInfo;
  }

  if (global.babyCryInfo) {
    console.log(`🍼 婴儿哭声已成功合成到视频中`);
    delete global.babyCryInfo;
  }

  return finalVideoPath;
}

/**
 * 生成封面图片，在青年图片上添加人物名称
 * @param {string} projectName - 项目名称（用于查找青年图片）
 * @param {string} title - 标题文本（用于提取人物名称）
 * @param {string} outputDir - 输出目录
 * @returns {string} - 生成的封面图片路径
 */
async function generateCover(projectName, title, outputDir) {
  console.log(`[封面生成] 开始生成封面图片...`);

  // 1. 构建青年图片路径
  const youthImagePath = path.join(
    process.cwd(),
    "output",
    projectName,
    "青年.jpeg"
  );

  // 检查青年图片是否存在
  if (!(await fs.pathExists(youthImagePath))) {
    console.warn(`⚠️ 青年图片不存在: ${youthImagePath}`);
    return null;
  }

  // 2. 从title中提取人物名称
  let personName = "";
  if (title) {
    // 尝试多种模式提取人物名称
    const patterns = [
      /物理天才\n([^的\n]+)的一生/, // "物理天才\n李政道的一生"
      /([^，,\n]+)的一生/, // "XXX的一生"
      /([^，,\n]{2,4})$/m, // 最后一行的2-4个字符
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        personName = match[1].trim();
        break;
      }
    }

    // 如果没有匹配到，尝试从最后一行提取
    if (!personName) {
      const lines = title.split("\n").filter((line) => line.trim());
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        // 提取最后一行中的中文字符（通常是人名）
        const nameMatch = lastLine.match(/([^\s，,。！？；：的]+)/);
        if (nameMatch) {
          personName = nameMatch[1];
        }
      }
    }
  }

  if (!personName) {
    console.warn(`⚠️ 无法从标题中提取人物名称: ${title}`);
    personName = "历史人物"; // 默认名称
  }

  console.log(`[封面生成] 提取到人物名称: ${personName}`);

  // 3. 生成封面图片
  await fs.mkdir(outputDir, { recursive: true });
  const coverPath = path.join(outputDir, `${projectName}_cover.jpg`);

  // 获取平台特定字体
  const platformFont = getPlatformFont();

  // 使用FFmpeg在图片上添加文字
  // 80px白色字体，居中对齐，距离底部50%
  const fontPath = platformFont === "KaiTi" ? "KaiTi" : platformFont;

  try {
    // 先获取图片尺寸
    const probe = execCommand(
      `ffprobe -v quiet -print_format json -show_streams "${youthImagePath}"`
    );
    const info = JSON.parse(probe.stdout);
    const imageStream = info.streams.find((s) => s.codec_type === "video");
    const imageWidth = imageStream?.width || 1080;
    const imageHeight = imageStream?.height || 1920;

    // 计算文字位置（距离底部50%）
    const textY = Math.floor(imageHeight * 0.5);

    console.log(
      `[封面生成] 图片尺寸: ${imageWidth}x${imageHeight}, 文字位置Y: ${textY}`
    );

    // 优先尝试使用 ImageMagick 添加文字，如果失败则使用 FFmpeg
    let success = false;

    // 方法1：尝试使用 ImageMagick (magick 命令)
    try {
      // 首先尝试使用平台特定字体的中文字符
      let magickCommand = `magick "${youthImagePath}" -font "${platformFont}" -pointsize 80 -fill white -stroke black -strokewidth 2 -gravity center -annotate +0+0 "${personName}" "${coverPath}"`;
      execCommand(magickCommand);

      // 检查文件是否真的被修改了（通过文件大小变化判断）
      const originalSize = (await fs.stat(youthImagePath)).size;
      const newSize = (await fs.stat(coverPath)).size;

      if (Math.abs(newSize - originalSize) < 100) {
        // 文件大小几乎没变，可能字体不存在，尝试不指定字体
        console.warn(`⚠️ 指定字体可能不存在，尝试使用默认字体`);
        magickCommand = `magick "${youthImagePath}" -pointsize 80 -fill white -stroke black -strokewidth 2 -gravity center -annotate +0+0 "${personName}" "${coverPath}"`;
        execCommand(magickCommand);
        
        // 再次检查
        const newSize2 = (await fs.stat(coverPath)).size;
        if (Math.abs(newSize2 - originalSize) < 100) {
          // 如果还是失败，尝试英文名称作为最后手段
          console.warn(`⚠️ 中文字符渲染失败，使用英文名称作为备选`);
          const englishName =
            personName === "李政道"
              ? "Li Zhengdao"
              : personName === "邓稼先"
                ? "Deng Jiaxian"
                : personName === "袁隆平"
                  ? "Yuan Longping"
                : personName === "钱学森"
                  ? "Qian Xuesen"
                  : `${personName} (Historical Figure)`;

          magickCommand = `magick "${youthImagePath}" -pointsize 80 -fill white -stroke black -strokewidth 2 -gravity center -annotate +0+0 "${englishName}" "${coverPath}"`;
          execCommand(magickCommand);
          console.log(`✅ 使用英文名称 "${englishName}" 生成封面成功`);
        } else {
          console.log(`✅ 使用默认字体的中文名称 "${personName}" 生成封面成功`);
        }
      } else {
        console.log(`✅ 使用指定字体 "${platformFont}" 的中文名称 "${personName}" 生成封面成功`);
      }

      success = true;
    } catch (magickError) {
      console.warn(`⚠️ ImageMagick 失败: ${magickError.message}`);

      // 方法2：尝试使用 FFmpeg drawtext
      try {
        const ffmpegCommand = `ffmpeg -y -i "${youthImagePath}" -vf "drawtext=text='${personName}':font='${fontPath}':fontsize=80:fontcolor=white:x=(w-text_w)/2:y=${textY}:shadowcolor=black:shadowx=2:shadowy=2" "${coverPath}"`;
        execCommand(ffmpegCommand);
        success = true;
        console.log(`✅ 使用 FFmpeg drawtext 生成封面成功`);
      } catch (ffmpegError) {
        console.warn(`⚠️ FFmpeg drawtext 失败: ${ffmpegError.message}`);

        // 方法3：尝试使用默认字体的 FFmpeg
        try {
          const ffmpegDefaultCommand = `ffmpeg -y -i "${youthImagePath}" -vf "drawtext=text='${personName}':fontsize=80:fontcolor=white:x=(w-text_w)/2:y=${textY}:shadowcolor=black:shadowx=2:shadowy=2" "${coverPath}"`;
          execCommand(ffmpegDefaultCommand);
          success = true;
          console.log(`✅ 使用 FFmpeg 默认字体生成封面成功`);
        } catch (defaultError) {
          console.warn(`⚠️ FFmpeg 默认字体也失败: ${defaultError.message}`);
        }
      }
    }

    if (!success) {
      throw new Error("所有文字叠加方法都失败了");
    }

    console.log(`✅ 封面图片生成完成: ${coverPath}`);
    return coverPath;
  } catch (error) {
    console.error(`❌ 封面生成失败: ${error.message}`);

    // 降级方案：直接复制青年图片作为封面
    try {
      await fs.copy(youthImagePath, coverPath);
      console.log(`📋 已复制青年图片作为封面: ${coverPath}`);
      return coverPath;
    } catch (copyError) {
      console.error(`❌ 复制青年图片失败: ${copyError.message}`);
      return null;
    }
  }
}

/**
 * 清理输出目录中的旧文件和临时文件
 * @param {string} outputDir - 输出目录
 * @param {string} keepPattern - 要保留的文件模式
 */
async function cleanupOutputDir(outputDir, keepPattern) {
  try {
    const files = await fs.readdir(outputDir).catch(() => []);
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      // 删除旧的处理文件、验证截图和临时文件
      if (
        file.includes(CONFIG_CLEANUP.OLD_FINAL_PATTERN) ||
        file.includes(CONFIG_CLEANUP.VERIFY_PATTERN) ||
        file.includes(CONFIG_CLEANUP.TEST_PATTERN) ||
        file.includes("subtitle_test_") ||
        file.includes("_cover_title.ass") ||
        file.endsWith(CONFIG_PATHS.ASS_SUFFIX) ||
        (file.includes(CONFIG_PATHS.PROCESSED_SUFFIX) &&
          !file.includes(keepPattern))
      ) {
        await fs.remove(filePath).catch(() => {});
        console.log(`[清理] 已删除旧文件: ${file}`);
      }
    }
  } catch (error) {
    console.warn(`[警告] 清理输出目录失败: ${error.message}`);
  }
}
async function cleanupTempFiles(tempFiles) {
  console.log(`[5/5] 正在清理临时文件...`);
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
 * 高级算法：从prompt中精确提取年份、年龄、场景和事件信息
 * @param {string} prompt - 原始提示词
 * @param {string} name - 人物姓名
 * @param {number} index - 段落索引
 * @returns {Object} - {year, age, scene, event}
 */
function extractSectionInfo(prompt, name, index) {
  // 1. 提取年份和年龄
  const yearMatch = prompt.match(/(\d{4})年/);
  const ageMatch = prompt.match(/(\d+)岁/);

  const year = yearMatch ? yearMatch[1] : "未知";
  const age = ageMatch ? ageMatch[1] : "未知";

  // 2. 提取场景信息（画面提示后的内容）
  let scene = "重要场所";
  const sceneMatch = prompt.match(/画面提示：([^,，。！？；：]+)/);
  if (sceneMatch) {
    let rawScene = sceneMatch[1].trim();

    // 清理场景描述：去除多余的修饰词和标点符号
    rawScene = rawScene
      .replace(/穿[^，,。]*的[^，,。]*?(?=[，,。]|$)/g, "") // 去除服装描述
      .replace(/[，,。！？；：]/g, "") // 去除标点符号
      .replace(/\s+/g, "") // 去除空格
      .replace(/^(在|于|位于|坐落在|处于)/, "") // 去除位置介词
      .trim();

    // 提取核心场景关键词（取前8-12个字符，确保语义完整）
    if (rawScene.length > 0) {
      // 智能截取：优先在词汇边界截取
      const keyPlaces = [
        "学堂",
        "私塾",
        "学校",
        "大学",
        "实验室",
        "研究所",
        "会场",
        "田间",
        "稻田",
        "基地",
        "农场",
        "家中",
        "书房",
        "卧房",
      ];
      let foundPlace = keyPlaces.find((place) => rawScene.includes(place));

      if (foundPlace) {
        const placeIndex = rawScene.indexOf(foundPlace);
        const beforePlace = rawScene.substring(
          0,
          placeIndex + foundPlace.length
        );
        scene =
          beforePlace.length <= 12 ? beforePlace : rawScene.substring(0, 10);
      } else {
        scene = rawScene.substring(0, Math.min(12, rawScene.length));
      }
    }
  }

  // 3. 提取事件信息
  let event = "重要时刻";

  if (index === 0) {
    // 第一条特殊处理：出生
    event = `${name}出生`;
  } else {
    // 高级事件提取算法
    const cleanPrompt = prompt
      .replace(/[，,。！？；：]/g, " ")
      .replace(/\s+/g, " ");

    // 动作关键词匹配（按优先级排序）
    const actionPatterns = [
      // 学习相关
      {
        pattern:
          /(临摹|抄写|练习|学习|研读|阅读)[^，,。]*?([《》\w\u4e00-\u9fff]+)/g,
        priority: 1,
      },
      { pattern: /(求学|上学|入学|就读|学习)/g, priority: 2 },

      // 工作研究相关
      {
        pattern:
          /(发明|创造|研制|开发|设计)[^，,。]*?([核弹|原子弹|氢弹|武器|装置|\w\u4e00-\u9fff]+)/g,
        priority: 1,
      },
      {
        pattern:
          /(研究|实验|观察|分析|测试|检验)[^，,。]*?([稻穗|水稻|植物|数据|样本|\w\u4e00-\u9fff]*)/g,
        priority: 1,
      },
      { pattern: /(指导|教学|演讲|报告|讲解|传授)/g, priority: 2 },

      // 生活事件
      {
        pattern:
          /(获得|荣获|赢得|获奖)[^，,。]*?([奖项|荣誉|称号|\w\u4e00-\u9fff]+)/g,
        priority: 1,
      },
      {
        pattern:
          /(参加|出席|参与)[^，,。]*?([会议|活动|典礼|\w\u4e00-\u9fff]+)/g,
        priority: 1,
      },
      {
        pattern: /(庆祝|分享|欢度)[^，,。]*?([生日|节日|\w\u4e00-\u9fff]*)/g,
        priority: 1,
      },
    ];

    let bestMatch = null;
    let highestPriority = 0;

    for (const { pattern, priority } of actionPatterns) {
      const matches = [...cleanPrompt.matchAll(pattern)];
      for (const match of matches) {
        if (priority >= highestPriority) {
          highestPriority = priority;
          if (match[2]) {
            // 有具体对象的动作
            bestMatch = `${match[1]}${match[2]}`.replace(/[《》]/g, "");
          } else {
            // 纯动作
            bestMatch = match[1];
          }
        }
      }
    }

    if (bestMatch) {
      event = bestMatch.substring(0, Math.min(15, bestMatch.length));
    } else {
      // 降级处理：从场景推断事件
      if (
        scene.includes("私塾") ||
        scene.includes("学堂") ||
        scene.includes("学校")
      ) {
        event = "求学";
      } else if (scene.includes("实验") || scene.includes("研究")) {
        event = "科研工作";
      } else if (scene.includes("田") || scene.includes("农")) {
        event = "农业研究";
      } else if (scene.includes("会") || scene.includes("典礼")) {
        event = "参加活动";
      } else {
        // 最后尝试从原文提取关键动词
        const verbMatch = cleanPrompt.match(
          /(做|进行|从事|完成|实现|达成)([^，,。\s]{2,8})/
        );
        if (verbMatch) {
          event = verbMatch[2];
        }
      }
    }
  }

  return { year, age, scene, event };
}

/**
 * 将生成的sectionTitle写入配置文件
 * @param {Array} sectionTitle - 生成的分镜标题数组
 * @param {string} name - 人物姓名
 */
async function updateConfigFile(sectionTitle, name) {
  try {
    const configPath = path.join(process.cwd(), "config.mjs");
    let configContent = await fs.readFile(configPath, "utf8");

    // 生成新的sectionTitle数组字符串
    const sectionTitleStr = sectionTitle
      .map((title) => `      "${title.replace(/\n/g, "\\n")}"`)
      .join(",\n");
    const newSectionTitleBlock = `    sectionTitle: [\n${sectionTitleStr},\n    ],`;

    // 使用正则表达式替换sectionTitle部分
    const sectionTitleRegex = /sectionTitle:\s*\[[\s\S]*?\],/;

    if (sectionTitleRegex.test(configContent)) {
      configContent = configContent.replace(
        sectionTitleRegex,
        newSectionTitleBlock
      );
      console.log(`📝 正在更新配置文件中的sectionTitle...`);
    } else {
      console.log(`⚠️ 未找到sectionTitle配置块，无法自动更新`);
      return;
    }

    // 写入更新后的配置文件
    await fs.writeFile(configPath, configContent, "utf8");
    console.log(
      `✅ 已成功将${name}的${sectionTitle.length}个分镜标题写入配置文件`
    );
  } catch (error) {
    console.warn(`[警告] 更新配置文件失败: ${error.message}`);
  }
}

/**
 * 主函数：执行 history-person 命令
 * @param {Object} config - 配置对象
 */
export default async function runHistoryPerson(config) {
  if (!config) {
    throw new Error("缺少 history-person 配置");
  }

  let {
    url,
    title,
    sectionTitle,
    "bg-music": bgMusic,
    watermark,
    titleAnimation,
    sectionTitleAnimation,
    name,
    qualityMode,
    titleDuration,
    endTitle,
    endTitleDuration,
    endTitleAnimation,
    endTitleSound,
    enableSpeedOptimization,
    skipTempCleanup,
    useBabyCry,
    disclaimerText = "AIGC生成 无真人肖像 只为致敬", // 默认免责声明文字
    sectionFirstTitleTime, // 第一个字幕的特殊显示时长
  } = config;

  if (!url) {
    throw new Error("配置中缺少视频 URL");
  }

  console.log(`\n开始处理 history-person 任务...`);
  console.log(`视频URL: ${url}`);
  console.log(`标题: ${title || "未设置"}`);
  console.log(
    `标题动画: ${titleAnimation || CONFIG_TITLE_ANIMATION.DEFAULT_ANIMATION}`
  );
  console.log(
    `分镜字幕动画: ${sectionTitleAnimation || CONFIG_TITLE_ANIMATION.DEFAULT_ANIMATION}`
  );
  console.log(`镜头标题数量: ${sectionTitle ? sectionTitle.length : 0}`);
  console.log(`第一个字幕时长: ${sectionFirstTitleTime ? `${sectionFirstTitleTime}秒` : "默认(5秒)"}`);
  console.log(`水印: ${watermark || "未设置"}`);
  console.log(`背景音乐: ${bgMusic || "未设置"}`);
  console.log(
    `全局标题时长: ${titleDuration ? `${titleDuration}秒` : "默认(整个视频)"}`
  );
  console.log(`结尾标题: ${endTitle || "未设置"}`);
  console.log(
    `视频质量模式: ${qualityMode || "high"} (high=高质量接近无损, balanced=平衡, fast=快速, turbo=极速)`
  );
  console.log(
    `速度优化: ${enableSpeedOptimization ? "启用(多线程+预设优化)" : "禁用"}`
  );
  console.log(`临时文件清理: ${skipTempCleanup ? "跳过(节省时间)" : "启用"}`);
  console.log(`当前平台: ${process.platform}, 使用字体: ${getPlatformFont()}`);

  // 性能监控开始
  const startTime = Date.now();

  // 检查配置文件中是否已有手动优化的sectionTitle
  const hasManualSectionTitle =
    sectionTitle &&
    sectionTitle.length > 0 &&
    sectionTitle.some(
      (title) => !title.includes("重要时刻") && !title.includes("实验室")
    );

  // 如果配置文件中已有手动优化的sectionTitle，优先使用它们
  if (hasManualSectionTitle) {
    console.log(`✅ 使用配置文件中已优化的${sectionTitle.length}个分镜标题\n`);
  } else if (name) {
    // 只有在配置文件中没有手动优化的sectionTitle时，才从processed_data.json生成
    try {
      const processedDataPath = path.join(
        process.cwd(),
        "output",
        name,
        "processed_data.json"
      );
      if (await fs.pathExists(processedDataPath)) {
        console.log(
          `\n🔍 发现 ${name} 的processed_data.json，正在生成sectionTitle...`
        );
        const processedData = await fs.readJson(processedDataPath);

        if (processedData.segments && processedData.segments.length > 0) {
          sectionTitle = [];

          for (let i = 0; i < processedData.segments.length; i++) {
            const segment = processedData.segments[i];
            const prompt = segment.prompt || "";

            // 高级算法：精确提取年份、年龄、场景和事件
            const { year, age, scene, event } = extractSectionInfo(
              prompt,
              name,
              i
            );

            const sectionText = `${year}年/${age}岁\n${scene}\n${event}`;
            sectionTitle.push(sectionText);

            console.log(
              `📝 生成第${i + 1}个分镜: ${sectionText.replace(/\n/g, " | ")}`
            );
          }

          console.log(
            `✅ 成功从processed_data.json生成了${sectionTitle.length}个分镜标题\n`
          );

          // 将生成的sectionTitle写入配置文件
          await updateConfigFile(sectionTitle, name);
        }
      } else {
        console.log(
          `⚠️ 未找到 ${name} 的processed_data.json文件，将使用配置中的sectionTitle\n`
        );
      }
    } catch (error) {
      console.warn(
        `[警告] 从processed_data.json生成sectionTitle失败: ${error.message}\n`
      );
    }
  }

  // 可选：强制输出为指定比例与分辨率
  const targetAspect =
    config.target_aspect || CONFIG_VIDEO.DEFAULT_ASPECT_RATIO;
  const targetResolution =
    config.target_resolution || CONFIG_VIDEO.DEFAULT_RESOLUTION;
  const fitMode = config.fit_mode || CONFIG_VIDEO.DEFAULT_FIT_MODE; // 'crop' 或 'pad'（当前仅实现 crop）

  try {
    // 0. 清理输出目录中的旧文件
    const inputDir = path.resolve(CONFIG_PATHS.INPUT_DIR);
    const outputDir = path.resolve(CONFIG_PATHS.OUTPUT_DIR);
    const urlHash = crypto
      .createHash("md5")
      .update(url)
      .digest("hex")
      .substring(0, CONFIG_PATHS.HASH_LENGTH);
    await cleanupOutputDir(outputDir, urlHash);

    // 1. 下载视频
    const videoPath = await downloadVideo(url, inputDir);

    // 2. 标准化视频分辨率为720x1280
    console.log(`[2/5] 正在标准化视频分辨率为 ${CONFIG_VIDEO.DEFAULT_RESOLUTION}...`);
    const standardizedPath = await standardizeAspect(videoPath, outputDir, {
      targetAspect: CONFIG_VIDEO.DEFAULT_ASPECT_RATIO,
      targetResolution: CONFIG_VIDEO.DEFAULT_RESOLUTION,
      fitMode: CONFIG_VIDEO.DEFAULT_FIT_MODE,
      qualityMode: qualityMode,
      enableSpeedOptimization: enableSpeedOptimization
    });

    // 3. 添加镜头标题
    const videoWithTitles = await addSectionTitles(
      standardizedPath,
      sectionTitle,
      outputDir,
      watermark,
      title,
      titleAnimation,
      sectionTitleAnimation,
      qualityMode,
      titleDuration,
      endTitle,
      endTitleDuration,
      endTitleAnimation,
      endTitleSound,
      enableSpeedOptimization,
      useBabyCry,
      disclaimerText,
      sectionFirstTitleTime
    );

    // 4. 合成背景音乐并应用滤镜
    const composedPath = await compositeWithMusic(
      videoWithTitles,
      bgMusic,
      outputDir,
      qualityMode,
      enableSpeedOptimization
    );

    // 4.3 顶部左侧模糊遮罩（x:15,y:15, 150x60, 近似圆角）
    let maskedPath = composedPath;
    try {
      maskedPath = await addBlurMask(composedPath, outputDir, {
        ...CONFIG_MASK,
        sigma: 12,
        maskSigma: 3,
        qualityMode: qualityMode,
      });
    } catch (e) {
      console.warn(`[警告] 模糊遮罩处理失败，保留合成后视频: ${e.message}`);
      maskedPath = composedPath;
    }

    // // 4.4 使用 AI 增强画质（若可用）
    let enhancedPath = maskedPath;
    let finalVideoPath = enhancedPath;

    // 4.5 生成封面图片
    let coverPath = null;
    if (name && title) {
      try {
        coverPath = await generateCover(name, title, outputDir);
        if (coverPath) {
          console.log(`📸 封面图片已生成: ${coverPath}`);
        }
      } catch (error) {
        console.warn(`[警告] 封面生成失败: ${error.message}`);
      }
    }
    // 5. 清理临时文件（标题阶段临时 + 若标准化成功则删除合成中间件）
    // 注意：不删除原始输入视频，只删除处理过程中的临时文件
    if (!skipTempCleanup) {
      const temps = [];
      if (videoWithTitles !== videoPath) temps.push(videoWithTitles); // 只有当带标题视频不是原始视频时才删除
      if (finalVideoPath !== composedPath && composedPath !== videoPath)
        temps.push(composedPath);
      if (
        finalVideoPath !== maskedPath &&
        maskedPath !== composedPath &&
        maskedPath !== videoPath
      )
        temps.push(maskedPath);
      if (
        finalVideoPath !== enhancedPath &&
        enhancedPath !== maskedPath &&
        enhancedPath !== composedPath &&
        enhancedPath !== videoPath
      )
        temps.push(enhancedPath);
      await cleanupTempFiles(temps);
    } else {
      console.log(`[5/5] 跳过临时文件清理（速度优化）`);
    }

    // 性能监控结束
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ history-person 任务完成！`);
    console.log(`📁 输入视频: ${videoPath}`);
    console.log(`🎬 最终视频: ${finalVideoPath}`);
    if (coverPath) {
      console.log(`📸 封面图片: ${coverPath}`);
    }
    console.log(`⏱️ 总处理时间: ${totalTime}秒`);

    // 性能优化建议
    if (!enableSpeedOptimization && totalTime > 60) {
      console.log(
        `💡 性能提示: 处理时间较长，建议启用 enableSpeedOptimization: true`
      );
    }
    if (!skipTempCleanup && totalTime > 30) {
      console.log(
        `💡 性能提示: 可启用 skipTempCleanup: true 跳过临时文件清理以节省时间`
      );
    }
    if (qualityMode === "high" && totalTime > 120) {
      console.log(
        `💡 性能提示: 可使用 qualityMode: "fast" 或 "turbo" 以提升处理速度`
      );
    }
  } catch (error) {
    console.error(`\n❌ history-person 任务失败:`, error.message);
    throw error;
  }
}
