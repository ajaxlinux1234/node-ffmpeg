import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

/**
 * 批量裁剪图片为9:16宽高比
 * @param {Object} config - 配置对象
 */
export default async function batchCropImages(config) {
  console.log("✂️ 启动批量图片裁剪功能...");

  const {
    inputDir = "input/images", // 输入目录
    outputDir = "output/cropped", // 输出目录
    targetAspectRatio = "9:16", // 目标宽高比
    formats = ["jpg", "jpeg", "png", "webp"], // 支持的格式
    recursive = true, // 是否递归处理子目录
    cropMode = "center", // 裁剪模式: "center", "smart", "entropy"
    quality = 90, // 输出质量 (1-100)
    outputFormat = "auto", // 输出格式: "auto", "jpg", "png", "webp"
    keepOriginal = true, // 是否保留原文件
    skipIfExists = true, // 如果输出文件已存在则跳过
  } = config["batch-crop-images"] || {};

  // 解析目标宽高比
  const [targetWidth, targetHeight] = targetAspectRatio.split(':').map(Number);
  if (!targetWidth || !targetHeight) {
    throw new Error(`无效的目标宽高比格式: ${targetAspectRatio}，应为 "width:height" 格式`);
  }

  // 验证输入目录
  try {
    await fs.access(inputDir);
  } catch (error) {
    throw new Error(`输入目录不存在: ${inputDir}`);
  }

  // 创建输出目录
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`📁 输入目录: ${inputDir}`);
  console.log(`📁 输出目录: ${outputDir}`);
  console.log(`📐 目标比例: ${targetAspectRatio}`);
  console.log(`🎯 裁剪模式: ${cropMode}`);
  console.log(`📋 支持格式: ${formats.join(", ")}`);

  // 获取所有图片文件
  const imageFiles = await getImageFiles(inputDir, formats, recursive);
  console.log(`🔍 找到 ${imageFiles.length} 个图片文件`);

  if (imageFiles.length === 0) {
    console.log("⚠️ 未找到任何图片文件");
    return;
  }

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // 处理每个图片文件
  for (const filePath of imageFiles) {
    try {
      const result = await cropImage(
        filePath,
        inputDir,
        outputDir,
        targetWidth,
        targetHeight,
        cropMode,
        quality,
        outputFormat,
        skipIfExists
      );

      if (result.skipped) {
        skippedCount++;
        console.log(`⏭️ ${result.fileName}: 文件已存在，跳过`);
      } else if (result.success) {
        processedCount++;
        const cropInfo = result.cropInfo;
        console.log(
          `✅ ${result.fileName}: ${cropInfo.originalSize} → ${cropInfo.newSize} (${cropInfo.cropMethod})`
        );
      } else {
        errorCount++;
        console.warn(`⚠️ ${result.fileName}: ${result.error}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ 处理文件失败 ${path.basename(filePath)}: ${error.message}`);
    }
  }

  // 输出统计信息
  console.log("\n📊 裁剪完成统计:");
  console.log(`✅ 成功裁剪: ${processedCount} 个文件`);
  if (skippedCount > 0) {
    console.log(`⏭️ 跳过已有: ${skippedCount} 个文件`);
  }
  if (errorCount > 0) {
    console.log(`❌ 处理失败: ${errorCount} 个文件`);
  }
}

/**
 * 递归获取所有图片文件
 */
async function getImageFiles(dir, formats, recursive) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && recursive) {
      const subFiles = await getImageFiles(fullPath, formats, recursive);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase().slice(1);
      if (formats.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * 裁剪单个图片文件
 */
async function cropImage(filePath, inputDir, outputDir, targetWidth, targetHeight, cropMode, quality, outputFormat, skipIfExists) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(inputDir, filePath);
  const outputPath = path.join(outputDir, relativePath);

  // 确保输出目录存在
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // 如果输出文件已存在且设置了跳过，则直接跳过
  if (skipIfExists) {
    try {
      await fs.access(outputPath);
      return {
        success: false,
        skipped: true,
        fileName,
      };
    } catch (error) {
      // 文件不存在，继续处理
    }
  }

  try {
    // 读取图片元数据
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // 计算裁剪区域
    const cropResult = calculateCropArea(
      metadata.width,
      metadata.height,
      targetWidth,
      targetHeight,
      cropMode
    );

    if (!cropResult) {
      return {
        success: false,
        fileName,
        error: "无法计算合适的裁剪区域",
      };
    }

    let sharpInstance = image;

    // 执行裁剪
    if (cropResult.method === 'crop') {
      sharpInstance = sharpInstance.extract({
        left: cropResult.left,
        top: cropResult.top,
        width: cropResult.width,
        height: cropResult.height,
      });
    } else if (cropResult.method === 'resize') {
      // 如果需要缩放，先缩放再裁剪
      sharpInstance = sharpInstance.resize(cropResult.resizeWidth, cropResult.resizeHeight, {
        fit: 'cover',
        position: cropMode === 'entropy' ? 'entropy' : 'center',
      });
    }

    // 设置输出格式和质量
    let outputFilePath = outputPath;
    switch (outputFormat) {
      case "jpg":
      case "jpeg":
        sharpInstance = sharpInstance.jpeg({ quality });
        outputFilePath = outputPath.replace(/\.[^.]+$/, '.jpg');
        break;
      case "png":
        sharpInstance = sharpInstance.png({ quality });
        outputFilePath = outputPath.replace(/\.[^.]+$/, '.png');
        break;
      case "webp":
        sharpInstance = sharpInstance.webp({ quality });
        outputFilePath = outputPath.replace(/\.[^.]+$/, '.webp');
        break;
      default:
        // 保持原格式
        const originalExt = path.extname(filePath).toLowerCase();
        if (originalExt === '.jpg' || originalExt === '.jpeg') {
          sharpInstance = sharpInstance.jpeg({ quality });
        } else if (originalExt === '.png') {
          sharpInstance = sharpInstance.png({ quality });
        } else if (originalExt === '.webp') {
          sharpInstance = sharpInstance.webp({ quality });
        }
        break;
    }

    // 保存裁剪后的图片
    await sharpInstance.toFile(outputFilePath);

    // 获取文件大小信息
    const originalStats = await fs.stat(filePath);
    const newStats = await fs.stat(outputFilePath);

    return {
      success: true,
      fileName,
      cropInfo: {
        originalSize: `${metadata.width}x${metadata.height}`,
        newSize: `${cropResult.width}x${cropResult.height}`,
        cropMethod: cropResult.method === 'crop' ? '裁剪' : '缩放+裁剪',
        left: cropResult.left,
        top: cropResult.top,
      },
    };

  } catch (error) {
    return {
      success: false,
      fileName,
      error: error.message,
    };
  }
}

/**
 * 计算裁剪区域
 */
function calculateCropArea(originalWidth, originalHeight, targetWidth, targetHeight, cropMode) {
  const originalRatio = originalWidth / originalHeight;
  const targetRatio = targetWidth / targetHeight;

  let cropWidth, cropHeight, left, top;
  let method = 'crop';

  if (originalRatio > targetRatio) {
    // 原图更宽，需要裁剪宽度
    cropHeight = originalHeight;
    cropWidth = Math.floor(originalHeight * targetRatio);
    left = Math.floor((originalWidth - cropWidth) / 2);
    top = 0;
  } else if (originalRatio < targetRatio) {
    // 原图更高，需要裁剪高度
    cropWidth = originalWidth;
    cropHeight = Math.floor(originalWidth / targetRatio);
    left = 0;
    top = Math.floor((originalHeight - cropHeight) / 2);
  } else {
    // 比例相同，直接使用原图尺寸
    cropWidth = originalWidth;
    cropHeight = originalHeight;
    left = 0;
    top = 0;
  }

  // 检查裁剪区域是否超出原图边界
  if (left < 0 || top < 0 || left + cropWidth > originalWidth || top + cropHeight > originalHeight) {
    // 需要缩放处理
    method = 'resize';
    const scale = Math.max(targetWidth / originalWidth, targetHeight / originalHeight);
    return {
      method: 'resize',
      resizeWidth: Math.floor(originalWidth * scale),
      resizeHeight: Math.floor(originalHeight * scale),
      width: targetWidth,
      height: targetHeight,
      left: 0,
      top: 0,
    };
  }

  return {
    method,
    width: cropWidth,
    height: cropHeight,
    left,
    top,
  };
}

/**
 * 格式化字节数为可读格式
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
