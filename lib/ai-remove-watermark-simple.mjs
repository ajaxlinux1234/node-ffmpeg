import "zx/globals";
import crypto from "crypto";
import { execSync } from "child_process";

// Directories
const INPUT_DIR = path.resolve("input/ai-remove-watermark");
const OUTPUT_DIR = path.resolve("output/ai-remove-watermark");

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

// 使用 FFmpeg 直接应用模糊遮罩
async function applyBlurMask(inputPath, meta, maskOpt = {}) {
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
  const blurFilter = `boxblur=20:1`;
  const cropFilter = `crop=${mw}:${mh}:${x}:${y}`;
  const overlayFilter = `overlay=${x}:${y}`;
  
  // 完整的滤镜链：裁剪水印区域 -> 模糊 -> 覆盖回原视频
  const filterComplex = `[0:v]split[main][crop];[crop]${cropFilter},${blurFilter}[blurred];[main][blurred]${overlayFilter}[out]`;

  const args = [
    "-y",
    "-i", `"${inputPath}"`,
    "-filter_complex", `"${filterComplex}"`,
    "-map", "[out]",
    "-map", "0:a?",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-c:a", "copy",
    `"${outPath}"`
  ];

  execSync(`ffmpeg ${args.join(' ')}`, { stdio: 'inherit' });
  return outPath;
}

async function processVideo(url, options = {}) {
  console.log("\n开始执行模糊遮罩去水印任务...");
  const inputPath = await prepareInputVideo(url);
  const meta = await probeVideo(inputPath);
  console.log(
    `[信息] 分辨率: ${meta.width}x${meta.height}, fps: ${meta.fps.toFixed ? meta.fps.toFixed(3) : meta.fps}, 编码: ${meta.codec}, 像素格式: ${meta.pix_fmt}`
  );

  // 直接使用 FFmpeg 模糊遮罩处理，无需提取帧和 AI 处理
  const outVideo = await applyBlurMask(inputPath, meta, options.mask);

  console.log(`✅ 处理完成! 输出文件: ${outVideo}`);
  console.log(`📁 输入视频: ${inputPath}`);
  console.log(`🎬 输出视频: ${outVideo}`);
  return outVideo;
}

export default async function runAiRemoveWatermark(configOrUrl) {
  let url = "";
  let options = {};
  if (typeof configOrUrl === "string") {
    url = configOrUrl;
  } else if (configOrUrl && typeof configOrUrl.url === "string") {
    url = configOrUrl.url;
    // pass through mask options if any
    if (configOrUrl.mask && typeof configOrUrl.mask === "object") {
      options.mask = configOrUrl.mask;
    }
  }
  if (!url)
    throw new Error("未提供 URL，且 config.mjs 中缺少 ai-remove-watermark.url");
  return await processVideo(url, options);
}
