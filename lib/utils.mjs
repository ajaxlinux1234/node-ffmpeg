import fs from 'fs/promises';
import path from 'path';

/**
 * 获取 Chrome 浏览器路径
 */
export function getChromePath() {
  const platform = process.platform;

  if (platform === "darwin") {
    // macOS
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  } else if (platform === "win32") {
    // Windows
    return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  } else {
    // Linux
    return "/usr/bin/google-chrome";
  }
}

/**
 * 清理 output 目录下的历史数据
 * @param {boolean} enabled - 是否启用清理功能，默认为 true
 * @param {string} outputDir - output 目录路径，默认为 'output'
 */
export async function cleanOutputHistory(enabled = true, outputDir = 'output') {
  if (!enabled) {
    console.log('🔧 Output历史数据清理已禁用');
    return;
  }

  try {
    const outputPath = path.resolve(outputDir);
    
    // 检查 output 目录是否存在
    try {
      await fs.access(outputPath);
    } catch (error) {
      // output 目录不存在，无需清理
      console.log('📁 Output目录不存在，跳过清理');
      return;
    }

    // 获取 output 目录下的所有子目录和文件
    const items = await fs.readdir(outputPath, { withFileTypes: true });
    
    if (items.length === 0) {
      console.log('📁 Output目录为空，无需清理');
      return;
    }

    console.log('🧹 开始清理output历史数据...');
    let cleanedCount = 0;
    let totalSize = 0;

    for (const item of items) {
      const itemPath = path.join(outputPath, item.name);
      
      try {
        if (item.isDirectory()) {
          // 递归计算目录大小
          const dirSize = await getDirSize(itemPath);
          totalSize += dirSize;
          
          // 删除目录及其内容
          await fs.rm(itemPath, { recursive: true, force: true });
          console.log(`  ✅ 删除目录: ${item.name} (${formatFileSize(dirSize)})`);
        } else {
          // 获取文件大小
          const stats = await fs.stat(itemPath);
          totalSize += stats.size;
          
          // 删除文件
          await fs.unlink(itemPath);
          console.log(`  ✅ 删除文件: ${item.name} (${formatFileSize(stats.size)})`);
        }
        cleanedCount++;
      } catch (error) {
        console.warn(`  ⚠️ 无法删除 ${item.name}: ${error.message}`);
      }
    }

    if (cleanedCount > 0) {
      console.log(`🎉 清理完成！删除了 ${cleanedCount} 个项目，释放空间 ${formatFileSize(totalSize)}`);
    } else {
      console.log('📁 没有需要清理的项目');
    }
  } catch (error) {
    console.warn(`⚠️ 清理output历史数据时出错: ${error.message}`);
  }
}

/**
 * 递归计算目录大小
 * @param {string} dirPath - 目录路径
 * @returns {Promise<number>} 目录大小（字节）
 */
async function getDirSize(dirPath) {
  let totalSize = 0;
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        totalSize += await getDirSize(itemPath);
      } else {
        const stats = await fs.stat(itemPath);
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // 忽略权限错误等
  }
  
  return totalSize;
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小字符串
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
