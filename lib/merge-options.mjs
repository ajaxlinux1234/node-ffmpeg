#!/usr/bin/env node
import "zx/globals";
import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";

/**
 * 执行子命令并显示进度
 * @param {string} command - 命令名称
 * @param {string} description - 命令描述
 * @returns {Promise<string>} - 返回输出内容
 */
async function executeCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚀 ${description}`);
    console.log(`${"=".repeat(60)}\n`);

    const child = spawn("npx", ["node-ffmpeg-tools", command], {
      stdio: "inherit",
      shell: true,
    });

    let output = "";

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`\n✅ ${description} - 完成\n`);
        resolve(output);
      } else {
        reject(new Error(`${description} 失败，退出码: ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(new Error(`执行 ${command} 时出错: ${error.message}`));
    });
  });
}

/**
 * 查找最新生成的视频文件
 * @param {string} dir - 目录路径
 * @param {string} pattern - 文件名模式
 * @returns {Promise<string|null>} - 返回文件路径或null
 */
async function findLatestVideo(dir, pattern = "_processed") {
  try {
    const files = await fs.readdir(dir);
    const videoFiles = files
      .filter((file) => file.includes(pattern) && file.endsWith(".mp4"))
      .map((file) => path.join(dir, file));

    if (videoFiles.length === 0) {
      return null;
    }

    // 获取文件的修改时间并排序
    const filesWithStats = await Promise.all(
      videoFiles.map(async (file) => {
        const stats = await fs.stat(file);
        return { file, mtime: stats.mtime };
      })
    );

    filesWithStats.sort((a, b) => b.mtime - a.mtime);
    return filesWithStats[0].file;
  } catch (error) {
    console.error(`查找视频文件失败: ${error.message}`);
    return null;
  }
}

/**
 * 查找 merge-video 输出的视频
 * @returns {Promise<string|null>}
 */
async function findMergeVideoOutput() {
  const mergeVideoDir = "output/merge-video";
  try {
    const files = await fs.readdir(mergeVideoDir);
    const videoFiles = files
      .filter((file) => file.startsWith("merged_") && file.endsWith(".mp4"))
      .map((file) => path.join(mergeVideoDir, file));

    if (videoFiles.length === 0) {
      return null;
    }

    // 获取最新的文件
    const filesWithStats = await Promise.all(
      videoFiles.map(async (file) => {
        const stats = await fs.stat(file);
        return { file, mtime: stats.mtime };
      })
    );

    filesWithStats.sort((a, b) => b.mtime - a.mtime);
    return filesWithStats[0].file;
  } catch (error) {
    console.error(`查找 merge-video 输出失败: ${error.message}`);
    return null;
  }
}

/**
 * 格式化配置文件
 * @param {string} configPath - 配置文件路径
 * @param {boolean} skipFormat - 是否跳过格式化
 */
async function formatConfigFile(configPath, skipFormat = false) {
  if (skipFormat) {
    console.log(`⏭️  跳过格式化配置文件`);
    return;
  }

  try {
    console.log(`🎨 正在格式化配置文件...`);
    
    // 运行 prettier 格式化
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFilePromise = promisify(execFile);
    
    try {
      const { stdout } = await execFilePromise('npx', ['prettier', configPath], {
        shell: true,
      });
      
      // 将格式化后的内容写回文件
      await fs.writeFile(configPath, stdout, "utf-8");
      console.log(`✅ 配置文件已格式化: ${configPath}`);
    } catch (error) {
      console.warn(`⚠️  Prettier 格式化失败，跳过格式化: ${error.message}`);
    }
  } catch (error) {
    console.warn(`⚠️  格式化配置文件失败: ${error.message}`);
  }
}

/**
 * 更新配置文件
 * @param {string} configPath - 配置文件路径
 * @param {Function} updateFn - 更新函数
 * @param {boolean} skipFormat - 是否跳过格式化
 */
async function updateConfigFile(configPath, updateFn, skipFormat = false) {
  try {
    let configContent = await fs.readFile(configPath, "utf-8");
    configContent = updateFn(configContent);
    await fs.writeFile(configPath, configContent, "utf-8");
    console.log(`✅ 配置文件已更新: ${configPath}`);
    
    // 格式化配置文件
    await formatConfigFile(configPath, skipFormat);
  } catch (error) {
    throw new Error(`更新配置文件失败: ${error.message}`);
  }
}

/**
 * 显示进度条
 * @param {number} current - 当前步骤
 * @param {number} total - 总步骤数
 * @param {string} description - 描述
 */
function showProgress(current, total, description) {
  const percentage = Math.floor((current / total) * 100);
  const barLength = 40;
  const filledLength = Math.floor((current / total) * barLength);
  const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 总体进度: [${bar}] ${percentage}%`);
  console.log(`📝 步骤 ${current}/${total}: ${description}`);
  console.log(`${"=".repeat(60)}\n`);
}

/**
 * 运行 merge-options 流程
 * @param {Object} config - 配置对象
 */
export async function runMergeOptions(config) {
  const totalSteps = 5;
  let currentStep = 0;

  try {
    // 步骤 1: 读取 processed_data.json
    currentStep++;
    showProgress(currentStep, totalSteps, "读取 processed_data.json 配置文件");

    const { name } = config;
    if (!name) {
      throw new Error("配置中缺少 name 字段");
    }

    const processedDataPath = path.join("output", name, "processed_data.json");
    console.log(`📂 读取文件: ${processedDataPath}`);

    let processedData;
    try {
      const data = await fs.readFile(processedDataPath, "utf-8");
      processedData = JSON.parse(data);
      console.log(`✅ 成功读取配置文件`);
      console.log(`   - 视频数量: ${processedData.urls?.length || 0}`);
      console.log(`   - 标题: ${processedData.title || "无"}`);
    } catch (error) {
      throw new Error(
        `无法读取 processed_data.json: ${error.message}\n请确保文件存在: ${processedDataPath}`
      );
    }

    // 步骤 2: 更新 config.mjs 中的 merge-video 配置
    currentStep++;
    showProgress(currentStep, totalSteps, "更新 merge-video 配置");

    const configPath = "config.mjs";
    await updateConfigFile(configPath, (content) => {
      // 删除旧的 urls 配置
      const mergeVideoRegex =
        /"merge-video":\s*\{[\s\S]*?urls:\s*\[[\s\S]*?\],/;
      const match = content.match(mergeVideoRegex);

      if (match) {
        const urlsArray = JSON.stringify(processedData.urls, null, 6).replace(
          /\n/g,
          "\n      "
        );
        const newMergeVideoConfig = `"merge-video": {\n    urls: ${urlsArray},`;
        content = content.replace(mergeVideoRegex, newMergeVideoConfig);
      }

      return content;
    });

    // 步骤 3: 运行 merge-video 命令
    currentStep++;
    showProgress(currentStep, totalSteps, "合并视频 (merge-video)");

    await executeCommand("merge-video", "执行视频合并");

    // 查找 merge-video 输出的视频
    const mergedVideoPath = await findMergeVideoOutput();
    if (!mergedVideoPath) {
      throw new Error("未找到 merge-video 输出的视频文件");
    }
    console.log(`✅ 找到合并后的视频: ${mergedVideoPath}`);

    // 步骤 4: 更新 history-person 配置并运行
    currentStep++;
    showProgress(
      currentStep,
      totalSteps,
      "更新 history-person 配置并生成最终视频"
    );

    // 更新 url 和 title（直接使用原始值，保持 | 符号不变）
    await updateConfigFile(
      configPath,
      (content) => {
        // 更新 url - 使用正斜杠（跨平台兼容）
        const urlRegex = /("history-person":\s*\{[\s\S]*?url:\s*")[^"]*(")/;
        const escapedVideoPath = mergedVideoPath.replace(/\\/g, "/");
        content = content.replace(urlRegex, `$1${escapedVideoPath}$2`);

        // 更新 title - 直接使用原始值，不替换 | 符号
        const titleRegex = /("history-person":\s*\{[\s\S]*?title:\s*`)[^`]*(`)/;
        const titleValue = processedData.title || "";

        content = content.replace(titleRegex, `$1${titleValue}$2`);

        return content;
      },
      true // 跳过格式化，保持原始格式
    );

    await executeCommand("history-person", "生成历史人物视频");

    // 步骤 5: 移动最终视频到 outputUtils 目录
    currentStep++;
    showProgress(currentStep, totalSteps, "移动最终视频到 outputUtils 目录");

    const historyPersonDir = "output/history-person";
    const finalVideo = await findLatestVideo(historyPersonDir, "_processed");

    if (!finalVideo) {
      throw new Error("未找到 history-person 输出的最终视频");
    }

    console.log(`📹 找到最终视频: ${finalVideo}`);

    // 创建 outputUtils 目录
    const outputUtilsDir = "outputUtils";
    await fs.mkdir(outputUtilsDir, { recursive: true });

    // 移动并重命名视频
    const ext = path.extname(finalVideo);
    const destPath = path.join(outputUtilsDir, `${name}${ext}`);

    // 如果目标文件已存在，先删除
    try {
      await fs.access(destPath);
      await fs.unlink(destPath);
      console.log(`🗑️  删除已存在的文件: ${destPath}`);
    } catch (error) {
      // 文件不存在，忽略错误
    }

    await fs.rename(finalVideo, destPath);
    console.log(`✅ 视频已移动到: ${destPath}`);

    // 完成
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎉 merge-options 流程执行完成！`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📁 最终输出: ${destPath}`);
    console.log(`📊 视频信息:`);
    console.log(`   - 名称: ${name}`);
    console.log(`   - 标题: ${processedData.title || "无"}`);
    console.log(`   - 片段数: ${processedData.segments?.length || 0}`);
    console.log(`${"=".repeat(60)}\n`);
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}\n`);
    throw error;
  }
}

/**
 * 显示帮助信息
 */
export function showMergeOptionsHelp() {
  console.log(`
📹 merge-options - 自动化视频处理流程

功能说明:
  1. 读取 processed_data.json 配置文件
  2. 更新 merge-video 配置并执行视频合并
  3. 更新 history-person 配置并生成最终视频
  4. 将最终视频移动到 outputUtils 目录并重命名

配置示例 (config.mjs):

"merge-options": {
  name: "20251128-亚历山大二世"  // 对应 output/{name}/processed_data.json
}

使用方法:
  npx node-ffmpeg-tools merge-options      # 使用配置文件
  npx node-ffmpeg-tools merge-options --help  # 显示帮助信息

注意事项:
  • 确保 output/{name}/processed_data.json 文件存在
  • processed_data.json 必须包含 urls 和 title 字段
  • 流程会自动更新 config.mjs 文件
  • 最终视频会保存到 outputUtils/{name}.mp4
`);
}

export default runMergeOptions;
