/**
 * FFmpeg 优化参数配置
 * 提供多线程和GPU加速支持
 */

import { execSync } from "child_process";
import os from "os";

/**
 * 检测可用的硬件加速
 * @returns {Object} 硬件加速配置
 */
function detectHardwareAcceleration() {
  const platform = process.platform;
  let hwaccel = null;
  let encoder = "libx264";
  let decoder = "";

  try {
    // 检测 NVIDIA GPU (NVENC)
    if (platform === "win32") {
      try {
        execSync("nvidia-smi", { stdio: "ignore" });
        hwaccel = "cuda";
        encoder = "h264_nvenc";
        decoder = "-hwaccel cuda -hwaccel_output_format cuda";
        console.log("✅ 检测到 NVIDIA GPU，启用 CUDA 加速");
        return { hwaccel, encoder, decoder, available: true };
      } catch (e) {
        // NVIDIA GPU 不可用
      }
    }

    // 检测 Intel Quick Sync (QSV)
    try {
      const ffmpegEncoders = execSync("ffmpeg -encoders", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      if (ffmpegEncoders.includes("h264_qsv")) {
        hwaccel = "qsv";
        encoder = "h264_qsv";
        decoder = "-hwaccel qsv";
        console.log("✅ 检测到 Intel Quick Sync，启用 QSV 加速");
        return { hwaccel, encoder, decoder, available: true };
      }
    } catch (e) {
      // QSV 不可用
    }

    // 检测 AMD GPU (AMF)
    try {
      const ffmpegEncoders = execSync("ffmpeg -encoders", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      if (ffmpegEncoders.includes("h264_amf")) {
        hwaccel = "auto";
        encoder = "h264_amf";
        decoder = "-hwaccel auto";
        console.log("✅ 检测到 AMD GPU，启用 AMF 加速");
        return { hwaccel, encoder, decoder, available: true };
      }
    } catch (e) {
      // AMF 不可用
    }
  } catch (error) {
    // 硬件加速检测失败
  }

  console.log("ℹ️  未检测到硬件加速，使用 CPU 编码");
  return { hwaccel: null, encoder: "libx264", decoder: "", available: false };
}

/**
 * 获取优化的线程数
 * @returns {number} 推荐的线程数
 */
function getOptimalThreadCount() {
  const cpuCount = os.cpus().length;
  // 使用 75% 的 CPU 核心，至少 2 个，最多 16 个
  const threads = Math.max(2, Math.min(16, Math.floor(cpuCount * 0.75)));
  return threads;
}

/**
 * 生成优化的 FFmpeg 参数
 * @param {Object} options - 配置选项
 * @param {boolean} options.enableGPU - 是否启用GPU加速（默认true）
 * @param {boolean} options.enableMultiThread - 是否启用多线程（默认true）
 * @param {string} options.preset - 编码预设（默认"medium"）
 * @param {number} options.crf - 质量参数（默认23）
 * @param {boolean} options.highQuality - 是否启用高质量模式（默认true，在内存和GPU允许下最大化质量）
 * @returns {Object} FFmpeg参数对象
 */
export function getOptimizedFFmpegParams(options = {}) {
  const {
    enableGPU = true,
    enableMultiThread = true,
    preset = "medium",
    crf = 23,
    highQuality = true, // 默认启用高质量模式
  } = options;

  const threads = enableMultiThread ? getOptimalThreadCount() : 0;
  const hwConfig = enableGPU ? detectHardwareAcceleration() : { available: false };

  let params = {
    // 输入参数
    inputParams: "",
    // 视频编码参数
    videoCodec: "libx264",
    // 输出参数
    outputParams: "",
    // 线程配置
    threads: threads,
    // 硬件加速信息
    hwaccel: hwConfig.available,
  };

  // 多线程参数
  if (enableMultiThread) {
    params.outputParams += ` -threads ${threads}`;
    console.log(`🚀 启用多线程: ${threads} 个线程`);
  }

  // GPU 加速参数
  if (enableGPU && hwConfig.available) {
    params.inputParams = hwConfig.decoder;
    params.videoCodec = hwConfig.encoder;

    // 根据不同的硬件加速添加特定参数
    if (hwConfig.encoder === "h264_nvenc") {
      // NVIDIA NVENC 参数
      if (highQuality) {
        // 高质量模式：使用最慢预设、最低CRF、更高码率和更大缓冲区
        const highQualityCrf = Math.max(10, crf - 10); // 更低的CRF值
        params.outputParams += ` -preset p7 -tune hq -rc vbr -cq ${highQualityCrf} -b:v 0 -maxrate 30M -bufsize 60M -spatial_aq 1 -temporal_aq 1 -rc-lookahead 32 -bf 3 -b_ref_mode middle`;
        console.log(`🎨 高质量模式: NVENC P7 预设, CQ ${highQualityCrf}, 最大码率 30Mbps`);
      } else {
        params.outputParams += ` -preset p4 -tune hq -rc vbr -cq ${crf} -b:v 0 -maxrate 8M -bufsize 16M`;
      }
    } else if (hwConfig.encoder === "h264_qsv") {
      // Intel QSV 参数
      if (highQuality) {
        const highQualityCrf = Math.max(10, crf - 10);
        params.outputParams += ` -preset veryslow -global_quality ${highQualityCrf} -look_ahead 1 -look_ahead_depth 40`;
        console.log(`🎨 高质量模式: QSV veryslow 预设, Quality ${highQualityCrf}`);
      } else {
        params.outputParams += ` -preset ${preset} -global_quality ${crf}`;
      }
    } else if (hwConfig.encoder === "h264_amf") {
      // AMD AMF 参数
      if (highQuality) {
        const highQualityCrf = Math.max(10, crf - 10);
        params.outputParams += ` -quality quality -rc cqp -qp_i ${highQualityCrf} -qp_p ${highQualityCrf} -preanalysis 1`;
        console.log(`🎨 高质量模式: AMF Quality, QP ${highQualityCrf}`);
      } else {
        params.outputParams += ` -quality quality -rc cqp -qp_i ${crf} -qp_p ${crf}`;
      }
    }
  } else {
    // CPU 编码参数
    params.videoCodec = "libx264";
    if (highQuality) {
      // CPU高质量模式：使用veryslow预设、更低的CRF和更多优化参数
      const highQualityCrf = Math.max(10, crf - 10);
      params.outputParams += ` -preset veryslow -crf ${highQualityCrf} -tune film -profile:v high -level 4.2 -bf 3 -refs 5 -me_method umh -subq 10 -trellis 2`;
      console.log(`🎨 高质量模式: CPU veryslow 预设, CRF ${highQualityCrf}, 高级优化参数`);
    } else {
      params.outputParams += ` -preset ${preset} -crf ${crf}`;
    }
  }

  // 通用参数 - 高质量模式使用更好的像素格式和色彩空间
  if (highQuality) {
    params.outputParams += ` -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709`;
  } else {
    params.outputParams += ` -pix_fmt yuv420p`;
  }

  return params;
}

/**
 * 生成完整的 FFmpeg 命令
 * @param {string} input - 输入文件
 * @param {string} output - 输出文件
 * @param {string} filterComplex - 滤镜复杂链（可选）
 * @param {Object} options - 优化选项
 * @returns {string} 完整的 FFmpeg 命令
 */
export function buildOptimizedFFmpegCommand(
  input,
  output,
  filterComplex = "",
  options = {}
) {
  const params = getOptimizedFFmpegParams(options);

  let command = "ffmpeg -y";

  // 输入参数（硬件加速解码）
  if (params.inputParams) {
    command += ` ${params.inputParams}`;
  }

  // 输入文件
  command += ` -i "${input}"`;

  // 滤镜
  if (filterComplex) {
    command += ` -filter_complex "${filterComplex}"`;
  }

  // 视频编码
  command += ` -c:v ${params.videoCodec}`;

  // 输出参数
  command += params.outputParams;

  // 音频编码（通常保持不变）
  command += ` -c:a aac -b:a 192k`;

  // 输出文件
  command += ` "${output}"`;

  return command;
}

/**
 * 显示优化信息
 */
export function showOptimizationInfo() {
  const threads = getOptimalThreadCount();
  const hwConfig = detectHardwareAcceleration();

  console.log("\n⚡ FFmpeg 优化配置:");
  console.log(`   - CPU 线程数: ${threads}`);
  console.log(`   - 硬件加速: ${hwConfig.available ? hwConfig.encoder : "未启用"}`);
  console.log("");
}

export default {
  getOptimizedFFmpegParams,
  buildOptimizedFFmpegCommand,
  showOptimizationInfo,
};
