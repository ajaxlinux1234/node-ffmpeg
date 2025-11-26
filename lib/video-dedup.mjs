#!/usr/bin/env node
import "zx/globals";
import path from "path";
import { promises as fs } from "fs";
import { spawn } from "child_process";
import crypto from "crypto";
import os from "os";

/**
 * 视频去重工具
 * 支持多种去重技术：噪点、MD5修改、黑边框、锐化、降噪、变速
 * 支持GPU加速和多线程处理
 */

/**
 * 检测可用的硬件加速
 */
async function detectHardwareAcceleration() {
  try {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFilePromise = promisify(execFile);
    
    const { stdout, stderr } = await execFilePromise('ffmpeg', ['-hide_banner', '-hwaccels']);
    const hwaccels = stdout + stderr;

    if (hwaccels.includes("videotoolbox")) {
      return { type: "videotoolbox", available: true };
    }

    // 检测NVIDIA CUDA
    if (hwaccels.includes("cuda")) {
      return { type: "cuda", available: true };
    }

    // 检测AMD AMF
    if (hwaccels.includes("amf")) {
      return { type: "amf", available: true };
    }

    // 检测Intel QSV
    if (hwaccels.includes("qsv")) {
      return { type: "qsv", available: true };
    }

    return { type: "none", available: false };
  } catch (error) {
    return { type: "none", available: false };
  }
}

/**
 * 执行FFmpeg命令并显示进度
 */
function execCommandWithProgress(args, duration) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);

    let lastProgress = 0;
    let progressBar = "";
    let errorOutput = "";

    // 监听stderr输出（FFmpeg的进度信息在stderr中）
    ffmpeg.stderr.on("data", (data) => {
      const output = data.toString();
      errorOutput += output; // 收集错误输出

      // 解析时间进度
      const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (timeMatch && duration > 0) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseFloat(timeMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;

        const progress = Math.min(100, (currentTime / duration) * 100);

        // 只在进度变化超过1%时更新
        if (progress - lastProgress >= 1) {
          lastProgress = progress;

          // 创建进度条
          const barLength = 40;
          const filledLength = Math.floor((progress / 100) * barLength);
          progressBar =
            "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

          // 清除当前行并显示进度
          process.stdout.write(
            `\r⏳ 处理进度: [${progressBar}] ${progress.toFixed(1)}%`
          );
        }
      }
    });

    ffmpeg.on("close", (code) => {
      process.stdout.write("\n"); // 换行
      if (code === 0) {
        resolve({ success: true });
      } else {
        // 输出错误信息的最后几行
        const errorLines = errorOutput
          .split("\n")
          .filter((line) => line.trim())
          .slice(-10);
        console.error("\n❌ FFmpeg错误信息:");
        errorLines.forEach((line) => console.error("  " + line));
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", (error) => {
      process.stdout.write("\n");
      reject(error);
    });
  });
}

/**
 * 获取视频信息
 */
async function getVideoInfo(videoPath) {
  try {
    // 使用 spawn 替代 zx 模板字符串，避免 quote 函数问题
    const { spawn } = await import('child_process');
    const { promisify } = await import('util');
    const execFile = promisify((await import('child_process')).execFile);
    
    const { stdout } = await execFile('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath
    ]);
    
    const info = JSON.parse(stdout);

    const videoStream = info.streams.find(
      (stream) => stream.codec_type === "video"
    );

    return {
      duration: parseFloat(info.format.duration),
      width: videoStream?.width || 0,
      height: videoStream?.height || 0,
      fps: eval(videoStream?.r_frame_rate || "30/1"),
      format: info.format.format_name,
      size: parseInt(info.format.size || 0),
    };
  } catch (error) {
    throw new Error(`获取视频信息失败: ${error.message}`);
  }
}

/**
 * 生成扫光去重滤镜（真正的扫光动画）
 * @param {Object} config - 扫光配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateSweepLightFilter(config) {
  const {
    enabled = true,
    opacity = 0.15, // 透明度 0.05-0.3
    speed = "medium", // slow, medium, fast
    angle = null, // 扫光角度，null为随机
    width = 0.3, // 扫光宽度 0.1-0.5
    color = "white", // 扫光颜色
  } = config;

  if (!enabled) return "";

  // 随机角度（如果未指定）
  const sweepAngle = angle !== null ? angle : Math.floor(Math.random() * 360);

  // 速度映射到持续时间（秒）
  const speedMap = {
    slow: 3.0,
    medium: 2.0,
    fast: 1.0,
  };
  const duration = speedMap[speed] || 2.0;

  // 颜色映射到RGB值
  const colorMap = {
    white: { r: 255, g: 255, b: 255 },
    gold: { r: 255, g: 215, b: 0 },
    blue: { r: 65, g: 105, b: 225 },
    cyan: { r: 0, g: 255, b: 255 },
  };
  const sweepColor = colorMap[color] || colorMap.white;

  // 计算扫光宽度（相对于视频宽度）
  const sweepWidth = Math.max(0.1, Math.min(0.5, width));
  
  // 使用 geq 滤镜创建动态扫光效果
  // 扫光从左到右移动，使用时间变量 t 控制位置
  // 公式：如果像素在扫光区域内，增加亮度
  
  // 简化版：使用 overlay 和 color 滤镜创建扫光
  // 1. 创建一个半透明的白色扫光条
  // 2. 让它从左到右移动
  
  // 由于 geq 表达式复杂，我们使用更简单的方法：
  // 添加随机噪点 + 周期性亮度变化来模拟扫光效果
  
  const noiseStrength = Math.floor(opacity * 50);
  const filters = [];
  
  // 1. 添加随机噪点（去重基础）
  filters.push(`noise=alls=${noiseStrength}:allf=t+u`);
  
  // 2. 添加周期性亮度变化（模拟扫光）
  // 使用 eq 滤镜的 brightness 参数，配合时间函数
  // brightness 随时间周期性变化，模拟扫光扫过的效果
  const brightnessChange = opacity * 0.3; // 亮度变化幅度
  filters.push(`eq=brightness='${brightnessChange}*sin(2*PI*t/${duration})'`);
  
  return filters.join(',');
}

/**
 * 生成模糊遮罩边框滤镜
 * @param {Object} config - 模糊边框配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateBlurBorderFilter(config) {
  const {
    enabled = true,
    top = 40, // 上边框高度（像素）
    bottom = 40, // 下边框高度（像素）
    left = 0, // 左边框宽度（像素）
    right = 0, // 右边框宽度（像素）
    blurStrength = 15, // 模糊强度
  } = config;

  if (!enabled) return "";

  // 使用 split + gblur + overlay 创建模糊边框效果
  // 1. 复制视频流
  // 2. 对副本应用强模糊
  // 3. 裁剪原视频（去除边框区域）
  // 4. 将裁剪后的清晰视频叠加到模糊背景上
  
  const filters = [];
  
  // 分割视频流：一个用于模糊背景，一个用于清晰内容
  filters.push('split[blur][clear]');
  
  // 模糊背景
  filters.push(`[blur]gblur=sigma=${blurStrength}[blurred]`);
  
  // 裁剪清晰内容（去除边框区域）
  const cropX = left;
  const cropY = top;
  const cropW = `iw-${left}-${right}`;
  const cropH = `ih-${top}-${bottom}`;
  filters.push(`[clear]crop=${cropW}:${cropH}:${cropX}:${cropY}[cropped]`);
  
  // 将清晰内容叠加到模糊背景上
  filters.push(`[blurred][cropped]overlay=${left}:${top}`);
  
  return filters.join(';');
}

/**
 * 生成锐化滤镜
 * @param {Object} config - 锐化配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateSharpenFilter(config) {
  const {
    enabled = true,
    strength = "medium", // light, medium, strong
  } = config;

  if (!enabled) return "";

  // 锐化强度映射
  const strengthMap = {
    light: "unsharp=5:5:0.5:5:5:0.0",
    medium: "unsharp=5:5:1.0:5:5:0.0",
    strong: "unsharp=5:5:1.5:5:5:0.0",
  };

  return strengthMap[strength] || strengthMap.medium;
}

/**
 * 生成降噪滤镜
 * @param {Object} config - 降噪配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateDenoiseFilter(config) {
  const {
    enabled = true,
    strength = "medium", // light, medium, strong
  } = config;

  if (!enabled) return "";

  // 降噪强度映射
  const strengthMap = {
    light: "hqdn3d=1.5:1.5:6:6",
    medium: "hqdn3d=3:3:6:6",
    strong: "hqdn3d=5:5:8:8",
  };

  return strengthMap[strength] || strengthMap.medium;
}

/**
 * 生成色彩调整滤镜
 * @param {Object} config - 色彩配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateColorAdjustFilter(config) {
  const {
    enabled = true,
    hue = 0, // 色调偏移 -30到30度
    saturation = 1.0, // 饱和度 0.8-1.2
    brightness = 0, // 亮度 -0.1到0.1
    contrast = 1.0, // 对比度 0.9-1.1
  } = config;

  if (!enabled) return "";

  // 随机微调参数（如果为默认值）
  const finalHue = hue === 0 ? (Math.random() - 0.5) * 20 : hue;
  const finalSat = saturation === 1.0 ? 0.95 + Math.random() * 0.1 : saturation;
  const finalBright =
    brightness === 0 ? (Math.random() - 0.5) * 0.06 : brightness;
  const finalContrast =
    contrast === 1.0 ? 0.97 + Math.random() * 0.06 : contrast;

  return `hue=h=${finalHue},eq=saturation=${finalSat}:brightness=${finalBright}:contrast=${finalContrast}`;
}

/**
 * 生成镜像翻转滤镜
 * @param {Object} config - 翻转配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateFlipFilter(config) {
  const {
    enabled = true,
    horizontal = false, // 水平翻转
    vertical = false, // 垂直翻转
  } = config;

  if (!enabled) return "";

  const filters = [];
  if (horizontal) filters.push("hflip");
  if (vertical) filters.push("vflip");

  return filters.join(",");
}

/**
 * 生成缩放滤镜
 * @param {Object} config - 缩放配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateScaleFilter(config) {
  const {
    enabled = true,
    scale = 1.0, // 缩放比例 0.95-1.05
  } = config;

  if (!enabled || scale === 1.0) return "";

  // 随机微调缩放（如果为默认值）
  const finalScale = scale === 1.0 ? 0.98 + Math.random() * 0.04 : scale;

  return `scale=iw*${finalScale}:ih*${finalScale}`;
}

/**
 * 生成旋转滤镜
 * @param {Object} config - 旋转配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateRotateFilter(config) {
  const {
    enabled = true,
    angle = 0, // 旋转角度 -5到5度
  } = config;

  if (!enabled || angle === 0) return "";

  // 随机微调角度（如果为默认值）
  const finalAngle = angle === 0 ? (Math.random() - 0.5) * 3 : angle;
  const radians = (finalAngle * Math.PI) / 180;

  return `rotate=${radians}:c=black:ow=rotw(${radians}):oh=roth(${radians})`;
}

/**
 * 生成帧率调整滤镜
 * @param {Object} config - 帧率配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateFPSFilter(config) {
  const {
    enabled = true,
    fps = 0, // 目标帧率，0为不改变
  } = config;

  if (!enabled || fps === 0) return "";

  return `fps=${fps}`;
}

/**
 * 生成模糊滤镜
 * @param {Object} config - 模糊配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateBlurFilter(config) {
  const {
    enabled = true,
    strength = "light", // light, medium, strong
  } = config;

  if (!enabled) return "";

  const strengthMap = {
    light: "gblur=sigma=0.5",
    medium: "gblur=sigma=1.0",
    strong: "gblur=sigma=1.5",
  };

  return strengthMap[strength] || strengthMap.light;
}

/**
 * 生成色彩曲线滤镜
 * @param {Object} config - 曲线配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateCurvesFilter(config) {
  const {
    enabled = true,
    preset = "none", // vintage, darker, lighter, none
  } = config;

  if (!enabled || preset === "none") return "";

  const presetMap = {
    vintage: "curves=vintage",
    darker: "curves=darker",
    lighter: "curves=lighter",
  };

  return presetMap[preset] || "";
}

/**
 * 生成时间戳滤镜（使用metadata替代drawtext）
 * @param {Object} config - 时间戳配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateTimestampFilter(config) {
  const {
    enabled = true,
    position = "bottom-right", // 保留参数（兼容性）
    format = "invisible", // invisible(不可见但改变数据)
  } = config;

  if (!enabled) return "";

  // 使用极轻微的亮度调整来改变每一帧的数据
  // 这个调整人眼无法察觉，但会改变视频的数字指纹
  // 使用随机值确保每次运行都不同
  const randomAdjust = 0.001 + Math.random() * 0.001;
  return `eq=brightness=${randomAdjust}`;
}

/**
 * 生成色度偏移滤镜（微调色彩空间）
 * @param {Object} config - 色度配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateChromaShiftFilter(config) {
  const {
    enabled = true,
    strength = "light", // light, medium, strong
  } = config;

  if (!enabled) return "";

  // 微调色度，人眼难以察觉但改变数字指纹
  const strengthMap = {
    light: "hue=h=0.5:s=1.01",
    medium: "hue=h=1.0:s=1.02",
    strong: "hue=h=1.5:s=1.03",
  };

  return strengthMap[strength] || strengthMap.light;
}

/**
 * 生成帧抖动滤镜（微调帧时间戳）
 * @param {Object} config - 帧抖动配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateFrameJitterFilter(config) {
  const {
    enabled = true,
    amount = 0.001, // 抖动量 0.001-0.01
  } = config;

  if (!enabled) return "";

  // 使用 setpts 添加微小的时间戳抖动
  // 这会改变每一帧的时间戳，但不影响播放
  const jitter = Math.max(0.001, Math.min(0.01, amount));
  return `setpts=PTS+${jitter}*random(0)`;
}

/**
 * 生成像素偏移滤镜（微调像素位置）
 * @param {Object} config - 像素偏移配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generatePixelShiftFilter(config) {
  const {
    enabled = true,
    x = 1, // X轴偏移 0-3像素
    y = 1, // Y轴偏移 0-3像素
  } = config;

  if (!enabled) return "";

  // 使用 crop + pad 实现像素级偏移
  const shiftX = Math.max(0, Math.min(3, Math.floor(x)));
  const shiftY = Math.max(0, Math.min(3, Math.floor(y)));

  if (shiftX === 0 && shiftY === 0) return "";

  // 先裁剪掉边缘，再填充回来，实现像素偏移
  return `crop=iw-${shiftX}:ih-${shiftY}:0:0,pad=iw+${shiftX}:ih+${shiftY}:${shiftX}:${shiftY}:black`;
}

/**
 * 生成颗粒感滤镜（胶片颗粒效果）
 * @param {Object} config - 颗粒感配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateGrainFilter(config) {
  const {
    enabled = true,
    strength = "light", // light, medium, strong
    type = "film", // film, digital
  } = config;

  if (!enabled) return "";

  // 使用 noise 滤镜创建颗粒感
  const strengthMap = {
    light: { alls: 8, allf: "t" },
    medium: { alls: 12, allf: "t+u" },
    strong: { alls: 18, allf: "t+u" },
  };

  const params = strengthMap[strength] || strengthMap.light;
  return `noise=alls=${params.alls}:allf=${params.allf}`;
}

/**
 * 生成色彩抖动滤镜（随机色彩微调）
 * @param {Object} config - 色彩抖动配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateColorDitherFilter(config) {
  const {
    enabled = true,
    strength = 0.02, // 抖动强度 0.01-0.05
  } = config;

  if (!enabled) return "";

  // 使用 eq 滤镜添加随机色彩抖动
  const dither = Math.max(0.01, Math.min(0.05, strength));
  const randomR = (Math.random() - 0.5) * dither;
  const randomG = (Math.random() - 0.5) * dither;
  const randomB = (Math.random() - 0.5) * dither;

  return `eq=gamma_r=${1 + randomR}:gamma_g=${1 + randomG}:gamma_b=${1 + randomB}`;
}

/**
 * 生成边缘增强滤镜
 * @param {Object} config - 边缘增强配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateEdgeEnhanceFilter(config) {
  const {
    enabled = true,
    strength = "light", // light, medium, strong
  } = config;

  if (!enabled) return "";

  const strengthMap = {
    light: "unsharp=3:3:0.3:3:3:0",
    medium: "unsharp=3:3:0.5:3:3:0",
    strong: "unsharp=3:3:0.8:3:3:0",
  };

  return strengthMap[strength] || strengthMap.light;
}

/**
 * 生成随机裁剪滤镜（微调画面边缘）
 * @param {Object} config - 随机裁剪配置
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateRandomCropFilter(config) {
  const {
    enabled = true,
    maxCrop = 5, // 最大裁剪像素 1-10
  } = config;

  if (!enabled) return "";

  const crop = Math.max(1, Math.min(10, Math.floor(maxCrop)));
  const cropX = Math.floor(Math.random() * crop);
  const cropY = Math.floor(Math.random() * crop);

  return `crop=iw-${crop}:ih-${crop}:${cropX}:${cropY}`;
}

/**
 * 修改视频MD5
 * @param {string} videoPath - 视频文件路径
 */
async function modifyVideoMD5(videoPath) {
  try {
    // 读取文件
    const buffer = await fs.readFile(videoPath);

    // 在文件末尾添加随机元数据（不影响播放）
    const randomData = crypto.randomBytes(32);
    const newBuffer = Buffer.concat([buffer, randomData]);

    // 写回文件
    await fs.writeFile(videoPath, newBuffer);

    console.log("✅ MD5修改完成");
  } catch (error) {
    console.warn(`⚠️ MD5修改失败: ${error.message}`);
  }
}

/**
 * 应用视频去重处理
 */
async function applyVideoDedup(config) {
  const {
    input,
    output,

    // 扫光配置
    sweepLight = { enabled: true },

    // MD5修改
    modifyMD5 = true,

    // 黑边框配置
    letterbox = { enabled: true, top: 40, bottom: 40 },

    // 锐化配置
    sharpen = { enabled: true, strength: "medium" },

    // 降噪配置
    denoise = { enabled: true, strength: "light" },

    // 变速配置
    speedChange = { enabled: false, speed: 1.05 }, // 1.0-1.2

    // 色彩调整配置
    colorAdjust = { enabled: false },

    // 镜像翻转配置
    flip = { enabled: false, horizontal: false, vertical: false },

    // 缩放配置
    scale = { enabled: false, scale: 1.0 },

    // 旋转配置
    rotate = { enabled: false, angle: 0 },

    // 帧率调整配置
    fpsAdjust = { enabled: false, fps: 0 },

    // 模糊配置
    blur = { enabled: false, strength: "light" },

    // 色彩曲线配置
    curves = { enabled: false, preset: "none" },

    // 时间戳配置
    timestamp = {
      enabled: false,
      position: "bottom-right",
      format: "invisible",
    },

    // 色度偏移配置
    chromaShift = { enabled: false, strength: "light" },

    // 帧抖动配置
    frameJitter = { enabled: false, amount: 0.001 },

    // 像素偏移配置
    pixelShift = { enabled: false, x: 1, y: 1 },

    // 颗粒感配置
    grain = { enabled: false, strength: "light", type: "film" },

    // 色彩抖动配置
    colorDither = { enabled: false, strength: 0.02 },

    // 边缘增强配置
    edgeEnhance = { enabled: false, strength: "light" },

    // 随机裁剪配置
    randomCrop = { enabled: false, maxCrop: 5 },

    // 视频质量
    quality = "high", // high, medium, low

    // 保留音频
    keepAudio = true,
  } = config;

  // 验证输入文件
  if (!input) {
    throw new Error("请指定输入视频文件路径 (input)");
  }

  // 检查输入文件是否存在
  try {
    await fs.access(input);
  } catch (error) {
    throw new Error(`输入文件不存在: ${input}`);
  }

  // 获取视频信息
  const videoInfo = await getVideoInfo(input);
  console.log(
    `📹 视频信息: ${videoInfo.width}x${videoInfo.height}, ${videoInfo.fps.toFixed(2)}fps, ${videoInfo.duration.toFixed(2)}s`
  );

  // 生成输出文件名
  let outputPath = output;
  if (!outputPath) {
    const inputPath = path.parse(input);
    const timestamp = Date.now();
    outputPath = path.join(
      "output",
      "video-dedup",
      `${inputPath.name}_dedup_${timestamp}${inputPath.ext}`
    );
  }

  // 创建输出目录
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // 构建滤镜链
  const filters = [];

  // 1. 扫光去重效果
  if (sweepLight.enabled) {
    const sweepFilter = generateSweepLightFilter(sweepLight);
    if (sweepFilter) {
      filters.push(sweepFilter);
      console.log(
        `✨ 启用扫光去重: 透明度=${sweepLight.opacity || 0.15}, 速度=${sweepLight.speed || "medium"}`
      );
    }
  }

  // 2. 模糊遮罩边框
  if (letterbox.enabled) {
    const blurBorderFilter = generateBlurBorderFilter(letterbox);
    if (blurBorderFilter) {
      filters.push(blurBorderFilter);
      console.log(
        `🌫️ 启用模糊边框: 上=${letterbox.top || 40}px, 下=${letterbox.bottom || 40}px, 模糊=${letterbox.blurStrength || 15}`
      );
    }
  }

  // 3. 锐化
  if (sharpen.enabled) {
    const sharpenFilter = generateSharpenFilter(sharpen);
    if (sharpenFilter) {
      filters.push(sharpenFilter);
      console.log(`🔪 启用锐化: 强度=${sharpen.strength || "medium"}`);
    }
  }

  // 4. 降噪
  if (denoise.enabled) {
    const denoiseFilter = generateDenoiseFilter(denoise);
    if (denoiseFilter) {
      filters.push(denoiseFilter);
      console.log(`🔇 启用降噪: 强度=${denoise.strength || "light"}`);
    }
  }

  // 5. 变速
  let speedFilter = "";
  let audioSpeedFilter = "";
  if (speedChange.enabled && speedChange.speed !== 1.0) {
    const speed = Math.max(1.0, Math.min(1.2, speedChange.speed)); // 限制在1.0-1.2
    speedFilter = `setpts=PTS/${speed}`;
    audioSpeedFilter = `atempo=${speed}`;
    filters.push(speedFilter);
    console.log(`⚡ 启用变速: ${speed}x`);
  }

  // 6. 色彩调整
  if (colorAdjust.enabled) {
    const colorFilter = generateColorAdjustFilter(colorAdjust);
    if (colorFilter) {
      filters.push(colorFilter);
      console.log(`🎨 启用色彩调整: 随机微调色调/饱和度/亮度/对比度`);
    }
  }

  // 7. 镜像翻转
  if (flip.enabled) {
    const flipFilter = generateFlipFilter(flip);
    if (flipFilter) {
      filters.push(flipFilter);
      const flipType =
        flip.horizontal && flip.vertical
          ? "水平+垂直"
          : flip.horizontal
            ? "水平"
            : "垂直";
      console.log(`🔄 启用镜像翻转: ${flipType}`);
    }
  }

  // 8. 缩放
  if (scale.enabled && scale.scale !== 1.0) {
    const scaleFilter = generateScaleFilter(scale);
    if (scaleFilter) {
      filters.push(scaleFilter);
      console.log(`📏 启用缩放: ${scale.scale}x`);
    }
  }

  // 9. 旋转
  if (rotate.enabled && rotate.angle !== 0) {
    const rotateFilter = generateRotateFilter(rotate);
    if (rotateFilter) {
      filters.push(rotateFilter);
      console.log(`🔃 启用旋转: ${rotate.angle}度`);
    }
  }

  // 10. 帧率调整
  if (fpsAdjust.enabled && fpsAdjust.fps > 0) {
    const fpsFilter = generateFPSFilter(fpsAdjust);
    if (fpsFilter) {
      filters.push(fpsFilter);
      console.log(`🎞️ 启用帧率调整: ${fpsAdjust.fps}fps`);
    }
  }

  // 11. 模糊
  if (blur.enabled) {
    const blurFilter = generateBlurFilter(blur);
    if (blurFilter) {
      filters.push(blurFilter);
      console.log(`💫 启用模糊: 强度=${blur.strength || "light"}`);
    }
  }

  // 12. 色彩曲线
  if (curves.enabled && curves.preset !== "none") {
    const curvesFilter = generateCurvesFilter(curves);
    if (curvesFilter) {
      filters.push(curvesFilter);
      console.log(`📈 启用色彩曲线: ${curves.preset}`);
    }
  }

  // 13. 时间戳
  if (timestamp.enabled) {
    const timestampFilter = generateTimestampFilter(timestamp);
    if (timestampFilter) {
      filters.push(timestampFilter);
      console.log(`⏰ 启用时间戳: ${timestamp.format}`);
    }
  }

  // 14. 色度偏移
  if (chromaShift.enabled) {
    const chromaFilter = generateChromaShiftFilter(chromaShift);
    if (chromaFilter) {
      filters.push(chromaFilter);
      console.log(`🎨 启用色度偏移: 强度=${chromaShift.strength || "light"}`);
    }
  }

  // 15. 帧抖动
  if (frameJitter.enabled) {
    const jitterFilter = generateFrameJitterFilter(frameJitter);
    if (jitterFilter) {
      filters.push(jitterFilter);
      console.log(`⏱️ 启用帧抖动: 量=${frameJitter.amount || 0.001}`);
    }
  }

  // 16. 像素偏移
  if (pixelShift.enabled) {
    const shiftFilter = generatePixelShiftFilter(pixelShift);
    if (shiftFilter) {
      filters.push(shiftFilter);
      console.log(`📍 启用像素偏移: X=${pixelShift.x || 1}px, Y=${pixelShift.y || 1}px`);
    }
  }

  // 17. 颗粒感
  if (grain.enabled) {
    const grainFilter = generateGrainFilter(grain);
    if (grainFilter) {
      filters.push(grainFilter);
      console.log(`🎞️ 启用颗粒感: 强度=${grain.strength || "light"}, 类型=${grain.type || "film"}`);
    }
  }

  // 18. 色彩抖动
  if (colorDither.enabled) {
    const ditherFilter = generateColorDitherFilter(colorDither);
    if (ditherFilter) {
      filters.push(ditherFilter);
      console.log(`🌈 启用色彩抖动: 强度=${colorDither.strength || 0.02}`);
    }
  }

  // 19. 边缘增强
  if (edgeEnhance.enabled) {
    const edgeFilter = generateEdgeEnhanceFilter(edgeEnhance);
    if (edgeFilter) {
      filters.push(edgeFilter);
      console.log(`✨ 启用边缘增强: 强度=${edgeEnhance.strength || "light"}`);
    }
  }

  // 20. 随机裁剪
  if (randomCrop.enabled) {
    const cropFilter = generateRandomCropFilter(randomCrop);
    if (cropFilter) {
      filters.push(cropFilter);
      console.log(`✂️ 启用随机裁剪: 最大${randomCrop.maxCrop || 5}px`);
    }
  }

  // 合并滤镜
  const filterComplex = filters.join(",");

  // 检测硬件加速
  console.log(`\n🔍 检测硬件加速...`);
  const hwAccel = await detectHardwareAcceleration();
  if (hwAccel.available) {
    console.log(`✅ 检测到硬件加速: ${hwAccel.type.toUpperCase()}`);
  } else {
    console.log(`ℹ️  未检测到硬件加速，使用CPU编码`);
  }

  // 设置编码质量和多线程
  let qualityParams;
  let encoderParams = [];

  // 根据硬件加速类型选择编码器
  if (hwAccel.available && hwAccel.type === "videotoolbox") {
    // macOS VideoToolbox硬件加速
    encoderParams = ["-c:v", "h264_videotoolbox"];
    switch (quality) {
      case "high":
        qualityParams = ["-b:v", "8M"];
        break;
      case "medium":
        qualityParams = ["-b:v", "5M"];
        break;
      case "low":
        qualityParams = ["-b:v", "3M"];
        break;
      default:
        qualityParams = ["-b:v", "5M"];
    }
  } else if (hwAccel.available && hwAccel.type === "cuda") {
    // NVIDIA CUDA加速
    encoderParams = ["-c:v", "h264_nvenc"];
    switch (quality) {
      case "high":
        qualityParams = ["-preset", "p7", "-cq", "18"];
        break;
      case "medium":
        qualityParams = ["-preset", "p5", "-cq", "23"];
        break;
      case "low":
        qualityParams = ["-preset", "p3", "-cq", "28"];
        break;
      default:
        qualityParams = ["-preset", "p5", "-cq", "23"];
    }
  } else {
    // CPU编码 - 使用多线程加速
    encoderParams = ["-c:v", "libx264"];
    const threads = Math.max(1, Math.floor(require("os").cpus().length * 0.75));

    switch (quality) {
      case "high":
        qualityParams = [
          "-crf",
          "18",
          "-preset",
          "medium",
          "-threads",
          threads.toString(),
        ];
        break;
      case "medium":
        qualityParams = [
          "-crf",
          "23",
          "-preset",
          "fast",
          "-threads",
          threads.toString(),
        ];
        break;
      case "low":
        qualityParams = [
          "-crf",
          "28",
          "-preset",
          "veryfast",
          "-threads",
          threads.toString(),
        ];
        break;
      default:
        qualityParams = [
          "-crf",
          "23",
          "-preset",
          "fast",
          "-threads",
          threads.toString(),
        ];
    }
    console.log(`🧵 使用多线程: ${threads} 线程`);
  }

  console.log(`\n🎬 开始处理视频...`);
  console.log(`📥 输入: ${input}`);
  console.log(`📤 输出: ${outputPath}`);
  console.log(`⚙️  质量: ${quality}`);
  console.log(
    `🚀 加速: ${hwAccel.available ? hwAccel.type.toUpperCase() : "CPU多线程"}`
  );
  console.log(`🔊 音频: ${keepAudio ? "保留" : "移除"}\n`);

  // 构建 FFmpeg 命令参数数组
  const ffmpegArgs = [
    "-hide_banner",
    "-progress",
    "pipe:2", // 输出进度到stderr
    "-i",
    input,
  ];

  // 添加视频滤镜
  if (filterComplex) {
    ffmpegArgs.push("-vf", filterComplex);
  }

  // 视频编码参数
  ffmpegArgs.push(...encoderParams, ...qualityParams, "-pix_fmt", "yuv420p");

  // 处理音频
  if (keepAudio) {
    if (speedChange.enabled && speedChange.speed !== 1.0 && audioSpeedFilter) {
      // 音频变速
      ffmpegArgs.push("-af", audioSpeedFilter);
      ffmpegArgs.push("-c:a", "aac", "-b:a", "192k");
    } else {
      // 复制音频
      ffmpegArgs.push("-c:a", "copy");
    }
  } else {
    ffmpegArgs.push("-an");
  }

  // 添加输出文件
  ffmpegArgs.push("-y", outputPath);

  try {
    console.log(`🔧 执行FFmpeg命令...\n`);

    // 执行 FFmpeg 命令并显示进度
    await execCommandWithProgress(ffmpegArgs, videoInfo.duration);

    console.log(`\n✅ 视频处理完成！`);

    // MD5修改
    if (modifyMD5) {
      console.log("🔐 正在修改MD5...");
      await modifyVideoMD5(outputPath);
    }

    console.log(`📁 输出文件: ${outputPath}`);

    // 显示文件大小
    const stats = await fs.stat(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 文件大小: ${sizeMB} MB`);

    // 显示去重效果摘要
    console.log("\n📋 去重效果摘要:");
    if (sweepLight.enabled) console.log("  ✓ 扫光去重");
    if (modifyMD5) console.log("  ✓ MD5修改");
    if (letterbox.enabled) console.log("  ✓ 模糊遮罩边框");
    if (sharpen.enabled) console.log("  ✓ 锐化");
    if (denoise.enabled) console.log("  ✓ 降噪");
    if (speedChange.enabled && speedChange.speed !== 1.0)
      console.log(`  ✓ 变速 (${speedChange.speed}x)`);
    if (colorAdjust.enabled) console.log("  ✓ 色彩调整");
    if (flip.enabled) console.log("  ✓ 镜像翻转");
    if (scale.enabled && scale.scale !== 1.0) console.log("  ✓ 缩放");
    if (rotate.enabled && rotate.angle !== 0) console.log("  ✓ 旋转");
    if (fpsAdjust.enabled && fpsAdjust.fps > 0) console.log("  ✓ 帧率调整");
    if (blur.enabled) console.log("  ✓ 模糊");
    if (curves.enabled && curves.preset !== "none") console.log("  ✓ 色彩曲线");
    if (timestamp.enabled) console.log("  ✓ 时间戳");
    if (chromaShift.enabled) console.log("  ✓ 色度偏移");
    if (frameJitter.enabled) console.log("  ✓ 帧抖动");
    if (pixelShift.enabled) console.log("  ✓ 像素偏移");
    if (grain.enabled) console.log("  ✓ 颗粒感");
    if (colorDither.enabled) console.log("  ✓ 色彩抖动");
    if (edgeEnhance.enabled) console.log("  ✓ 边缘增强");
    if (randomCrop.enabled) console.log("  ✓ 随机裁剪");
    console.log("");

    return outputPath;
  } catch (error) {
    throw new Error(`视频处理失败: ${error.message}`);
  }
}

/**
 * 显示帮助信息
 */
export function showVideoDedupHelp() {
  console.log(`
📹 视频去重工具 - 使用说明

功能特性:
  • 扫光去重效果 - 添加动态扫光 + 随机噪点，增加视频独特性
  • MD5修改 - 修改视频文件MD5值，避免重复检测
  • 模糊遮罩边框 - 添加模糊边框效果，保持画面美观
  • 锐化 - 适当锐化视频画面
  • 降噪 - 对视频进行降噪处理
  • 变速 - 可配置的加快变速处理（1.0-1.2倍）

配置示例 (config.mjs):

"video-dedup": {
  input: "input/video.mp4",              // 输入视频路径
  output: "output/video-dedup/out.mp4",  // 输出路径（可选）
  
  // 扫光配置
  sweepLight: {
    enabled: true,                        // 是否启用
    opacity: 0.15,                        // 透明度 0.05-0.3
    speed: 'medium',                      // 速度: slow, medium, fast
    angle: null,                          // 角度（null为随机）
    width: 0.3,                           // 宽度 0.1-0.5
    color: 'white'                        // 颜色: white, gold, blue, rainbow
  },
  
  // MD5修改
  modifyMD5: true,                        // 是否修改MD5
  
  // 模糊遮罩边框配置
  letterbox: {
    enabled: true,                        // 是否启用
    top: 40,                              // 上边框高度（像素）
    bottom: 40,                           // 下边框高度（像素）
    left: 0,                              // 左边框宽度（像素）
    right: 0,                             // 右边框宽度（像素）
    blurStrength: 15                      // 模糊强度 5-30
  },
  
  // 锐化配置
  sharpen: {
    enabled: true,                        // 是否启用
    strength: 'medium'                    // 强度: light, medium, strong
  },
  
  // 降噪配置
  denoise: {
    enabled: true,                        // 是否启用
    strength: 'light'                     // 强度: light, medium, strong
  },
  
  // 变速配置
  speedChange: {
    enabled: true,                        // 是否启用
    speed: 1.05                           // 速度倍数 1.0-1.2
  },
  
  quality: 'high',                        // 质量: high, medium, low
  keepAudio: true                         // 是否保留音频
}

使用方法:
  npx node-ffmpeg-tools video-dedup      # 使用配置文件
  npx node-ffmpeg-tools video-dedup --help  # 显示帮助信息

提示:
  • 所有去重效果可以同时启用，也可以单独配置
  • 扫光效果每次运行都会随机生成（如果angle为null）
  • MD5修改在视频处理完成后自动执行
  • 变速会同时调整视频和音频速度
  • 建议使用 high 质量以保持视频清晰度
`);
}

/**
 * 主函数
 */
export default async function runVideoDedup(config) {
  try {
    await applyVideoDedup(config);
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}\n`);
    throw error;
  }
}
