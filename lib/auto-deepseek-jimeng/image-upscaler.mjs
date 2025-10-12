import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { promisify } from "util";
import sharp from "sharp";

/**
 * 图片无损放大工具
 * 支持多种AI放大算法：Real-ESRGAN, ESRGAN, waifu2x等
 */

/**
 * 获取图片分辨率信息
 */
async function getImageResolution(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size
    };
  } catch (error) {
    console.error(`❌ 获取图片分辨率失败: ${error.message}`);
    return null;
  }
}

/**
 * 检查图片是否需要放大到4K
 */
function needsUpscaling(resolution, targetResolution = { width: 3840, height: 2160 }) {
  if (!resolution) return false;
  
  const { width, height } = resolution;
  const { width: targetWidth, height: targetHeight } = targetResolution;
  
  // 如果图片任一边小于目标分辨率的80%，则需要放大
  const needsWidth = width < targetWidth * 0.8;
  const needsHeight = height < targetHeight * 0.8;
  
  return needsWidth || needsHeight;
}

/**
 * 计算放大倍数
 */
function calculateUpscaleFactor(resolution, targetResolution = { width: 3840, height: 2160 }) {
  if (!resolution) return 2;
  
  const { width, height } = resolution;
  const { width: targetWidth, height: targetHeight } = targetResolution;
  
  // 计算需要的放大倍数，取较大的那个
  const widthFactor = targetWidth / width;
  const heightFactor = targetHeight / height;
  const factor = Math.max(widthFactor, heightFactor);
  
  // 限制在合理范围内 (1-8倍)
  return Math.min(Math.max(Math.ceil(factor), 1), 8);
}

/**
 * 使用Real-ESRGAN进行AI无损放大
 */
async function upscaleWithRealESRGAN(inputPath, outputPath, scale = 4) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 尝试使用 Real-ESRGAN 放大图片 (${scale}x)...`);
    
    // Real-ESRGAN命令行工具路径（需要预先安装）
    const realESRGANPath = "realesrgan-ncnn-vulkan"; // 或者指定完整路径
    
    const args = [
      "-i", inputPath,
      "-o", outputPath,
      "-s", scale.toString(),
      "-m", "models", // 模型目录
      "-n", "RealESRGAN_x4plus" // 使用x4plus模型
    ];
    
    const process = spawn(realESRGANPath, args);
    
    let stdout = "";
    let stderr = "";
    
    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    process.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ Real-ESRGAN 放大完成`);
        resolve(true);
      } else {
        console.warn(`⚠️ Real-ESRGAN 放大失败 (退出码: ${code})`);
        console.warn(`错误信息: ${stderr}`);
        resolve(false);
      }
    });
    
    process.on("error", (error) => {
      console.warn(`⚠️ Real-ESRGAN 启动失败: ${error.message}`);
      resolve(false);
    });
  });
}

/**
 * 使用waifu2x进行AI无损放大（备用方案）
 */
async function upscaleWithWaifu2x(inputPath, outputPath, scale = 4) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 尝试使用 waifu2x 放大图片 (${scale}x)...`);
    
    // waifu2x命令行工具路径
    const waifu2xPath = "waifu2x-ncnn-vulkan"; // 或者指定完整路径
    
    const args = [
      "-i", inputPath,
      "-o", outputPath,
      "-s", scale.toString(),
      "-n", "3", // 降噪等级
      "-m", "models-cunet" // 使用cunet模型
    ];
    
    const process = spawn(waifu2xPath, args);
    
    let stdout = "";
    let stderr = "";
    
    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    process.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ waifu2x 放大完成`);
        resolve(true);
      } else {
        console.warn(`⚠️ waifu2x 放大失败 (退出码: ${code})`);
        resolve(false);
      }
    });
    
    process.on("error", (error) => {
      console.warn(`⚠️ waifu2x 启动失败: ${error.message}`);
      resolve(false);
    });
  });
}

/**
 * 使用Sharp进行传统双三次插值放大（兜底方案）
 */
async function upscaleWithSharp(inputPath, outputPath, targetWidth, targetHeight) {
  try {
    console.log(`🔍 使用 Sharp 进行传统放大到 ${targetWidth}x${targetHeight}...`);
    
    await sharp(inputPath)
      .resize(targetWidth, targetHeight, {
        kernel: sharp.kernel.cubic, // 使用双三次插值
        fit: 'fill' // 填充到目标尺寸
      })
      .jpeg({ quality: 95 }) // 高质量JPEG
      .toFile(outputPath);
    
    console.log(`✅ Sharp 传统放大完成`);
    return true;
  } catch (error) {
    console.error(`❌ Sharp 放大失败: ${error.message}`);
    return false;
  }
}

/**
 * 智能选择最佳放大方案
 */
async function smartUpscale(inputPath, outputPath, targetResolution = { width: 3840, height: 2160 }) {
  const resolution = await getImageResolution(inputPath);
  if (!resolution) {
    console.error(`❌ 无法获取图片分辨率，跳过放大`);
    return false;
  }
  
  console.log(`📊 原图分辨率: ${resolution.width}x${resolution.height}`);
  
  if (!needsUpscaling(resolution, targetResolution)) {
    console.log(`✅ 图片分辨率已足够，无需放大`);
    return true;
  }
  
  const scale = calculateUpscaleFactor(resolution, targetResolution);
  console.log(`📈 计算放大倍数: ${scale}x`);
  
  // 方案1: 尝试Real-ESRGAN (最佳质量)
  let success = await upscaleWithRealESRGAN(inputPath, outputPath, scale);
  if (success) return true;
  
  // 方案2: 尝试waifu2x (备用AI方案)
  success = await upscaleWithWaifu2x(inputPath, outputPath, scale);
  if (success) return true;
  
  // 方案3: 使用Sharp传统放大 (兜底方案)
  const targetWidth = Math.round(resolution.width * scale);
  const targetHeight = Math.round(resolution.height * scale);
  success = await upscaleWithSharp(inputPath, outputPath, targetWidth, targetHeight);
  
  return success;
}

/**
 * 处理单张图片的无损放大
 */
export async function upscaleImage(imagePath, config = {}) {
  try {
    const {
      targetResolution = { width: 3840, height: 2160 }, // 4K分辨率
      replaceOriginal = true, // 是否替换原图
      backupOriginal = true, // 是否备份原图
      outputSuffix = "_4k" // 输出文件后缀
    } = config;
    
    console.log(`🖼️ 开始处理图片: ${path.basename(imagePath)}`);
    
    // 检查文件是否存在
    try {
      await fs.access(imagePath);
    } catch (error) {
      console.error(`❌ 图片文件不存在: ${imagePath}`);
      return false;
    }
    
    // 获取图片信息
    const resolution = await getImageResolution(imagePath);
    if (!resolution) return false;
    
    // 检查是否需要放大
    if (!needsUpscaling(resolution, targetResolution)) {
      console.log(`✅ ${path.basename(imagePath)} 分辨率已足够，跳过放大`);
      return true;
    }
    
    // 准备输出路径
    const dir = path.dirname(imagePath);
    const ext = path.extname(imagePath);
    const name = path.basename(imagePath, ext);
    const tempOutputPath = path.join(dir, `${name}${outputSuffix}${ext}`);
    
    // 备份原图
    if (backupOriginal) {
      const backupPath = path.join(dir, `${name}_original${ext}`);
      try {
        await fs.copyFile(imagePath, backupPath);
        console.log(`💾 已备份原图: ${path.basename(backupPath)}`);
      } catch (error) {
        console.warn(`⚠️ 备份原图失败: ${error.message}`);
      }
    }
    
    // 执行放大
    const success = await smartUpscale(imagePath, tempOutputPath, targetResolution);
    
    if (success) {
      // 验证放大后的图片
      const newResolution = await getImageResolution(tempOutputPath);
      if (newResolution) {
        console.log(`📊 放大后分辨率: ${newResolution.width}x${newResolution.height}`);
        
        // 替换原图（Windows权限问题修复）
        if (replaceOriginal) {
          try {
            // 先删除原图，再重命名（避免Windows权限问题）
            await fs.unlink(imagePath);
            await new Promise(resolve => setTimeout(resolve, 100)); // 短暂等待文件系统释放
            await fs.rename(tempOutputPath, imagePath);
            console.log(`✅ 已替换原图: ${path.basename(imagePath)}`);
          } catch (renameError) {
            console.warn(`⚠️ 替换原图失败: ${renameError.message}`);
            // 如果重命名失败，尝试复制然后删除
            try {
              await fs.copyFile(tempOutputPath, imagePath);
              await fs.unlink(tempOutputPath);
              console.log(`✅ 通过复制方式替换原图: ${path.basename(imagePath)}`);
            } catch (copyError) {
              console.error(`❌ 复制替换也失败: ${copyError.message}`);
              return false;
            }
          }
        } else {
          console.log(`✅ 放大完成，保存为: ${path.basename(tempOutputPath)}`);
        }
        
        return true;
      } else {
        console.error(`❌ 放大后的图片无效`);
        // 清理临时文件
        try {
          await fs.unlink(tempOutputPath);
        } catch (error) {
          // 忽略清理错误
        }
        return false;
      }
    } else {
      console.error(`❌ 图片放大失败: ${path.basename(imagePath)}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ 处理图片时出错: ${error.message}`);
    return false;
  }
}

/**
 * 批量处理目录中的所有图片
 */
export async function upscaleImagesInDirectory(directoryPath, config = {}) {
  try {
    console.log(`📁 开始批量处理目录: ${directoryPath}`);
    
    // 读取目录中的所有文件
    const files = await fs.readdir(directoryPath);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'].includes(ext);
    });
    
    if (imageFiles.length === 0) {
      console.log(`⚠️ 目录中没有找到图片文件`);
      return { success: 0, failed: 0, skipped: 0 };
    }
    
    console.log(`🔍 找到 ${imageFiles.length} 个图片文件`);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    
    // 逐个处理图片
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const filePath = path.join(directoryPath, file);
      
      console.log(`\n📸 处理第 ${i + 1}/${imageFiles.length} 张图片: ${file}`);
      
      const result = await upscaleImage(filePath, config);
      
      if (result === true) {
        success++;
      } else if (result === false) {
        failed++;
      } else {
        skipped++;
      }
      
      // 添加处理间隔，避免系统负载过高
      if (i < imageFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n📊 批量处理完成:`);
    console.log(`  ✅ 成功: ${success} 张`);
    console.log(`  ❌ 失败: ${failed} 张`);
    console.log(`  ⏭️ 跳过: ${skipped} 张`);
    
    return { success, failed, skipped };
    
  } catch (error) {
    console.error(`❌ 批量处理目录时出错: ${error.message}`);
    return { success: 0, failed: 0, skipped: 0 };
  }
}

export default {
  upscaleImage,
  upscaleImagesInDirectory,
  getImageResolution,
  needsUpscaling
};
