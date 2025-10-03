import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

/**
 * 批量无损压缩图片到最小
 * @param {Object} config - 配置对象
 */
export default async function optimizeImages(config) {
  console.log("🖼️ 启动图片优化功能...");

  const {
    inputDir = "input/images", // 输入目录
    outputDir = "output/optimized", // 输出目录
    quality = 90, // 压缩质量 (1-100)
    formats = ["jpg", "jpeg", "png", "webp"], // 支持的格式
    recursive = true, // 是否递归处理子目录
    keepOriginal = true, // 是否保留原文件
    outputFormat = "auto", // 输出格式: "auto", "jpg", "png", "webp"
    maxWidth = null, // 最大宽度，超过则缩放
    maxHeight = null, // 最大高度，超过则缩放
    aggressive = false, // 激进模式：更低质量但更小文件
  } = config["optimize-image"] || {};

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
  console.log(`🎯 压缩质量: ${quality}%`);
  console.log(`📋 支持格式: ${formats.join(", ")}`);

  // 获取所有图片文件
  const imageFiles = await getImageFiles(inputDir, formats, recursive);
  console.log(`🔍 找到 ${imageFiles.length} 个图片文件`);

  if (imageFiles.length === 0) {
    console.log("⚠️ 未找到任何图片文件");
    return;
  }

  let processedCount = 0;
  let totalSavedBytes = 0;

  // 处理每个图片文件
  for (const filePath of imageFiles) {
    try {
      const result = await optimizeImage(
        filePath,
        inputDir,
        outputDir,
        quality,
        outputFormat,
        keepOriginal,
        maxWidth,
        maxHeight,
        aggressive
      );

      if (result.success) {
        processedCount++;
        totalSavedBytes += result.savedBytes;
        
        const compressionRatio = ((result.savedBytes / result.originalSize) * 100).toFixed(1);
        console.log(
          `✅ ${result.fileName}: ${formatBytes(result.originalSize)} → ${formatBytes(result.newSize)} (节省 ${compressionRatio}%)`
        );
      } else {
        console.warn(`⚠️ ${result.fileName}: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ 处理文件失败 ${filePath}: ${error.message}`);
    }
  }

  // 输出统计信息
  console.log("\n📊 优化完成统计:");
  console.log(`✅ 成功处理: ${processedCount} 个文件`);
  console.log(`💾 总共节省: ${formatBytes(totalSavedBytes)}`);
  
  if (processedCount > 0) {
    const avgSavings = (totalSavedBytes / processedCount);
    console.log(`📈 平均节省: ${formatBytes(avgSavings)} 每个文件`);
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
 * 优化单个图片文件
 */
async function optimizeImage(filePath, inputDir, outputDir, quality, outputFormat, keepOriginal, maxWidth, maxHeight, aggressive) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(inputDir, filePath);
  const outputPath = path.join(outputDir, relativePath);
  
  // 确保输出目录存在
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  try {
    // 获取原文件大小
    const originalStats = await fs.stat(filePath);
    const originalSize = originalStats.size;

    // 读取图片
    const image = sharp(filePath);
    const metadata = await image.metadata();

    let outputFilePath = outputPath;
    let sharpInstance = image;

    // 尺寸调整
    if (maxWidth || maxHeight) {
      const needsResize = 
        (maxWidth && metadata.width > maxWidth) || 
        (maxHeight && metadata.height > maxHeight);
      
      if (needsResize) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
        console.log(`🔧 ${fileName}: 调整尺寸 ${metadata.width}x${metadata.height} → 最大${maxWidth || '∞'}x${maxHeight || '∞'}`);
      }
    }

    // 根据激进模式调整质量
    const finalQuality = aggressive ? Math.max(quality - 20, 30) : quality;

    // 根据输出格式设置
    if (outputFormat === "auto") {
      // 保持原格式，但使用更激进的压缩
      switch (metadata.format) {
        case "jpeg":
          sharpInstance = sharpInstance.jpeg({ 
            quality: finalQuality, 
            progressive: true,
            mozjpeg: true,
            optimiseScans: true,
            optimiseCoding: true,
            quantisationTable: aggressive ? 2 : 3 // 激进模式使用更激进的量化表
          });
          break;
        case "png":
          sharpInstance = sharpInstance.png({ 
            compressionLevel: 9,
            progressive: true,
            palette: aggressive, // 激进模式强制使用调色板
            effort: 10 // 最大压缩努力
          });
          break;
        case "webp":
          sharpInstance = sharpInstance.webp({ 
            quality: finalQuality,
            effort: 6,
            smartSubsample: true,
            reductionEffort: 6
          });
          break;
        default:
          // 其他格式转为 JPEG
          sharpInstance = sharpInstance.jpeg({ 
            quality: finalQuality, 
            progressive: true,
            mozjpeg: true,
            optimiseScans: true,
            optimiseCoding: true,
            quantisationTable: aggressive ? 2 : 3
          });
          outputFilePath = outputPath.replace(/\.[^.]+$/, '.jpg');
      }
    } else {
      // 指定输出格式
      switch (outputFormat) {
        case "jpg":
        case "jpeg":
          sharpInstance = sharpInstance.jpeg({ 
            quality: finalQuality, 
            progressive: true,
            mozjpeg: true,
            optimiseScans: true,
            optimiseCoding: true,
            quantisationTable: aggressive ? 2 : 3
          });
          outputFilePath = outputPath.replace(/\.[^.]+$/, '.jpg');
          break;
        case "png":
          sharpInstance = sharpInstance.png({ 
            compressionLevel: 9,
            progressive: true,
            palette: aggressive,
            effort: 10
          });
          outputFilePath = outputPath.replace(/\.[^.]+$/, '.png');
          break;
        case "webp":
          sharpInstance = sharpInstance.webp({ 
            quality: finalQuality,
            effort: 6,
            smartSubsample: true,
            reductionEffort: 6
          });
          outputFilePath = outputPath.replace(/\.[^.]+$/, '.webp');
          break;
      }
    }

    // 保存优化后的图片
    await sharpInstance.toFile(outputFilePath);

    // 获取新文件大小
    const newStats = await fs.stat(outputFilePath);
    const newSize = newStats.size;
    const savedBytes = originalSize - newSize;

    // 如果优化后文件更大，则使用原文件
    if (savedBytes < 0 && keepOriginal) {
      await fs.copyFile(filePath, outputFilePath);
      const finalStats = await fs.stat(outputFilePath);
      return {
        success: true,
        fileName,
        originalSize,
        newSize: finalStats.size,
        savedBytes: 0,
      };
    }

    return {
      success: true,
      fileName,
      originalSize,
      newSize,
      savedBytes: Math.max(0, savedBytes),
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
 * 格式化字节数为可读格式
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
