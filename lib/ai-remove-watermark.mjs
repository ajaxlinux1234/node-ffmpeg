import 'zx/globals';
import crypto from 'crypto';

// Directories
const INPUT_DIR = path.resolve('input/ai-remove-watermark');
const OUTPUT_DIR = path.resolve('output/ai-remove-watermark');
const CACHE_DIR = path.resolve('.cache/ai-remove-watermark');

async function ensureDirs() {
  await fs.mkdir(INPUT_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function isHttp(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

function resolveLocal(p) {
  if (!p) return '';
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

function urlHash(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

async function readManifest() {
  const mf = path.join(INPUT_DIR, 'download-manifest.json');
  try {
    const s = await fs.readFile(mf, 'utf8');
    return JSON.parse(s);
  } catch {
    return {};
  }
}

async function writeManifest(manifest) {
  const mf = path.join(INPUT_DIR, 'download-manifest.json');
  await fs.writeFile(mf, JSON.stringify(manifest, null, 2), 'utf8');
}

// Download video if remote. Filename must be milliseconds timestamp, avoid duplicate by manifest.
async function prepareInputVideo(urlOrPath) {
  await ensureDirs();
  if (!urlOrPath) throw new Error('缺少 url');

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
      console.log(`[1/6] 发现已下载视频: ${p}`);
      return p;
    }
  }

  const ts = Date.now();
  const fileName = `${ts}.mp4`; // 文件名仅毫秒时间戳
  const filePath = path.join(INPUT_DIR, fileName);
  console.log(`[1/6] 正在下载视频到: ${filePath}`);
  await $`curl -L --fail --retry 3 --retry-delay 1 -o ${filePath} ${urlOrPath}`;
  manifest[h] = fileName;
  await writeManifest(manifest);
  return filePath;
}

async function probeVideo(videoPath) {
  const r = await $`ffprobe -v quiet -print_format json -show_streams -show_format ${videoPath}`;
  const info = JSON.parse(r.stdout);
  const v = info.streams.find(s => s.codec_type === 'video') || {};
  const a = info.streams.find(s => s.codec_type === 'audio');
  return {
    width: v.width,
    height: v.height,
    pix_fmt: v.pix_fmt,
    codec: v.codec_name,
    color_primaries: v.color_primaries,
    color_transfer: v.color_transfer,
    color_space: v.color_space,
    fps: (() => {
      const rm = (v.r_frame_rate || '').split('/');
      const n = Number(rm[0] || 0), d = Number(rm[1] || 1);
      return d ? (n / d) : 0;
    })(),
    duration: Number(info.format?.duration || 0),
    hasAudio: !!a,
  };
}

async function extractFrames(videoPath, workDir, fps) {
  const framesDir = path.join(workDir, 'frames');
  await fs.emptyDir(framesDir);
  console.log(`[2/6] 提取视频帧 -> ${framesDir}`);
  // Extract frames without forcing CFR/VFR to avoid conflicts; timing is restored during rebuild
  const args = ['-y', '-i', videoPath, '-map', '0:v:0', path.join(framesDir, 'frame_%06d.png')];
  await $`ffmpeg ${args}`;
  return framesDir;
}

// Build a simple static mask at bottom-right if user doesn't provide; keep 18% width x 12% height
async function buildDefaultMask({ width, height }, workDir, maskOpt = {}) {
  const maskPath = path.join(workDir, 'mask.png');
  // Geometry config
  const { position, width_percent, height_percent, margin = 8, x: gx, y: gy, w: gw, h: gh } = maskOpt || {};

  let mw, mh, x, y;
  if (typeof gx === 'number' && typeof gy === 'number' && typeof gw === 'number' && typeof gh === 'number') {
    // Explicit geometry
    mw = Math.max(1, Math.round(gw));
    mh = Math.max(1, Math.round(gh));
    x = Math.min(width - 1, Math.max(0, Math.round(gx)));
    y = Math.min(height - 1, Math.max(0, Math.round(gy)));
  } else {
    // Percent-based with position presets
    const wp = Math.max(0.02, Math.min(0.9, width_percent ?? 0.18));
    const hp = Math.max(0.02, Math.min(0.9, height_percent ?? 0.12));
    mw = Math.max(16, Math.round(width * wp));
    mh = Math.max(12, Math.round(height * hp));
    const m = Math.max(0, Math.round(margin));
    switch ((position || 'bottom-right').toLowerCase()) {
      case 'top-left':
        x = m; y = m; break;
      case 'top-right':
        x = Math.max(0, width - mw - m); y = m; break;
      case 'bottom-left':
        x = m; y = Math.max(0, height - mh - m); break;
      case 'center':
        x = Math.max(0, Math.round((width - mw) / 2));
        y = Math.max(0, Math.round((height - mh) / 2));
        break;
      case 'bottom-right':
      default:
        x = Math.max(0, width - mw - m);
        y = Math.max(0, height - mh - m);
        break;
    }
  }
  // Create black image and paint white rectangle where watermark assumed
  // Using ImageMagick if available, else fallback to ffmpeg drawbox to generate mask
  try {
    // Prefer ImageMagick v7
    await $`magick -size ${width}x${height} xc:black -fill white -draw ${`rectangle ${x},${y} ${x+mw},${y+mh}`} ${maskPath}`;
    return maskPath;
  } catch {}
  try {
    await $`convert -size ${width}x${height} xc:black -fill white -draw ${`rectangle ${x},${y} ${x+mw},${y+mh}`} ${maskPath}`;
    return maskPath;
  } catch {
    await $`ffmpeg -y -f lavfi -i color=c=black:s=${width}x${height} -vf drawbox=${`${x}:${y}:${mw}:${mh}:white@1:fill`} -frames:v 1 ${maskPath}`;
    return maskPath;
  }
}

// Ensure Python venv with OpenCV installed
async function ensureCvEnv() {
  const venvDir = path.join(CACHE_DIR, 'venv');
  const pythonBin = process.platform === 'win32' ? path.join(venvDir, 'Scripts', 'python') : path.join(venvDir, 'bin', 'python3');
  const pipBin = process.platform === 'win32' ? path.join(venvDir, 'Scripts', 'pip') : path.join(venvDir, 'bin', 'pip');

  const venvExists = await fs.pathExists(pythonBin);
  if (!venvExists) {
    console.log('[3/6] 创建 Python 虚拟环境并安装模型... (首次耗时较长)');
    await $`python3 -m venv ${venvDir}`;
  }

  // Always ensure tooling is up-to-date for Python 3.12 compatibility
  await $`${pythonBin} -m pip install --upgrade pip wheel`;
  // Minimal deps for OpenCV inpainting
  await $`${pipBin} install --upgrade "setuptools<70" packaging`;
  await $`${pipBin} install opencv-python-headless pillow`;

  return { pythonBin };
}

// Create and run a small python script that applies OpenCV inpainting to each frame using a provided mask
async function runCvInpaint(framesDir, outDir, maskPath, autoDetect = null, inpaintRadius = 6, debug = false, dilatePx = 6, extraExpandPx = 0, extraRegions = []) {
  await fs.emptyDir(outDir);
  console.log(`[4/6] 使用 AI 去水印处理中 (OpenCV Inpainting)...`);
  const { pythonBin } = await ensureCvEnv();
  const scriptPath = path.join(CACHE_DIR, 'batch_inpaint.py');
  const script = `
import os, sys
import cv2
import numpy as np
from PIL import Image

frames_dir, out_dir, mask_path = sys.argv[1], sys.argv[2], sys.argv[3]
auto_mode = sys.argv[4] if len(sys.argv) > 4 else None
try:
    inpaint_radius = int(sys.argv[5]) if len(sys.argv) > 5 else 6
except:
    inpaint_radius = 6
dbg = (sys.argv[6] == '1') if len(sys.argv) > 6 else False
try:
    dilate_px = int(sys.argv[7]) if len(sys.argv) > 7 else 6
except:
    dilate_px = 6
try:
    extra_expand_px = int(sys.argv[8]) if len(sys.argv) > 8 else 0
except:
    extra_expand_px = 0
# extra regions JSON passed at argv[9] (may be empty string)
import json
extra_regions = []
if len(sys.argv) > 9 and sys.argv[9]:
    try:
        extra_regions = json.loads(sys.argv[9])
    except Exception:
        extra_regions = []
os.makedirs(out_dir, exist_ok=True)

def build_auto_mask(img, mode):
    h, w = img.shape[:2]
    # Search region based on mode
    rx0, ry0, rx1, ry1 = 0, 0, w, h
    if mode == 'top-left':
        rx1, ry1 = int(w*0.35), int(h*0.20)
    elif mode == 'top-right':
        rx0, ry1 = int(w*0.65), int(h*0.20)
    elif mode == 'bottom-left':
        rx1, ry0 = int(w*0.35), int(h*0.80)
    elif mode == 'bottom-right':
        rx0, ry0 = int(w*0.65), int(h*0.80)

    roi = img[ry0:ry1, rx0:rx1]
    if roi.size == 0:
        return np.zeros((h, w), dtype=np.uint8)
    # Heuristic 1: bright + low saturation
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    H,S,V = cv2.split(hsv)
    bright = cv2.inRange(V, 180, 255)
    low_sat = cv2.inRange(S, 0, 90)
    cand1 = cv2.bitwise_and(bright, low_sat)

    # Heuristic 2: morphological top-hat on gray (light text on varying background)
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    se = cv2.getStructuringElement(cv2.MORPH_RECT, (9,9))
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, se)
    _, cand2 = cv2.threshold(tophat, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)

    # Heuristic 3: edges
    edges = cv2.Canny(gray, 60, 160)

    cand = cv2.bitwise_or(cand1, cand2)
    cand = cv2.bitwise_or(cand, edges)
    # Morph to connect strokes
    k = cv2.getStructuringElement(cv2.MORPH_RECT, (5,3))
    cand = cv2.morphologyEx(cand, cv2.MORPH_CLOSE, k, iterations=2)
    # Find largest plausible component near edges
    contours, _ = cv2.findContours(cand, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    mask = np.zeros((h, w), dtype=np.uint8)
    # Use multiple plausible components instead of single best
    for c in contours:
        x,y,wc,hc = cv2.boundingRect(c)
        area = wc*hc
        ar = wc/float(hc+1e-6)
        # constraints: text-like or small banner near corner, exclude tiny noise
        if 50 < area < 0.5*(rx1-rx0)*(ry1-ry0) and 0.5 < ar < 8.0:
            x0 = rx0 + max(0, x - extra_expand_px)
            y0 = ry0 + max(0, y - extra_expand_px)
            x1 = rx0 + min(rx1-rx0, x + wc + extra_expand_px)
            y1 = ry0 + min(ry1-ry0, y + hc + extra_expand_px)
            mask[y0:y1, x0:x1] = 255
    # Additional MSER text detection
    try:
        mser = cv2.MSER_create(_delta=5, _min_area=30, _max_area=5000)
        regions, _ = mser.detectRegions(gray)
        for r in regions:
            x,y,wc,hc = cv2.boundingRect(r.reshape(-1,1,2))
            if wc*hc > 50:
                x0 = rx0 + max(0, x - extra_expand_px)
                y0 = ry0 + max(0, y - extra_expand_px)
                x1 = rx0 + min(rx1-rx0, x + wc + extra_expand_px)
                y1 = ry0 + min(ry1-ry0, y + hc + extra_expand_px)
                mask[y0:y1, x0:x1] = 255
    except Exception:
        pass
    if mask.sum() > 0:
        px = max(2, dilate_px)
        mask = cv2.dilate(mask, np.ones((px,px), np.uint8), iterations=1)
    return mask

def build_full_text_mask(img):
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Top-hat to highlight light text, plus MSER and edges
    se = cv2.getStructuringElement(cv2.MORPH_RECT, (11,11))
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, se)
    _, th = cv2.threshold(tophat, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)
    edges = cv2.Canny(gray, 60, 160)
    cand = cv2.bitwise_or(th, edges)
    # MSER union
    try:
        mser = cv2.MSER_create(_delta=5, _min_area=50, _max_area=8000)
        regions, _ = mser.detectRegions(gray)
        mser_mask = np.zeros((h, w), dtype=np.uint8)
        for r in regions:
            x,y,ww,hh = cv2.boundingRect(r.reshape(-1,1,2))
            if ww*hh > 80:
                mser_mask[y:y+hh, x:x+ww] = 255
        cand = cv2.bitwise_or(cand, mser_mask)
    except Exception:
        pass
    cand = cv2.morphologyEx(cand, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (5,3)), iterations=2)
    # keep near frame corners and horizontal bands to avoid overkill
    mask = np.zeros((h, w), dtype=np.uint8)
    # corners bands (top 20%, bottom 20%) and a central thin band where semi-transparent watermark often sits
    bands = [(0, int(0.22*h)), (int(0.78*h), h), (int(0.42*h), int(0.58*h))]
    for y0,y1 in bands:
        band = np.zeros_like(mask)
        band[y0:y1, :] = cand[y0:y1, :]
        contours, _ = cv2.findContours(band, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in contours:
            x,y,ww,hh = cv2.boundingRect(c)
            area = ww*hh
            if area > 100:
                x0 = max(0, x - extra_expand_px)
                y0 = max(0, y - extra_expand_px)
                x1 = min(w, x + ww + extra_expand_px)
                y1 = min(h, y + hh + extra_expand_px)
                mask[y0:y1, x0:x1] = 255
    if mask.sum() > 0:
        k = max(2, dilate_px)
        mask = cv2.dilate(mask, np.ones((k,k), np.uint8), iterations=1)
    return mask

# Prepare base (manual) mask if provided
manual_mask_img = None
if mask_path and os.path.exists(mask_path):
    try:
        manual_mask_img = Image.open(mask_path).convert('L')
    except:
        manual_mask_img = None

files = sorted([f for f in os.listdir(frames_dir) if f.lower().endswith('.png')])

# Build a stable union mask from sampled frames when autodetect enabled
global_mask = None
if auto_mode and files:
    # sample up to 20 frames evenly spaced
    sample_count = min(20, len(files))
    indices = [int(i * (len(files)-1) / max(1, sample_count-1)) for i in range(sample_count)]
    for idx in indices:
        frame_path = os.path.join(frames_dir, files[idx])
        img = cv2.imread(frame_path, cv2.IMREAD_COLOR)
        if img is None:
            continue
        if auto_mode == 'full-text':
            m = build_full_text_mask(img)
        else:
            m = build_auto_mask(img, auto_mode)
        if global_mask is None:
            global_mask = m
        else:
            global_mask = cv2.bitwise_or(global_mask, m)
    # Dilate union to cover halos
    if global_mask is not None:
        k = max(2, dilate_px)
        global_mask = cv2.dilate(global_mask, np.ones((k,k), np.uint8), iterations=1)
        if dbg:
            cv2.imwrite(os.path.join(out_dir, 'mask_union.png'), global_mask)

for i, f in enumerate(files, 1):
    frame_path = os.path.join(frames_dir, f)
    img = cv2.imread(frame_path, cv2.IMREAD_COLOR)
    if img is None:
        continue
    h, w = img.shape[:2]
    # assemble final mask: union(manual regions, manual image mask, global)
    mask = np.zeros((h, w), dtype=np.uint8)
    # union manual regions first
    if extra_regions:
        for reg in extra_regions:
            try:
                if 'x' in reg and 'y' in reg and 'w' in reg and 'h' in reg:
                    x0 = max(0, int(reg['x']))
                    y0 = max(0, int(reg['y']))
                    x1 = min(w, x0 + int(reg['w']))
                    y1 = min(h, y0 + int(reg['h']))
                    mask[y0:y1, x0:x1] = 255
            except Exception:
                pass
    if manual_mask_img is not None:
        mm = manual_mask_img.resize((w, h), Image.NEAREST)
        mask = cv2.bitwise_or(mask, np.array(mm))
    if global_mask is not None:
        gm = global_mask
        if (gm.shape[1], gm.shape[0]) != (w, h):
            gm = cv2.resize(gm, (w, h), interpolation=cv2.INTER_NEAREST)
        mask = cv2.bitwise_or(mask, gm)
    if mask.sum() == 0 and auto_mode:
        # fallback detect per-frame if union failed
        mask = build_auto_mask(img, auto_mode)
    _, mask_bin = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
    if dilate_px > 0:
        k = max(1, dilate_px)
        mask_bin = cv2.dilate(mask_bin, np.ones((k,k), np.uint8), iterations=1)
    if dbg and i == 1:
        # overlay preview for first frame
        overlay = img.copy()
        cnts, _ = cv2.findContours(mask_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(overlay, cnts, -1, (0,0,255), 2)
        cv2.imwrite(os.path.join(out_dir, 'mask_preview_overlay.png'), overlay)
    # Two-pass inpainting for better fill
    res1 = cv2.inpaint(img, mask_bin, max(1, min(16, inpaint_radius)), cv2.INPAINT_TELEA)
    res2 = cv2.inpaint(res1, mask_bin, max(1, min(18, inpaint_radius+2)), cv2.INPAINT_NS)
    cv2.imwrite(os.path.join(out_dir, f), res2)
  `;
  await fs.writeFile(scriptPath, script, 'utf8');
  const autoArg = autoDetect ? String(autoDetect) : '';
  const extraRegionsJson = JSON.stringify(extraRegions || []);
  await $`${pythonBin} ${scriptPath} ${framesDir} ${outDir} ${maskPath} ${autoArg} ${inpaintRadius} ${debug ? '1' : '0'} ${dilatePx} ${extraExpandPx} ${extraRegionsJson}`;
}

function pickEncoder(codec) {
  // Try to keep the same codec if possible; map common ones to encoders
  switch (codec) {
    case 'h264':
      return { encoder: 'libx264', extra: ['-preset', 'medium', '-crf', '18'] };
    case 'hevc':
    case 'h265':
      return { encoder: 'libx265', extra: ['-preset', 'medium', '-crf', '20'] };
    case 'vp9':
      return { encoder: 'libvpx-vp9', extra: ['-b:v', '0', '-crf', '30'] };
    default:
      return { encoder: 'libx264', extra: ['-preset', 'medium', '-crf', '18'] };
  }
}

async function rebuildVideo(originalPath, inpaintedDir, meta) {
  const videoBase = path.basename(originalPath, path.extname(originalPath));
  const outPath = path.join(OUTPUT_DIR, `${videoBase}_ai_rmwm.mp4`);
  console.log(`[5/6] 重建视频，保持原始分辨率与帧率...`);

  const { encoder, extra } = pickEncoder(meta.codec);

  // Build ffmpeg args
  const args = ['-y'];
  if (meta.fps && meta.fps > 0) {
    args.push('-r', String(meta.fps));
  }
  args.push('-i', path.join(inpaintedDir, 'frame_%06d.png'));
  // bring original for audio
  args.push('-i', originalPath);
  args.push('-map', '0:v:0', '-map', '1:a?');
  args.push('-c:v', encoder);
  if (meta.pix_fmt) { args.push('-pix_fmt', meta.pix_fmt); }
  if (meta.color_primaries) { args.push('-color_primaries', meta.color_primaries); }
  if (meta.color_transfer) { args.push('-color_trc', meta.color_transfer); }
  if (meta.color_space) { args.push('-colorspace', meta.color_space); }
  args.push(...extra);
  args.push('-c:a', 'copy');
  args.push(outPath);

  await $`ffmpeg ${args}`;
  return outPath;
}

async function processVideo(url, options = {}) {
  console.log('\n开始执行 ai-remove-watermark 任务...');
  const inputPath = await prepareInputVideo(url);
  const meta = await probeVideo(inputPath);
  console.log(`[信息] 分辨率: ${meta.width}x${meta.height}, fps: ${meta.fps.toFixed ? meta.fps.toFixed(3) : meta.fps}, 编码: ${meta.codec}, 像素格式: ${meta.pix_fmt}`);

  const workDir = path.join(CACHE_DIR, path.basename(inputPath, path.extname(inputPath)));
  await fs.mkdir(workDir, { recursive: true });

  const framesDir = await extractFrames(inputPath, workDir, meta.fps);
  const maskPath = await buildDefaultMask({ width: meta.width, height: meta.height }, workDir, options.mask);
  const inpaintedDir = path.join(workDir, 'inpainted');
  const autoDetect = options.mask?.autodetect ? String(options.mask.autodetect) : null;
  const inpaintRadius = options.mask?.inpaint_radius ? Number(options.mask.inpaint_radius) : 4;
  const dilatePx = options.mask?.dilate_px ? Number(options.mask.dilate_px) : 12;
  const extraExpandPx = options.mask?.extra_expand_px ? Number(options.mask.extra_expand_px) : 4;
  const extraRegions = Array.isArray(options.mask?.extra_regions) ? options.mask.extra_regions : [];
  await runCvInpaint(framesDir, inpaintedDir, maskPath, autoDetect, inpaintRadius, !!options.debug, dilatePx, extraExpandPx, extraRegions);

  const outVideo = await rebuildVideo(inputPath, inpaintedDir, meta);

  console.log(`\n✅ ai-remove-watermark 完成`);
  console.log(`📁 输入视频: ${inputPath}`);
  console.log(`🎬 输出视频: ${outVideo}`);
  return outVideo;
}

export default async function runAiRemoveWatermark(configOrUrl) {
  let url = '';
  let options = {};
  if (typeof configOrUrl === 'string') {
    url = configOrUrl;
  } else if (configOrUrl && typeof configOrUrl.url === 'string') {
    url = configOrUrl.url;
    // pass through mask options if any
    if (configOrUrl.mask && typeof configOrUrl.mask === 'object') {
      options.mask = configOrUrl.mask;
    }
  }
  if (!url) throw new Error('未提供 URL，且 config.json 中缺少 ai-remove-watermark.url');
  return await processVideo(url, options);
}
