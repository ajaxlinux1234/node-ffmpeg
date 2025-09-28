import "zx/globals";
import crypto from "crypto";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";

// =============================================================================
// CONFIGURATION CONSTANTS - 字幕和视频处理相关的配置参数
// =============================================================================

/**
 * 字幕和布局配置
 */
const CONFIG_SUBTITLE = {
  FONT_SIZE_TITLE: 50, // 主要字幕字体大小
  FONT_SIZE_COVER: 80, // 封面标题字体大小
  FONT_SIZE_WATERMARK: 20, // 水印字体大小
  FONT_SIZE_GLOBAL_TITLE: 60, // 全局标题字体大小
  CHAR_WIDTH_FACTOR: 0.8, // 字符宽度因子
  TYPEWRITER_SPEED: 0.08, // 打字机效果速度（秒/字符）
  LEFT_MARGIN: 100, // 左边距（px）
  RIGHT_MARGIN: 100, // 右边距（px）
  SAFE_PADDING: 200, // 安全边距（左右边距之和）
  SUBTITLE_POSITION_Y_PERCENT: 0.4, // 字幕Y位置百分比（从下往上）
  MIN_CHARS_PER_LINE: 3, // 每行最小字符数
  MIN_USABLE_WIDTH: 200, // 最小可用宽度
  FADE_IN_OUT_MS: 50, // 淡入淡出时间（毫秒）
  SCALE_DURATION_MS: 200, // 缩放动画持续时间（毫秒）
  SCALE_END_MS: 400, // 缩放结束时间（毫秒）
  SCALE_X_START: 120, // X缩放起始值
  SCALE_Y_START: 120, // Y缩放起始值
  SCALE_X_END: 100, // X缩放结束值
  SCALE_Y_END: 100, // Y缩放结束值
};

/**
 * 间距和定位配置 - 统一管理所有间距相关参数
 */
const CONFIG_SPACING = {
  // 全局标题间距配置
  GLOBAL_TITLE_CHAR_SPACING_FACTOR: 1, // 全局标题字符间距因子（相对于字体大小）
  GLOBAL_TITLE_LINE_SPACING: 10, // 全局标题行间距（px）
  GLOBAL_TITLE_MARGIN_LEFT: 80, // 全局标题左边距（px）
  GLOBAL_TITLE_MARGIN_RIGHT: 80, // 全局标题右边距（px）
  GLOBAL_TITLE_POSITION_Y_PERCENT: 0.15, // 全局标题Y位置百分比（从顶部）
  
  // 字幕间距配置
  SUBTITLE_CHAR_SPACING_NORMAL: 5, // 普通字符间距（px）
  SUBTITLE_CHAR_SPACING_DIGIT: 8, // 数字字符间距（px）
  SUBTITLE_CHAR_WIDTH_NORMAL: 0.8, // 普通字符宽度因子
  SUBTITLE_CHAR_WIDTH_DIGIT: 0.5, // 数字字符宽度因子
  
  // 封面标题间距配置
  COVER_TITLE_MARGIN_TOP: 80, // 封面标题顶部边距（px）
  
  // 水印间距配置
  WATERMARK_MARGIN: 100, // 水印边距（px）
};

/**
 * 水印动画配置
 */
const CONFIG_WATERMARK = {
  FONT_SIZE: 20,
  OPACITY_HEX: "&HD0FFFFFF", // 白色半透明
  NO_OUTLINE_COLOR: "&H00000000", // 无描边
  LEFT_BOTTOM_X: 100, // 左下角X位置
  LEFT_BOTTOM_Y_OFFSET: 100, // 左下角Y偏移
  TOP_RIGHT_X_OFFSET: 100, // 右上角X偏移
  TOP_RIGHT_Y: 100, // 右上角Y位置
  MOVEMENT_START_MS: 1000, // 移动开始时间（毫秒）
  STAY_END_MS: 1000, // 停留结束时间（毫秒）
  TRAVEL_DURATION_FACTOR: 2000, // 移动时长因子
  HALF_WAY_FACTOR: 2, // 中点分割因子
  ARC_CENTER_Y_PERCENT: 0.3, // 弧线中点Y百分比
};

/**
 * 视频处理配置
 */
const CONFIG_VIDEO = {
  DEFAULT_WIDTH: 704, // 默认视频宽度
  DEFAULT_HEIGHT: 1248, // 默认视频高度
  DEFAULT_ASPECT_RATIO: "9:16", // 默认宽高比
  DEFAULT_RESOLUTION: "1080x1920", // 默认分辨率
  DEFAULT_FIT_MODE: "crop", // 默认适应模式
  CRF_VALUE: 18, // 视频质量参数
  PRESET_MEDIUM: "medium", // 编码预设
  AUDIO_BITRATE: "192k", // 音频比特率
  VIDEO_CODEC: "libx264", // 视频编码器
  PIXEL_FORMAT: "yuv420p", // 像素格式
  AUDIO_CODEC_COPY: "copy", // 音频编码（复制）
  AUDIO_CODEC_AAC: "aac", // 音频编码（AAC）
};

/**
 * 文件路径配置
 */
const CONFIG_PATHS = {
  INPUT_DIR: "input/history-person",
  OUTPUT_DIR: "output/history-person",
  HASH_LENGTH: 12, // URL哈希长度
  PROCESSED_SUFFIX: "_processed", // 处理后缀
  TITLES_TEMP_SUFFIX: "_with_titles_temp", // 标题临时后缀
  THUMBNAIL_SUFFIX: "_title.png", // 缩略图后缀
  ASS_SUFFIX: ".ass", // ASS字幕文件后缀
};

/**
 * 清理配置
 */
const CONFIG_CLEANUP = {
  OLD_FINAL_PATTERN: "_final_",
  VERIFY_PATTERN: "verify_",
  TEST_PATTERN: "test_",
  PROCESSED_KEEP_PATTERN: "_processed",
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
    // 确保即使出错也返回正确的结构
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
      execCommand(
        `ffmpeg -y -i "${tmpEnhanced}" -i "${videoPath}" -map 0:v -map 1:a? -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a copy "${outPath}"`
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
  execCommand(
    `ffmpeg -y -i "${videoPath}" -vf "${vf}" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a copy "${outPath}"`
  );
  console.log(`[4.4/5] FFmpeg 增强完成: ${outPath}`);
  return outPath;
}

/**
 * 在视频上添加模糊遮罩（近似圆角，使用模糊的 alpha mask 视觉等效半径≈5px）
 * @param {string} videoPath
 * @param {string} outputDir
 * @param {{x:number,y:number,w:number,h:number,sigma?:number,maskSigma?:number}} opt
 * @returns {Promise<string>} 输出路径
 */
async function applyBlurMask(videoPath, outputDir, opt) {
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

  execCommand(
    `ffmpeg -y -i "${videoPath}" -filter_complex "${filter}" -map "[out]" -map 0:a? -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${outPath}"`
  );
  return outPath;
}

/**
 * 将视频标准化为严格的目标比例与分辨率
 * - 当前实现：fitMode === 'crop'，居中微裁剪以匹配目标比例，然后缩放至目标分辨率
 * @param {string} videoPath
 * @param {string} outputDir
 * @param {{targetAspect:string, targetResolution:string, fitMode:'crop'|'pad'}} options
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
  execCommand(
    `ffmpeg -y -i "${videoPath}" -vf "${filter}" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${outPath}"`
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
 * 生成视频封面（使用第一帧 + 标题）
 * @param {string} videoPath - 视频文件路径
 * @param {string} title - 封面标题
 * @param {string} outputDir - 输出目录
 * @returns {string} - 封面图片路径
 */
async function generateThumbnail(videoPath, title, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });

  const videoName = path.basename(videoPath, path.extname(videoPath));
  const thumbnailPath = path.join(outputDir, `${videoName}_title.png`);

  console.log(`[2/5] 正在生成封面图片...`);

  try {
    // 获取视频信息
    const videoInfoResult = execCommand(
      `ffprobe -v quiet -print_format json -show_streams "${videoPath}"`
    );
    const videoInfo = JSON.parse(videoInfoResult.stdout);
    const videoStream = videoInfo.streams.find((s) => s.codec_type === "video");

    if (!videoStream) {
      throw new Error("无法获取视频流信息");
    }

    const width = videoStream.width;
    const height = videoStream.height;

    console.log(`[2/5] 原视频尺寸: ${width}x${height}`);

    // 由于当前 FFmpeg 版本没有 drawtext 滤镜，使用 ASS 字幕方式添加标题
    const fontSize = CONFIG_SUBTITLE.FONT_SIZE_COVER; // 字体大小改为80px

    // 创建临时 ASS 字幕文件用于封面标题
    const tempAssPath = path.join(
      outputDir,
      `${videoName}_cover_title${CONFIG_PATHS.ASS_SUFFIX}`
    );

    let ass = "";
    ass += `[Script Info]\n`;
    ass += `ScriptType: v4.00+\n`;
    ass += `PlayResX: ${width}\n`;
    ass += `PlayResY: ${height}\n`;
    ass += `WrapStyle: 2\n`; // 启用自动换行
    ass += `ScaledBorderAndShadow: yes\n\n`;

    ass += `[V4+ Styles]\n`;
    ass += `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n`;
    // 橙色文字，黑色描边，居中对齐，距离顶部80px，左右边距100px确保自动换行
    ass += `Style: Title, Arial, ${fontSize}, &H0000A5FF, &H0000A5FF, &H80000000, &H80000000, 0, 0, 0, 0, 100, 100, 0, 0, 1, 4, 6, 8, ${CONFIG_SUBTITLE.LEFT_MARGIN}, ${CONFIG_SUBTITLE.RIGHT_MARGIN}, ${CONFIG_SPACING.COVER_TITLE_MARGIN_TOP}, 0\n\n`;

    ass += `[Events]\n`;
    ass += `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
    // 显示整个视频时长的标题
    const escapedTitle = title
      .replace(/\\/g, "\\\\")
      .replace(/{/g, "\\{")
      .replace(/}/g, "\\}");
    ass += `Dialogue: 0,0:00:00.00,0:00:01.00,Title,,0,0,0,,${escapedTitle}\n`;

    // 写入 ASS 文件
    const BOM = "\uFEFF";
    await fs.writeFile(tempAssPath, BOM + ass, "utf8");

    // 提取第一帧并使用 subtitles 滤镜添加标题（使用正确语法：subtitles=filename='path'）
    const assCoverPath = tempAssPath.replace(/\\/g, "/");
    execCommand(
      `ffmpeg -y -ss 0.1 -i "${videoPath}" -vf "subtitles=filename='${assCoverPath}'" -vframes 1 "${thumbnailPath}"`
    );

    // 清理临时 ASS 文件
    await fs.remove(tempAssPath).catch(() => {});
    console.log(`[2/5] 临时字幕文件已清理`);

    console.log(`[2/5] 使用 ASS 字幕方式添加标题`);

    console.log(
      `[2/5] 封面图片已生成: ${thumbnailPath} (${width}x${height}, 包含标题: "${title}")`
    );
    return thumbnailPath;
  } catch (error) {
    console.warn(`[警告] 封面生成失败: ${error.message}，尝试生成无标题封面`);
    try {
      // 降级方案：生成无标题封面
      execCommand(
        `ffmpeg -y -ss 0.1 -i "${videoPath}" -vframes 1 "${thumbnailPath}"`
      );
      console.log(`[2/5] 无标题封面图片已生成: ${thumbnailPath}`);
      return thumbnailPath;
    } catch (fallbackError) {
      console.warn(`[警告] 封面生成完全失败: ${fallbackError.message}`);
      return "";
    }
  }
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
 * @returns {string} - 处理后的视频路径
 */
async function addSectionTitles(
  videoPath,
  sectionTitles,
  outputDir,
  watermark,
  topTitle
) {
  if ((!sectionTitles || sectionTitles.length === 0) && !watermark) {
    console.log(`[3/5] 没有镜头标题且未配置水印，跳过字幕生成步骤`);
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
    // Outline=3, Shadow=2 适中可读性；颜色改为黄色，左对齐；从下往上40%位置
    // Alignment=1 表示底部左对齐，使用绝对定位控制位置
    // 加粗字体Bold=1，字体大小适中确保完整显示
    const largerFontSize = CONFIG_SUBTITLE.FONT_SIZE_TITLE; // 字体大小设置为50px
    ass += `Style: Title, KaiTi, ${largerFontSize}, &H0000FFFF, &H0000FFFF, &H80000000, &H80000000, 1, 0, 0, 0, 100, 100, 0, 0, 1, 3, 2, 1, 0, 0, 0, 0\n`;
    // 关键词样式：红色填充，黑色描边，50px字体，与Title相同
    ass += `Style: Keyword, KaiTi, ${largerFontSize}, &H000000FF, &H000000FF, &H80000000, &H80000000, 1, 0, 0, 0, 100, 100, 0, 0, 1, 3, 2, 1, 0, 0, 0, 0\n`;
    // 顶部标题样式：白色文字，黑色描边，使用配置的字体大小，顶部位置居中，无阴影
    // 说明：ASS 颜色为 &HAABBGGRR（AA=alpha, 00不透明）。白色文字，黑色描边，无阴影。
    ass += `Style: TopTitle, KaiTi, ${CONFIG_SUBTITLE.FONT_SIZE_GLOBAL_TITLE}, &H80FFFFFF, &H80FFFFFF, &H00000000, &H80000000, 1, 0, 0, 0, 100, 100, 0, 0, 1, 4, 0, 2, ${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT}, ${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_RIGHT}, 0, 0\n`;
    // 顶部标题关键词样式：红色填充，黑色描边，其他参数与TopTitle相同
    ass += `Style: TopTitleKeyword, KaiTi, ${CONFIG_SUBTITLE.FONT_SIZE_GLOBAL_TITLE}, &H000000FF, &H000000FF, &H00000000, &H80000000, 1, 0, 0, 0, 100, 100, 0, 0, 1, 4, 0, 2, ${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT}, ${CONFIG_SPACING.GLOBAL_TITLE_MARGIN_RIGHT}, 0, 0\n\n`;
    // 水印样式（普通字体白色，极低不透明度≈0.02 -> AA≈FA），起点/中段/终点；去除描边和阴影
    // 注意：ASS 颜色为 &HAABBGGRR，AA 越接近 FF 越透明
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

    // 解析关键词语法，返回字符数组，每个字符包含内容和样式信息
    const parseKeywords = (text) => {
      const result = [];
      let i = 0;

      while (i < text.length) {
        if (text.substring(i, i + 2) === "{{") {
          // 找到关键词开始
          const keywordStart = i + 2;
          const keywordEnd = text.indexOf("}}", keywordStart);

          if (keywordEnd !== -1) {
            // 找到完整的关键词
            const keyword = text.substring(keywordStart, keywordEnd);
            for (const char of keyword) {
              result.push({ char, isKeyword: true });
            }
            i = keywordEnd + 2;
          } else {
            // 没有找到结束标记，当作普通字符处理
            result.push({ char: text[i], isKeyword: false });
            i++;
          }
        } else {
          // 普通字符
          result.push({ char: text[i], isKeyword: false });
          i++;
        }
      }

      return result;
    };

    // 移除关键词标记符号，返回纯净的显示文本
    const removeKeywordMarkers = (text) => {
      return text.replace(/\{\{([^}]+)\}\}/g, "$1");
    };

    const wrapCJK = (s) => {
      // 先移除关键词标记，然后进行换行处理
      const cleanText = removeKeywordMarkers(String(s).trim());
      if (cleanText.length <= maxCharsPerLine) {
        return cleanText; // 短文本不换行
      }

      const lines = [];
      let currentLine = "";

      for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];

        // 如果当前行加上这个字符会超出限制，就换行
        if (currentLine.length >= maxCharsPerLine) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine += char;
        }
      }

      // 添加最后一行
      if (currentLine) {
        lines.push(currentLine);
      }

      return lines.join("\\N"); // 使用 ASS 换行符
    };

    for (let i = 0; i < sectionTitles.length; i++) {
      let start;
      if (i === sectionTitles.length - 1) {
        // 最后一个字幕在倒数第二秒开始
        start = duration - 2.0;
      } else {
        // 其他字幕按间隔显示
        start = i * 5;
      }
      const end = Math.min(start + 4.0, duration); // 确保不超出视频时长

      // 解析关键词并生成带颜色的打字机效果
      const parsedChars = parseKeywords(sectionTitles[i]);
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

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const chars = Array.from(line); // 正确处理中文字符

        for (let j = 0; j < chars.length; j++) {
          const char = chars[j];
          if (char.trim() === "") continue; // 跳过空格

          const charStart = start + totalCharIndex * typewriterSpeed;
          const charEnd = Math.min(end, charStart + (end - start)); // 字符显示到字幕结束

          if (charStart >= end) break; // 如果字符开始时间超过字幕结束时间，停止

          // 计算字符位置：100px左边距 + 字符偏移
          const baseX = CONFIG_SUBTITLE.LEFT_MARGIN; // 严格100px左边距
          const baseY =
            H -
            Math.floor(H * CONFIG_SUBTITLE.SUBTITLE_POSITION_Y_PERCENT) +
            lineIndex * (largerFontSize + 10); // 从下往上40%位置，每行间隔

          // 智能字符间距：数字之间紧密，数字与非数字之间有间距
          const isCurrentDigit = /\d/.test(char);
          const isPrevDigit = j > 0 ? /\d/.test(chars[j - 1]) : false;

          // 计算累积位置：需要考虑前面所有字符的实际宽度
          let charX = baseX;
          for (let k = 0; k < j; k++) {
            const prevChar = chars[k];
            const isPrevCharDigit = /\d/.test(prevChar);
            const isNextCharDigit =
              k < chars.length - 1 ? /\d/.test(chars[k + 1]) : false;

            if (isPrevCharDigit && isNextCharDigit) {
              charX += largerFontSize * CONFIG_SPACING.SUBTITLE_CHAR_WIDTH_DIGIT; // 数字宽度，无额外间距
            } else if (isPrevCharDigit && !isNextCharDigit) {
              charX += largerFontSize * CONFIG_SPACING.SUBTITLE_CHAR_WIDTH_DIGIT + CONFIG_SPACING.SUBTITLE_CHAR_SPACING_DIGIT; // 最后一个数字，加间距
            } else {
              charX += largerFontSize * CONFIG_SPACING.SUBTITLE_CHAR_WIDTH_NORMAL + CONFIG_SPACING.SUBTITLE_CHAR_SPACING_NORMAL; // 非数字宽度 + 间距
            }
          }

          // 检查是否超出右边距100px
          if (charX + largerFontSize * 0.8 > W - CONFIG_SUBTITLE.RIGHT_MARGIN) {
            console.warn(`[3/5] 字符 "${char}" 超出右边距，跳过显示`);
            continue;
          }

          // 确定字符样式：根据字符在原文中的位置决定是否为关键词
          const globalCharIndex = totalCharIndex; // 当前字符在整个清理后文本中的索引
          const isKeyword = charKeywordMap.get(globalCharIndex) || false;
          const styleName = isKeyword ? "Keyword" : "Title";

          // 转义字符
          const escapedChar = char.replace(/{/g, "\\{").replace(/}/g, "\\}");

          // 打字机效果：快速淡入 + 轻微弹跳效果 + 绝对定位
          const effect = `{\\pos(${charX},${baseY})\\fad(${
            CONFIG_SUBTITLE.FADE_IN_OUT_MS
          },${CONFIG_SUBTITLE.FADE_IN_OUT_MS * 6})\\t(0,${
            CONFIG_SUBTITLE.SCALE_DURATION_MS
          },\\fscx${CONFIG_SUBTITLE.SCALE_X_START}\\fscy${
            CONFIG_SUBTITLE.SCALE_Y_START
          })\\t(${CONFIG_SUBTITLE.SCALE_DURATION_MS},${
            CONFIG_SUBTITLE.SCALE_END_MS
          },\\fscx${CONFIG_SUBTITLE.SCALE_X_END}\\fscy${
            CONFIG_SUBTITLE.SCALE_Y_END
          })}`;

          ass += `Dialogue: 0,${toAssTime(charStart)},${toAssTime(
            charEnd
          )},${styleName},,0,0,0,,${effect}${escapedChar}\n`;

          totalCharIndex++;
        }
      }

      console.log(
        `[3/5] 添加打字机效果字幕 ${i + 1}/${sectionTitles.length}: "${
          sectionTitles[i]
        }" -> ${totalCharIndex}个字符 (${start}s-${end}s)`
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

    // 添加顶部标题（如果配置提供）：贯穿全视频，读取config.title
    if (topTitle && duration > 0) {
      const topTitleEsc = String(topTitle)
        .replace(/\\/g, "\\\\")
        .replace(/{/g, "\\{")
        .replace(/}/g, "\\}");

      // 解析关键词并生成带颜色的标题
      const parsedTopTitleChars = parseKeywords(topTitle);
      const wrappedTopTitle = wrapCJK(topTitle);
      const topTitleText = wrappedTopTitle.replace(/\\N/g, "\n"); // 保留换行符以便处理多行
      const topTitleLines = topTitleText.split("\n");

      // 顶部标题位置：使用配置的Y位置百分比，居中对齐
      const topTitleY = Math.floor(H * CONFIG_SPACING.GLOBAL_TITLE_POSITION_Y_PERCENT);

      // 计算标题总高度用于垂直居中
      const topTitleFontSize = CONFIG_SUBTITLE.FONT_SIZE_GLOBAL_TITLE;
      const lineSpacing = topTitleFontSize + CONFIG_SPACING.GLOBAL_TITLE_LINE_SPACING; // 行间距
      const totalTitleHeight = topTitleLines.length * lineSpacing - 10; // 减去最后一个行间距
      const startY = Math.max(CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT, topTitleY - Math.floor(totalTitleHeight / 2)); // 确保不超出顶部边界

      // 为每个字符创建关键词映射
      const topTitleCharKeywordMap = new Map();
      let topTitleCleanCharIndex = 0;
      for (const parsedChar of parsedTopTitleChars) {
        topTitleCharKeywordMap.set(
          topTitleCleanCharIndex,
          parsedChar.isKeyword
        );
        topTitleCleanCharIndex++;
      }

      // 计算每行字符的起始X位置（居中对齐）
      let globalCharIndex = 0; // 全局字符索引，用于映射关键词状态
      for (let lineIndex = 0; lineIndex < topTitleLines.length; lineIndex++) {
        const line = topTitleLines[lineIndex];
        const lineChars = Array.from(line);
        // 使用配置的字符间距：调整全局标题字符间距
        const charSpacing = topTitleFontSize * CONFIG_SPACING.GLOBAL_TITLE_CHAR_SPACING_FACTOR; // 使用配置的字符间距因子
        const lineWidth = lineChars.length * charSpacing; // 估算行宽度
        const startX = Math.max(CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT, Math.floor((W - lineWidth) / 2)); // 居中对齐，使用配置的左边距

        // 为每行创建一个闪光效果的标题
        const lineStart = startX;
        let currentX = lineStart;

        for (let charIndex = 0; charIndex < lineChars.length; charIndex++) {
          const char = lineChars[charIndex];
          if (char.trim() === "") {
            globalCharIndex++; // 即使是空格也要增加索引
            continue; // 跳过空格
          }

          // 确定字符样式：根据字符在原文中的位置决定是否为关键词
          const isKeyword =
            topTitleCharKeywordMap.get(globalCharIndex) || false;
          const styleName = isKeyword ? "TopTitleKeyword" : "TopTitle";

          // 转义字符
          const escapedChar = char.replace(/{/g, "\\{").replace(/}/g, "\\}");

          // 计算字符位置
          const charX = currentX;
          const charY = startY + lineIndex * lineSpacing;

          // 45%白色从左到右的循环斜条闪光效果 - 循环执行，优化版
          const flashCycleDuration = 4000; // 4秒循环（从2秒增加到4秒）
          const flashStartDelay = (charX / W) * flashCycleDuration; // 根据字符位置延迟开始时间

          // 创建循环闪光效果：每个循环包括亮起和恢复
          let flashEffect = "";
          const totalDuration = Math.floor(duration * 1000); // 视频总时长（毫秒）
          const cycleCount = Math.ceil(totalDuration / flashCycleDuration); // 需要多少个循环

          for (let cycle = 0; cycle < cycleCount; cycle++) {
            const cycleStart = cycle * flashCycleDuration;
            const cycleEnd = (cycle + 1) * flashCycleDuration;
            const actualEnd = Math.min(cycleEnd, totalDuration);

            // 每个循环的开始延迟（相对于整个视频）
            const cycleFlashStartDelay = cycleStart + flashStartDelay;
            const brightEnd = cycleFlashStartDelay + 800; // 亮起时间增加到0.8秒
            const cycleEndTime = Math.min(
              cycleStart + flashCycleDuration,
              totalDuration
            );

            if (cycleFlashStartDelay < totalDuration) {
              // 修复闪光效果：保持白色但改变透明度，不要变成透明
              flashEffect += `\\t(${cycleFlashStartDelay},${brightEnd},\\1a&HFF&\\3a&HFF&\\bord0)\\t(${brightEnd},${cycleEndTime},\\1a&H80&\\3a&H80&\\bord4)`;
            }
          }

          const finalFlashEffect = `{\\pos(${charX},${charY})\\fad(300,300)${flashEffect}}`;

          // 贯穿全视频的标题
          ass += `Dialogue: 0,${toAssTime(0)},${toAssTime(
            duration
          )},${styleName},,0,0,0,,${finalFlashEffect}${escapedChar}\n`;

          currentX += charSpacing; // 使用新的字符间距更新位置
          globalCharIndex++; // 增加全局字符索引
        }
      }

      console.log(
        `[3/5] 顶部标题已添加: "${topTitle}" (贯穿全视频，${topTitleLines.length}行，${topTitleCleanCharIndex}个字符)`
      );
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
    const burnCmd = `ffmpeg -y -i "${videoPath}" -vf "subtitles=filename='${assPathEscaped}'" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${tempVideoPath}"`;
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
          console.log(`[3/5] 字幕验证截图已生成: ${testScreenshotPath}`);
          console.log(`[3/5] 请检查截图确认字幕是否正确显示`);
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
 * @returns {string} - 最终输出视频路径
 */
async function compositeWithMusic(videoPath, bgMusicPath, outputDir) {
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
    // 保持原始比例，不进行缩放
    execCommand(
      `ffmpeg -y -i "${videoPath}" -i "${resolvedBgMusicPath}" -map 0:v -map 1:a:0 -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} -shortest "${finalVideoPath}"`
    );
  } else {
    console.log(`[4/5] 不使用背景音乐，仅处理视频`);
    execCommand(
      `ffmpeg -y -i "${videoPath}" -map 0:v -map 0:a? -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_COPY} "${finalVideoPath}"`
    );
  }

  console.log(`[4/5] 最终视频已生成: ${finalVideoPath}`);
  return finalVideoPath;
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
 * 主函数：执行 history-person 命令
 * @param {Object} config - 配置对象
 */
export default async function runHistoryPerson(config) {
  if (!config) {
    throw new Error("缺少 history-person 配置");
  }

  const { url, title, sectionTitle, "bg-music": bgMusic, watermark } = config;
  // 可选：强制输出为指定比例与分辨率
  const targetAspect =
    config.target_aspect || CONFIG_VIDEO.DEFAULT_ASPECT_RATIO;
  const targetResolution =
    config.target_resolution || CONFIG_VIDEO.DEFAULT_RESOLUTION;
  const fitMode = config.fit_mode || CONFIG_VIDEO.DEFAULT_FIT_MODE; // 'crop' 或 'pad'（当前仅实现 crop）

  if (!url) {
    throw new Error("配置中缺少视频 URL");
  }

  console.log(`\n开始处理 history-person 任务...`);
  console.log(`视频URL: ${url}`);
  console.log(`标题: ${title || "未设置"}`);
  console.log(`镜头标题数量: ${sectionTitle ? sectionTitle.length : 0}`);
  console.log(`水印: ${watermark || "未设置"}`);
  console.log(`背景音乐: ${bgMusic || "未设置"}`);

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

    // 2. 生成封面
    let thumbnailPath = "";
    if (title) {
      thumbnailPath = await generateThumbnail(videoPath, title, outputDir);
    }

    // 3. 添加镜头标题
    const videoWithTitles = await addSectionTitles(
      videoPath,
      sectionTitle,
      outputDir,
      watermark,
      title
    );

    // 4. 合成背景音乐并应用滤镜
    const composedPath = await compositeWithMusic(
      videoWithTitles,
      bgMusic,
      outputDir
    );

    // 4.3 顶部左侧模糊遮罩（x:15,y:15, 150x60, 近似圆角）
    let maskedPath = composedPath;
    try {
      maskedPath = await applyBlurMask(composedPath, outputDir, {
        x: 12,
        y: 12,
        w: 125,
        h: 50,
        sigma: 12,
        maskSigma: 3,
      });
    } catch (e) {
      console.warn(`[警告] 模糊遮罩处理失败，保留合成后视频: ${e.message}`);
      maskedPath = composedPath;
    }

    // // 4.4 使用 AI 增强画质（若可用）
    let enhancedPath = maskedPath;
    // try {
    //   enhancedPath = await applyAIEnhance(maskedPath, outputDir, { scale: 2, model: 'realesrgan-x4plus' });
    // } catch (e) {
    //   console.warn(`[警告] AI 增强失败，保留遮罩后视频: ${e.message}`);
    //   enhancedPath = maskedPath;
    // }

    // 4.5 标准化到严格 9:16（微裁剪 + 统一缩放到 1080x1920）
    let finalVideoPath = enhancedPath;
    // try {
    //   finalVideoPath = await standardizeAspect(enhancedPath, outputDir, {
    //     targetAspect,
    //     targetResolution,
    //     fitMode,
    //   });
    // } catch (e) {
    //   console.warn(`[警告] 强制比例处理失败，保留合成后视频: ${e.message}`);
    //   finalVideoPath = enhancedPath;
    // }

    // 5. 清理临时文件（标题阶段临时 + 若标准化成功则删除合成中间件）
    // 注意：不删除原始输入视频，只删除处理过程中的临时文件
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

    console.log(`\n✅ history-person 任务完成！`);
    console.log(`📁 输入视频: ${videoPath}`);
    if (thumbnailPath) {
      console.log(`🖼️  封面图片: ${thumbnailPath}`);
    }
    console.log(`🎬 最终视频: ${finalVideoPath}`);
  } catch (error) {
    console.error(`\n❌ history-person 任务失败:`, error.message);
    throw error;
  }
}
