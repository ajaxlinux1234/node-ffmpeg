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
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execFilePromise = promisify(execFile);

    try {
      const { stdout } = await execFilePromise(
        "npx",
        ["prettier", configPath],
        {
          shell: true,
        }
      );

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
 * 更新 jimeng-video-config.mjs 中的 name 常量
 * @param {string} name - 项目名称
 */
async function updateJimengVideoConfigName(name) {
  const jimengConfigPath = "lib/auto-deepseek-jimeng/jimeng-video-config.mjs";

  try {
    console.log(`📝 正在更新 jimeng-video-config.mjs 的 name 常量为: ${name}`);

    let content = await fs.readFile(jimengConfigPath, "utf-8");

    // 替换 name 常量
    const nameRegex = /export const name = "[^"]*";/;
    content = content.replace(nameRegex, `export const name = "${name}";`);

    await fs.writeFile(jimengConfigPath, content, "utf-8");

    // 使用 prettier 格式化
    await formatConfigFile(jimengConfigPath, false);

    console.log(`✅ jimeng-video-config.mjs 的 name 已更新为: ${name}`);
  } catch (error) {
    throw new Error(`更新 jimeng-video-config.mjs 失败: ${error.message}`);
  }
}

/**
 * 更新项目中所有 historyNum 变量
 * @param {number} num - 历史记录数量
 */
async function updateHistoryNum(num) {
  const filesToUpdate = [
    "config.mjs",
    "lib/auto-deepseek-jimeng/deepseek-config.mjs",
    "lib/auto-deepseek-jimeng/promot/storytelling-constants.mjs",
    "lib/auto-deepseek-jimeng/promot/person-constants.mjs",
  ];

  console.log(`📝 正在更新 historyNum 为: ${num}`);

  for (const filePath of filesToUpdate) {
    try {
      let content = await fs.readFile(filePath, "utf-8");

      // 替换所有 historyNum 的值
      // 匹配 const historyNum = 数字; 或 const historyNum = 数字 (带注释)
      const historyNumRegex = /const historyNum = \d+;?/g;
      content = content.replace(historyNumRegex, `const historyNum = ${num};`);

      await fs.writeFile(filePath, content, "utf-8");

      // 使用 prettier 格式化
      await formatConfigFile(filePath, false);

      console.log(`   ✅ 已更新: ${filePath}`);
    } catch (error) {
      console.warn(`   ⚠️  更新 ${filePath} 失败: ${error.message}`);
    }
  }

  console.log(`✅ 所有文件的 historyNum 已更新为: ${num}`);
}

/**
 * 运行 merge-options 流程
 * @param {Object} config - 配置对象
 * @param {Object} options - 命令行选项
 */
export async function runMergeOptions(config, options = {}) {
  const totalSteps = 5;
  let currentStep = 0;

  try {
    // 步骤 1: 读取 processed_data.json
    currentStep++;
    showProgress(currentStep, totalSteps, "读取 processed_data.json 配置文件");

    // 命令行参数 --name 优先级高于配置文件
    const name = options.name || config.name;
    const { highQuality = true } = config; // 默认启用高质量模式

    if (!name) {
      throw new Error("配置中缺少 name 字段，或未通过 --name 参数指定");
    }

    console.log(
      `📝 使用项目名称: ${name}${options.name ? " (来自命令行参数)" : " (来自配置文件)"}`
    );

    // 显示质量模式
    console.log(`\n🎨 高质量模式: ${highQuality ? "已启用" : "已禁用"}`);
    if (highQuality) {
      console.log(`   - 在GPU/内存允许下最大化视频质量`);
      console.log(`   - 使用更低的CRF值 (10-18) 以获得更好的画质`);
      console.log(`   - 使用更慢的编码预设以优化压缩效率`);
      console.log(`   - 启用高级编码优化参数\n`);
    } else {
      console.log(`   - 使用标准质量设置以平衡速度和质量\n`);
    }

    // 处理 --name 参数：更新 jimeng-video-config.mjs
    if (options.name) {
      console.log(`\n🔧 检测到 --name 参数，更新 jimeng-video-config.mjs...`);
      await updateJimengVideoConfigName(options.name);
    }

    // 处理 --num 参数：更新所有 historyNum
    if (options.num) {
      console.log(`\n🔧 检测到 --num 参数，更新所有 historyNum...`);
      await updateHistoryNum(options.num);
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

    // 处理 videoReplaceUrls（如果存在）
    // 注意：这里只是将配置传递给 merge-video，实际替换在 merge-video 中进行
    let finalUrls = processedData.urls;
    let videoReplaceConfig = null;

    if (
      processedData.videoReplaceUrls &&
      Array.isArray(processedData.videoReplaceUrls)
    ) {
      console.log(`\n🔄 检测到 videoReplaceUrls，准备替换视频片段...`);
      console.log(`   - 原始视频数量: ${processedData.urls.length}`);
      console.log(
        `   - 替换片段数量: ${processedData.videoReplaceUrls.length}`
      );

      // 验证配置格式
      const validReplacements = [];
      for (let i = 0; i < processedData.videoReplaceUrls.length; i++) {
        const replaceItem = processedData.videoReplaceUrls[i];
        const { url, timeRange } = replaceItem;

        if (
          !url ||
          !timeRange ||
          !Array.isArray(timeRange) ||
          timeRange.length !== 2
        ) {
          console.warn(`   ⚠️  替换项 ${i + 1} 格式错误，跳过`);
          continue;
        }

        if (timeRange[0] < 0 || timeRange[1] <= timeRange[0]) {
          console.warn(`   ⚠️  替换项 ${i + 1} 的时间范围无效，跳过`);
          continue;
        }

        validReplacements.push(replaceItem);
        console.log(
          `   ✅ 将替换合并后视频的 ${timeRange[0]}s-${timeRange[1]}s 片段`
        );
      }

      if (validReplacements.length > 0) {
        videoReplaceConfig = validReplacements;
        console.log(`✅ 视频替换配置完成\n`);
      }
    }

    await updateConfigFile(configPath, (content) => {
      // 更新 merge-video 配置，保留现有属性
      const mergeVideoRegex = /"merge-video":\s*\{([\s\S]*?)\},\s*(?=")/;
      const match = content.match(mergeVideoRegex);

      if (!match) {
        throw new Error("未找到 merge-video 配置块");
      }

      const existingConfig = match[1];

      // 提取现有的配置属性（除了 urls 和 videoReplaceUrls）
      const preservedProperties = [];

      // 保留 useCacheVideo 属性
      const useCacheVideoMatch = existingConfig.match(
        /useCacheVideo:\s*(true|false)/
      );
      if (useCacheVideoMatch) {
        preservedProperties.push(`useCacheVideo: ${useCacheVideoMatch[1]}`);
        console.log(`✅ 保留 useCacheVideo: ${useCacheVideoMatch[1]}`);
      }

      // 保留其他可能的属性（除了 urls, videoReplaceUrls, switch）
      const propertiesToPreserve = [
        "enableSpeedOptimization",
        "qualityMode",
        "skipTempCleanup",
        "threads",
        "enableGPU",
      ];

      for (const prop of propertiesToPreserve) {
        const propRegex = new RegExp(`${prop}:\\s*([^,\\n}]+)`);
        const propMatch = existingConfig.match(propRegex);
        if (propMatch) {
          preservedProperties.push(`${prop}: ${propMatch[1].trim()}`);
          console.log(`✅ 保留 ${prop}: ${propMatch[1].trim()}`);
        }
      }

      // 保留 switch 属性
      const switchMatch = existingConfig.match(/switch:\s*"([^"]*)"/);
      const switchValue = switchMatch ? switchMatch[1] : "无转场";
      preservedProperties.push(`switch: "${switchValue}"`);

      // 构建新的配置
      const urlsArray = JSON.stringify(finalUrls, null, 6).replace(
        /\n/g,
        "\n      "
      );

      let newMergeVideoConfig = `"merge-video": {\n    urls: ${urlsArray},`;

      // 如果有 videoReplaceConfig，添加到配置中
      if (videoReplaceConfig) {
        const replaceConfigStr = JSON.stringify(
          videoReplaceConfig,
          null,
          6
        ).replace(/\n/g, "\n      ");
        newMergeVideoConfig += `\n    videoReplaceUrls: ${replaceConfigStr},`;
      }

      // 添加保留的属性
      for (const prop of preservedProperties) {
        newMergeVideoConfig += `\n    ${prop},`;
      }

      newMergeVideoConfig += `\n  },`;

      content = content.replace(mergeVideoRegex, newMergeVideoConfig);

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

    // 更新 url、title 和 sectionTitle
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

        // 更新 sectionTitle - 从 processed_data.json 的 segments 中提取
        if (processedData.segments && Array.isArray(processedData.segments)) {
          const sectionTitles = processedData.segments.map(
            (segment) => segment.title
          );

          // 生成新的 sectionTitle 数组字符串
          const sectionTitleStr = sectionTitles
            .map((title) => `      "${title.replace(/\n/g, "\\n")}"`)
            .join(",\n");
          const newSectionTitleBlock = `sectionTitle: [\n${sectionTitleStr},\n    ],`;

          // 替换 sectionTitle 配置
          const sectionTitleRegex = /sectionTitle:\s*\[[\s\S]*?\],/;
          if (sectionTitleRegex.test(content)) {
            content = content.replace(sectionTitleRegex, newSectionTitleBlock);
            console.log(
              `✅ 已更新 sectionTitle (${sectionTitles.length} 个标题)`
            );
          }
        }

        return content;
      },
      false // 需要格式化
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
  2. 处理 videoReplaceUrls（如果存在）- 替换指定视频片段
  3. 更新 merge-video 配置并执行视频合并
  4. 更新 history-person 配置（包括 sectionTitle）并生成最终视频
  5. 将最终视频移动到 outputUtils 目录并重命名

配置示例 (config.mjs):

"merge-options": {
  name: "20251128-亚历山大二世",  // 对应 output/{name}/processed_data.json
  highQuality: true  // 默认true，在GPU/内存允许下最大化视频质量
}

processed_data.json 示例:

{
  "name": "项目名称",
  "urls": ["video1.mp4", "video2.mp4", "video3.mp4"],
  "videoReplaceUrls": [  // 可选：替换指定视频片段
    {
      "index": 1,  // 替换第2个视频（索引从0开始）
      "url": "replacement.mp4",  // 替换视频URL
      "timeRange": [10, 20]  // 使用10-20秒的片段
    }
  ],
  "title": "视频标题",
  "segments": [...]
}

使用方法:
  npx node-ffmpeg-tools merge-options                    # 使用配置文件中的 name
  npx node-ffmpeg-tools merge-options --name "项目名称"   # 使用命令行指定的 name（优先级更高）
  npx node-ffmpeg-tools merge-options --num 11           # 更新所有 historyNum 为 11
  npx node-ffmpeg-tools merge-options --name "项目名称" --num 11  # 同时指定 name 和更新 historyNum
  npx node-ffmpeg-tools merge-options --help             # 显示帮助信息

命令行选项:
  --name, -n <项目名称>    指定项目名称（优先级高于配置文件）
                          同时会更新 jimeng-video-config.mjs 中的 name 常量
  --num <数量>             更新项目中所有 historyNum 变量的值
  --help, -h               显示帮助信息

注意事项:
  • 确保 output/{name}/processed_data.json 文件存在
  • processed_data.json 必须包含 urls 和 title 字段
  • 流程会自动更新 config.mjs 文件（包括 sectionTitle）
  • 最终视频会保存到 outputUtils/{name}.mp4
  • --name 参数优先级高于配置文件中的 name
  • --name 参数会同时更新 lib/auto-deepseek-jimeng/jimeng-video-config.mjs
  • --num 参数会更新以下文件中的 historyNum:
    - config.mjs
    - lib/auto-deepseek-jimeng/deepseek-config.mjs
    - lib/auto-deepseek-jimeng/promot/storytelling-constants.mjs
    - lib/auto-deepseek-jimeng/promot/person-constants.mjs
  • videoReplaceUrls 功能详见: docs/VIDEO_REPLACE_EXAMPLE.md
  • 高质量模式 (highQuality: true) 默认启用:
    - 使用更低的CRF值 (10-18) 获得更好画质
    - 使用更慢的编码预设 (veryslow/p7) 优化压缩
    - 启用高级编码参数 (lookahead, b-frames, 等)
    - 需要更多GPU内存和处理时间
    - 如需快速处理可设置 highQuality: false
`);
}

export default runMergeOptions;
