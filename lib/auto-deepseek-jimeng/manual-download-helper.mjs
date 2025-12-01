import fs from "fs/promises";
import path from "path";

/**
 * 手动下载辅助函数
 * 暂停程序执行，让用户手动下载图片
 */
export async function waitForManualDownload(downloadMode, name, expectedCount) {
  if (downloadMode.autoDownload) {
    return false; // 不需要手动下载
  }

  console.log("\n🛑 自动下载已禁用，切换到手动下载模式");
  console.log("=" .repeat(60));
  console.log(`📝 ${downloadMode.manualDownloadMessage}`);
  console.log(`📁 请将图片保存到: output/${name}/images/`);
  console.log(`📊 预期图片数量: ${expectedCount} 张`);
  console.log(`📋 文件命名: 任意名称即可，程序会按下载时间自动重命名为 image_1.jpg, image_2.jpg, ...`);
  console.log(`🎯 下载顺序: 按照你希望的视频顺序下载（第一个下载的对应第一个镜头）`);
  console.log("⏰ 浏览器窗口将保持打开，请手动下载所需的图片");
  console.log("=" .repeat(60));
  console.log("✅ 下载完成后，请在终端按 Enter 键继续，程序会自动重命名...\n");

  // 创建图片目录
  if (!name) {
    console.error(`❌ name 参数为空，无法创建目录`);
    return false;
  }
  
  const imagesDir = path.join("output", name, "images");
  try {
    await fs.mkdir(imagesDir, { recursive: true });
  } catch (error) {
    console.warn(`⚠️ 创建图片目录失败: ${error.message}`);
  }

  // 等待用户按键或超时
  return new Promise((resolve) => {
    let resolved = false;
    
    // 设置超时
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log(`\n⏰ 手动下载超时 (${Math.floor(downloadMode.manualDownloadTimeout / 60)}分钟)，继续执行...`);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve(true);
      }
    }, downloadMode.manualDownloadTimeout * 1000);

    // 监听用户输入
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    const onData = (key) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        
        if (key === '\u0003') { // Ctrl+C
          console.log('\n👋 用户取消操作');
          process.exit(0);
        }
        
        console.log("\n🎯 继续执行后续流程...");
        resolve(true);
      }
    };
    
    process.stdin.on('data', onData);
  });
}

/**
 * 检查手动下载的图片并按时间重命名
 * @param {string} name - 项目名称
 * @param {string} sortOrder - 排序方式: 'asc' (正序，最早的在前) 或 'desc' (倒序，最晚的在前)
 */
export async function checkManualDownloadedImages(name, sortOrder = 'asc') {
  const imagesDir = path.join("output", name, "images");
  
  try {
    const files = await fs.readdir(imagesDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file) && 
      !file.includes("_original") &&
      !file.includes("_upscaled") &&
      !file.startsWith("image_") // 排除已经重命名的文件
    );
    
    console.log(`📁 检查到 ${imageFiles.length} 张手动下载的图片:`);
    
    if (imageFiles.length > 0) {
      // 按文件修改时间排序
      const filesWithStats = [];
      for (const file of imageFiles) {
        const filePath = path.join(imagesDir, file);
        const stats = await fs.stat(filePath);
        filesWithStats.push({
          name: file,
          path: filePath,
          mtime: stats.mtime
        });
      }
      
      // 按修改时间排序
      if (sortOrder === 'desc') {
        // 倒序：最晚下载的在前
        filesWithStats.sort((a, b) => b.mtime - a.mtime);
        console.log(`🔽 按下载时间倒序排列 (最晚下载的对应第一个镜头)`);
      } else {
        // 正序：最早下载的在前（默认）
        filesWithStats.sort((a, b) => a.mtime - b.mtime);
        console.log(`🔼 按下载时间正序排列 (最早下载的对应第一个镜头)`);
      }
      
      console.log("🔄 开始按下载时间重命名图片...");
      
      // 重命名文件
      for (let i = 0; i < filesWithStats.length; i++) {
        const fileInfo = filesWithStats[i];
        const ext = path.extname(fileInfo.name);
        const newName = `image_${i + 1}${ext}`;
        const newPath = path.join(imagesDir, newName);
        
        try {
          await fs.rename(fileInfo.path, newPath);
          console.log(`   ✅ ${fileInfo.name} -> ${newName}`);
        } catch (error) {
          console.warn(`   ⚠️ 重命名失败: ${fileInfo.name} - ${error.message}`);
        }
      }
      
      console.log(`✅ 图片重命名完成，共处理 ${filesWithStats.length} 张图片`);
    }
    
    // 重新检查重命名后的图片数量
    const finalFiles = await fs.readdir(imagesDir);
    const finalImageFiles = finalFiles.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file) && 
      !file.includes("_original") &&
      !file.includes("_upscaled")
    );
    
    console.log(`📊 最终图片数量: ${finalImageFiles.length} 张`);
    finalImageFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    
    return finalImageFiles.length;
  } catch (error) {
    console.warn(`⚠️ 检查图片目录失败: ${error.message}`);
    return 0;
  }
}

/**
 * 显示手动下载指南
 */
export function showManualDownloadGuide() {
  console.log("\n📖 手动下载指南:");
  console.log("=" .repeat(50));
  console.log("1. 在浏览器中查看生成的图片");
  console.log("2. 右键点击每张图片");
  console.log("3. 选择 '图片另存为' 或 'Save image as'");
  console.log("4. 保存到指定的 images 目录");
  console.log("5. 按顺序命名: image_1.jpg, image_2.jpg, ...");
  console.log("6. 完成后在终端按 Enter 键继续");
  console.log("=" .repeat(50) + "\n");
}

export default {
  waitForManualDownload,
  checkManualDownloadedImages,
  showManualDownloadGuide
};
