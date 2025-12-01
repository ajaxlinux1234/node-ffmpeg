import "zx/globals";
import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";

// 配置常量
const CONFIG = {
  DEFAULT_WAIT_TIME: 60000, // 60秒
  DEFAULT_SEND_WAIT_TIME: 20000, // 20秒
  DEFAULT_GENERATE_WAIT_TIME: 30000, // 30秒
  DEFAULT_SHOT:
    "运镜方式：镜头跟随图中主要人物，图中人物从当前场景走到下一个场景，人物变换为下一场景的主要人物，动态转换流畅自然",
  BROWSER_DATA_DIR: "browser-data/get-promot-profile",
};

/**
 * 询问用户是否继续执行
 */
async function askUserToContinue(stepName, timeoutSeconds = 60) {
  console.log(`\n🤔 即将执行: ${stepName}`);
  console.log(
    `请输入 'y' 继续，'n' 中断，或在 ${timeoutSeconds} 秒内无操作将自动继续...`
  );

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log(`⏰ ${timeoutSeconds}秒超时，自动继续执行...`);
      resolve(true);
    }, timeoutSeconds * 1000);

    process.stdin.once("data", (data) => {
      clearTimeout(timeout);
      const input = data.toString().trim().toLowerCase();
      if (input === "n") {
        console.log("❌ 用户选择中断执行");
        resolve(false);
      } else {
        console.log("✅ 继续执行...");
        resolve(true);
      }
    });
  });
}

/**
 * 检查是否已有完整的数据文件（包含标题和提示词）
 */
async function checkExistingData(outputDir) {
  try {
    const jsonPath = path.join(outputDir, "processed_data.json");
    await fs.access(jsonPath);

    // 读取并验证数据文件
    const data = JSON.parse(await fs.readFile(jsonPath, "utf8"));
    if (data.segments && data.segments.length > 0) {
      const validTitles = data.segments.filter(
        (s) => s.title && s.title.trim()
      );
      const validPrompts = data.segments.filter(
        (s) => s.prompt && s.prompt.trim()
      );

      console.log(`\n📊 发现已有数据:`);
      console.log(`   标题: ${validTitles.length}/${data.segments.length} 个`);
      console.log(
        `   提示词: ${validPrompts.length}/${data.segments.length} 个`
      );

      // 只有标题和提示词都完整才算完成
      return (
        validTitles.length === data.segments.length &&
        validPrompts.length === data.segments.length
      );
    }
    return false;
  } catch (error) {
    console.log(`\n📊 未发现有效数据文件: ${error.message}`);
    return false;
  }
}

/**
 * 检查segments中是否有有效的标题数据
 */
async function checkExistingTitles(outputDir) {
  try {
    const jsonPath = path.join(outputDir, "processed_data.json");
    await fs.access(jsonPath);

    const data = JSON.parse(await fs.readFile(jsonPath, "utf8"));
    if (data.segments && data.segments.length > 0) {
      const validTitles = data.segments.filter(
        (s) => s.title && s.title.trim()
      );
      return validTitles.length === data.segments.length;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 检查segments中是否有有效的提示词数据
 */
async function checkExistingPrompts(outputDir) {
  try {
    const jsonPath = path.join(outputDir, "processed_data.json");
    await fs.access(jsonPath);

    const data = JSON.parse(await fs.readFile(jsonPath, "utf8"));
    if (data.segments && data.segments.length > 0) {
      const validPrompts = data.segments.filter(
        (s) => s.prompt && s.prompt.trim()
      );
      return validPrompts.length === data.segments.length;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 检查是否已有所有视频帧
 */
async function checkExistingFrames(outputDir, seconds) {
  try {
    let allFramesExist = true;

    for (let i = 0; i < seconds.length; i++) {
      const second = seconds[i];
      const frameFile = path.join(outputDir, `frame_${i + 1}_${second}s.png`);

      try {
        await fs.access(frameFile);
      } catch (error) {
        allFramesExist = false;
        break;
      }
    }

    if (allFramesExist) {
      console.log(`\n✅ 检测到所有 ${seconds.length} 个视频帧已存在`);
    }

    return allFramesExist;
  } catch (error) {
    return false;
  }
}

/**
 * 步骤1: 创建输出目录
 */
async function createOutputDirectory(videoName) {
  console.log(`\n📁 [步骤1] 创建输出目录: ${videoName}`);

  const outputDir = path.join(process.cwd(), "output", videoName);

  try {
    // 检查目录是否存在
    await fs.access(outputDir);
    console.log(`📂 输出目录已存在: ${outputDir}`);
  } catch (error) {
    // 目录不存在，创建新目录
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`✅ 已创建输出目录: ${outputDir}`);
  }

  return outputDir;
}

/**
 * 步骤2: 提取视频帧
 */
async function extractVideoFrames(videoPath, seconds, outputDir) {
  console.log(`\n🎬 [步骤2] 提取视频帧`);
  console.log(`视频路径: ${videoPath}`);
  console.log(`提取时间点: ${seconds.join(", ")} 秒`);

  const frameFiles = [];
  let existingFrames = 0;
  let newFrames = 0;

  for (let i = 0; i < seconds.length; i++) {
    const second = seconds[i];
    const frameFile = path.join(outputDir, `frame_${i + 1}_${second}s.png`);

    try {
      // 检查帧图片是否已存在
      await fs.access(frameFile);
      console.log(
        `📸 第 ${i + 1} 帧已存在，跳过提取: ${path.basename(frameFile)}`
      );
      frameFiles.push(frameFile);
      existingFrames++;
    } catch (error) {
      // 文件不存在，需要提取
      console.log(`📸 提取第 ${i + 1} 帧 (${second}秒)...`);

      const ffmpegCmd = [
        "ffmpeg",
        "-i",
        `"${videoPath}"`,
        "-ss",
        second.toString(),
        "-vframes",
        "1",
        "-y",
        `"${frameFile}"`,
      ].join(" ");

      try {
        execSync(ffmpegCmd, { stdio: "inherit" });
        frameFiles.push(frameFile);
        newFrames++;
        console.log(`✅ 帧提取完成: ${frameFile}`);
      } catch (extractError) {
        console.error(`❌ 提取第 ${i + 1} 帧失败:`, extractError.message);
        throw extractError;
      }
    }
  }

  console.log(`\n📊 视频帧提取统计:`);
  console.log(`   已存在的帧: ${existingFrames}`);
  console.log(`   新提取的帧: ${newFrames}`);
  console.log(`   总帧数: ${frameFiles.length}`);

  return frameFiles;
}

/**
 * 豆包AI图片内容识别
 */
async function doubaoImageRecognition(frameFiles, config) {
  console.log(`\n🎨 [步骤3] 豆包AI图片内容识别`);

  const userDataDir = path.join(process.cwd(), CONFIG.BROWSER_DATA_DIR);
  await fs.mkdir(userDataDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized", "--no-first-run", "--no-default-browser-check"],
    userDataDir: userDataDir,
  });

  const page = await browser.newPage();
  await page.goto(config.get_title_path);

  // 检查登录状态
  console.log(`🔍 检查登录状态...`);
  await page.waitForTimeout(config.pageLoadWaitTime);

  const needLogin = await page.evaluate(() => {
    return (
      document.querySelector('input[type="password"]') !== null ||
      document.querySelector('button[class*="login"]') !== null ||
      document.body.innerText.includes("登录") ||
      document.body.innerText.includes("注册")
    );
  });

  if (needLogin) {
    console.log("🔐 检测到需要登录，请手动完成登录...");
    console.log(`⏰ 等待${config.waitTime / 1000}秒供用户登录...`);
    await page.waitForTimeout(config.waitTime);
  } else {
    console.log("✅ 已登录状态");
  }

  const extractedTitles = [];

  // 检查是否直接获取已有结果
  if (config.get_title) {
    console.log(`\n📋 直接获取页面已有结果 (get_title=true)`);
    try {
      const results = await page.evaluate(
        (num, selectorFnStr) => {
          const selectorFn = eval(`(${selectorFnStr})`);
          return selectorFn(num);
        },
        frameFiles.length,
        config.get_title_selector_fn.toString()
      );

      if (Array.isArray(results)) {
        extractedTitles.push(...results);
        console.log(`✅ 获取到 ${results.length} 个结果`);
        results.forEach((result, index) => {
          console.log(
            `   第 ${index + 1} 个: "${result?.substring(0, 50)}${result?.length > 50 ? "..." : ""}"`
          );
        });
      } else {
        console.log(`⚠️ 获取结果格式不正确，期望数组，实际: ${typeof results}`);
        // 填充空结果
        for (let i = 0; i < frameFiles.length; i++) {
          extractedTitles.push("");
        }
      }
    } catch (error) {
      console.error(`❌ 获取已有结果失败:`, error.message);
      // 填充空结果
      for (let i = 0; i < frameFiles.length; i++) {
        extractedTitles.push("");
      }
    }

    // 关闭浏览器
    console.log(`\n🔄 关闭浏览器...`);
    await browser.close();

    return extractedTitles;
  }

  // 原有的上传图片流程
  console.log(`\n📤 开始上传图片并获取标题 (get_title=false)`);

  // 逐个上传图片并获取识别结果
  for (let i = 0; i < frameFiles.length; i++) {
    const frameFile = frameFiles[i];
    console.log(
      `\n📸 处理第 ${i + 1}/${frameFiles.length} 张图片: ${path.basename(frameFile)}`
    );

    try {
      // 步骤1: 点击上传按钮
      const uploadButton = await page.evaluateHandle(
        config.img_upload_selector_fn
      );

      if (uploadButton) {
        await uploadButton.click();
        console.log(`🎯 点击上传按钮完成`);

        // 等待上传面板出现
        await page.waitForTimeout(1000);

        // 步骤2: 模拟人工选择文件上传区域
        const fileUploadArea = await page.evaluateHandle(config.file_upload);

        if (fileUploadArea) {
          const [fileChooser] = await Promise.all([
            page.waitForFileChooser({ timeout: 10000 }),
            fileUploadArea.click(),
          ]);

          await fileChooser.accept([frameFile]);
          console.log(`✅ 图片上传完成`);

          // 等待上传完成
          await page.waitForTimeout(config.uploadWaitTime);
        } else {
          console.log(`⚠️ 未找到文件上传区域，跳过第 ${i + 1} 张图片`);
          continue;
        }
      } else {
        console.log(`⚠️ 未找到上传按钮，跳过第 ${i + 1} 张图片`);
        continue;
      }

      // 输入识别提示词 - 增强版本
      let inputSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!inputSuccess && retryCount < maxRetries) {
        try {
          const textarea = await page.evaluateHandle(config.input_selector_fn);
          if (textarea) {
            // 强制聚焦到输入框
            await textarea.click();
            await page.waitForTimeout(300);

            // 清空输入框
            await page.keyboard.down("Control");
            await page.keyboard.press("KeyA");
            await page.keyboard.up("Control");
            await page.keyboard.press("Delete");
            await page.waitForTimeout(200);

            // 输入内容
            await textarea.type(config.getTitlePrompt);
            await page.waitForTimeout(500);

            // 验证输入内容
            const inputValue = await page.evaluate((el) => el.value, textarea);
            if (inputValue && inputValue.includes("年份")) {
              // 按回车键发送
              await page.keyboard.press("Enter");
              console.log(`📝 已发送识别请求: ${config.getTitlePrompt}`);
              console.log(
                `⌨️ 已按回车键发送内容 (尝试 ${retryCount + 1}/${maxRetries})`
              );

              // 验证是否成功发送（检查输入框是否被清空）
              await page.waitForTimeout(1000);
              const afterSendValue = await page.evaluate(
                (el) => el.value,
                textarea
              );
              if (
                !afterSendValue ||
                afterSendValue.length < inputValue.length / 2
              ) {
                inputSuccess = true;
                console.log(`✅ 内容发送成功，输入框已清空`);
              } else {
                console.log(`⚠️ 发送可能失败，输入框内容未清空，重试...`);
                retryCount++;
              }
            } else {
              console.log(
                `⚠️ 输入验证失败，期望包含"年份"，实际: "${inputValue?.substring(0, 50)}..."，重试...`
              );
              retryCount++;
            }
          } else {
            console.log(`⚠️ 未找到输入框，重试...`);
            retryCount++;
          }
        } catch (error) {
          console.log(`⚠️ 输入过程出错: ${error.message}，重试...`);
          retryCount++;
        }

        if (!inputSuccess && retryCount < maxRetries) {
          await page.waitForTimeout(1000); // 重试前等待
        }
      }

      if (!inputSuccess) {
        console.log(`❌ 输入失败，跳过第 ${i + 1} 张图片`);
        continue;
      }

      // 等待AI回复
      console.log(`⏰ 等待AI识别结果 (${config.sendWaitTime / 1000}秒)...`);
      await page.waitForTimeout(config.sendWaitTime);
    } catch (error) {
      console.error(`❌ 处理第 ${i + 1} 张图片失败:`, error.message);
      extractedTitles.push(""); // 添加空字符串保持数组长度一致
    }
  }

  // 获取所有识别结果
  console.log(`\n📥 获取所有识别结果...`);
  try {
    // const results = [];
    // for (let i = 0; i < frameFiles.length; i++) {
    //   const result = await page.evaluate((num, selectorFnStr) => {
    //     const selectorFn = eval(`(${selectorFnStr})`);
    //     return selectorFn(num);
    //   }, i, config.get_title_selector_fn.toString());

    //   const resultStr = String(result || "");
    //   results.push(resultStr);
    //   console.log(`✅ 第 ${i + 1} 个结果: "${resultStr.substring(0, 50)}${resultStr.length > 50 ? '...' : ''}"`);
    // }
    const results = await page.evaluate(
      (num, selectorFnStr) => {
        const selectorFn = eval(`(${selectorFnStr})`);
        return selectorFn(num);
      },
      frameFiles.length,
      config.get_title_selector_fn.toString()
    );

    console.log(`\n🎉 所有图片识别完成！`);
    console.log(
      `📊 成功识别: ${results.filter((r) => r && r.trim()).length}/${frameFiles.length}`
    );

    // 关闭浏览器
    console.log(`\n🔄 关闭浏览器...`);
    await browser.close();

    return results;
  } catch (error) {
    console.error(`❌ 获取识别结果失败:`, error.message);
    // 确保浏览器被关闭
    try {
      await browser.close();
    } catch (closeError) {
      console.error(`⚠️ 关闭浏览器失败:`, closeError.message);
    }
    return frameFiles.map(() => "");
  }
}

/**
 * 豆包AI提示词反推
 */
async function doubaoPromptGeneration(frameFiles, config) {
  console.log(`\n🤖 [步骤4] 豆包AI提示词反推`);

  const userDataDir = path.join(process.cwd(), CONFIG.BROWSER_DATA_DIR);
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized", "--no-first-run", "--no-default-browser-check"],
    userDataDir: userDataDir,
  });

  const page = await browser.newPage();
  await page.goto(config.get_promot_path);
  await page.waitForTimeout(config.pageLoadWaitTime);

  const prompts = [];

  // 检查是否直接获取已有结果
  if (config.get_promot) {
    console.log(`\n📋 直接获取页面已有提示词结果 (get_promot=true)`);
    try {
      const results = await page.evaluate(
        (num, selectorFnStr) => {
          const selectorFn = eval(`(${selectorFnStr})`);
          return selectorFn(num);
        },
        frameFiles.length,
        config.get_promot_fn.toString()
      );

      if (Array.isArray(results)) {
        prompts.push(...results);
        console.log(`✅ 获取到 ${results.length} 个提示词`);
      } else {
        for (let i = 0; i < frameFiles.length; i++) {
          prompts.push("");
        }
      }
    } catch (error) {
      console.error(`❌ 获取已有提示词失败:`, error.message);
      for (let i = 0; i < frameFiles.length; i++) {
        prompts.push("");
      }
    }
  } else {
    console.log(`\n📤 开始上传图片并获取提示词 (get_promot=false)`);

    // 逐个上传图片并获取提示词
    for (let i = 0; i < frameFiles.length; i++) {
      const frameFile = frameFiles[i];
      console.log(
        `\n📸 处理第 ${i + 1}/${frameFiles.length} 张图片: ${path.basename(frameFile)}`
      );

      try {
        // 步骤1: 点击上传按钮
        const uploadButton = await page.evaluateHandle(
          config.img_upload_selector_fn
        );

        if (uploadButton) {
          await uploadButton.click();
          console.log(`🎯 点击上传按钮完成`);

          // 等待文件选择对话框出现
          await page.waitForTimeout(1000);

          // 查找文件上传区域
          const fileUploadArea = await page.evaluateHandle(config.file_upload);
          if (fileUploadArea) {
            // 上传文件
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
              await fileInput.uploadFile(frameFile);
              console.log(`✅ 图片上传完成`);

              // 等待上传处理完成
              await page.waitForTimeout(config.uploadWaitTime);
            } else {
              console.log(`⚠️ 未找到文件输入框，跳过第 ${i + 1} 张图片`);
              prompts.push("");
              continue;
            }
          } else {
            console.log(`⚠️ 未找到文件上传区域，跳过第 ${i + 1} 张图片`);
            prompts.push("");
            continue;
          }
        } else {
          console.log(`⚠️ 未找到上传按钮，跳过第 ${i + 1} 张图片`);
          prompts.push("");
          continue;
        }

        // 步骤2: 输入提示词并发送
        let inputSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!inputSuccess && retryCount < maxRetries) {
          try {
            const textarea = await page.evaluateHandle(
              config.input_selector_fn
            );
            if (textarea) {
              // 强制聚焦到输入框
              await textarea.click();
              await page.waitForTimeout(300);

              // 清空输入框
              await page.keyboard.down("Control");
              await page.keyboard.press("KeyA");
              await page.keyboard.up("Control");
              await page.keyboard.press("Delete");
              await page.waitForTimeout(200);

              // 输入提示词内容
              await textarea.type(config.getPromotPrompt);
              await page.waitForTimeout(500);

              // 验证输入内容
              const inputValue = await page.evaluate(
                (el) => el.value,
                textarea
              );
              if (inputValue && inputValue.includes("提示词")) {
                // 按回车键发送
                await page.keyboard.press("Enter");
                console.log(`📝 已发送提示词请求: ${config.getPromotPrompt}`);
                console.log(
                  `⌨️ 已按回车键发送内容 (尝试 ${retryCount + 1}/${maxRetries})`
                );

                // 验证是否成功发送（检查输入框是否被清空）
                await page.waitForTimeout(1000);
                const afterSendValue = await page.evaluate(
                  (el) => el.value,
                  textarea
                );
                if (
                  !afterSendValue ||
                  afterSendValue.length < inputValue.length / 2
                ) {
                  inputSuccess = true;
                  console.log(`✅ 提示词发送成功，输入框已清空`);
                } else {
                  console.log(`⚠️ 发送可能失败，输入框内容未清空，重试...`);
                  retryCount++;
                }
              } else {
                console.log(
                  `⚠️ 输入验证失败，期望包含"提示词"，实际: "${inputValue?.substring(0, 50)}..."，重试...`
                );
                retryCount++;
              }
            } else {
              console.log(`⚠️ 未找到输入框，重试...`);
              retryCount++;
            }
          } catch (error) {
            console.log(`⚠️ 输入过程出错: ${error.message}，重试...`);
            retryCount++;
          }

          if (!inputSuccess && retryCount < maxRetries) {
            await page.waitForTimeout(1000); // 重试前等待
          }
        }

        if (!inputSuccess) {
          console.log(`❌ 提示词输入失败，跳过第 ${i + 1} 张图片`);
          prompts.push("");
          continue;
        }

        // 等待AI回复
        console.log(`⏰ 等待AI生成提示词 (${config.sendWaitTime / 1000}秒)...`);
        await page.waitForTimeout(config.sendWaitTime);
      } catch (error) {
        console.error(`❌ 处理第 ${i + 1} 张图片失败:`, error.message);
        prompts.push("");
      }
    }

    // 获取所有提示词结果
    console.log(`\n📥 获取所有提示词结果...`);
    try {
      const results = await page.evaluate(
        (num, selectorFnStr) => {
          const selectorFn = eval(`(${selectorFnStr})`);
          return selectorFn(num);
        },
        frameFiles.length,
        config.get_promot_fn.toString()
      );

      if (Array.isArray(results)) {
        prompts.length = 0; // 清空之前的结果
        prompts.push(...results);
        console.log(`✅ 获取到 ${results.length} 个提示词`);
        results.forEach((result, index) => {
          console.log(
            `   第 ${index + 1} 个: "${result?.substring(0, 50)}${result?.length > 50 ? "..." : ""}"`
          );
        });
      } else {
        console.log(`⚠️ 获取结果格式不正确，期望数组，实际: ${typeof results}`);
      }
    } catch (error) {
      console.error(`❌ 获取提示词结果失败:`, error.message);
    }
  }

  console.log(`\n🔄 关闭浏览器...`);
  await browser.close();
  return prompts;
}

/**
 * 豆包AI图片去文字
 */
async function doubaoImageProcessing(frameFiles, config) {
  console.log(`\n🎨 [步骤5] 豆包AI图片去文字`);

  const userDataDir = path.join(process.cwd(), CONFIG.BROWSER_DATA_DIR);
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized", "--no-first-run", "--no-default-browser-check"],
    userDataDir: userDataDir,
  });

  const page = await browser.newPage();
  await page.goto(config.image_remove_words_path);
  await page.waitForTimeout(config.pageLoadWaitTime);

  if (config.get_remove_words) {
    console.log(`\n📋 直接获取页面已有去文字结果 (get_remove_words=true)`);
    console.log(`✅ 去文字处理已完成，请手动下载生成的图片`);
  } else {
    console.log(`\n📤 开始执行去水印图片处理流程 (get_remove_words=false)`);

    // 步骤1: 按顺序执行 image_remove_words_fns 函数
    if (
      config.image_remove_words_fns &&
      Array.isArray(config.image_remove_words_fns)
    ) {
      console.log(
        `\n🔧 执行去水印预处理函数 (${config.image_remove_words_fns.length}个)`
      );

      for (let i = 0; i < config.image_remove_words_fns.length; i++) {
        try {
          console.log(
            `\n🎯 执行第 ${i + 1}/${config.image_remove_words_fns.length} 个预处理函数`
          );

          const result = await page.evaluate((fnStr) => {
            const fn = eval(`(${fnStr})`);
            const element = fn();
            if (element) {
              element.click();
              return `点击了元素: ${element.innerText?.substring(0, 20)}`;
            }
            return "未找到目标元素";
          }, config.image_remove_words_fns[i].toString());

          console.log(`✅ 预处理函数 ${i + 1} 执行结果: ${result}`);

          // 间隔5秒
          if (i < config.image_remove_words_fns.length - 1) {
            console.log(`⏰ 等待5秒后执行下一个函数...`);
            await page.waitForTimeout(5000);
          }
        } catch (error) {
          console.error(`❌ 预处理函数 ${i + 1} 执行失败:`, error.message);
        }
      }

      // 等待预处理完成
      console.log(`\n⏰ 预处理完成，等待${config.pageLoadWaitTime / 1000}秒后开始上传图片...`);
      await page.waitForTimeout(config.pageLoadWaitTime);
    }

    // 步骤2: 逐个上传图片并处理
    console.log(`\n📸 开始上传 ${frameFiles.length} 张视频帧图片`);

    for (let i = 0; i < frameFiles.length; i++) {
      const frameFile = frameFiles[i];
      console.log(
        `\n🖼️ 处理第 ${i + 1}/${frameFiles.length} 张图片: ${path.basename(frameFile)}`
      );

      try {
        // 步骤2.1: 点击上传按钮
        const uploadButton = await page.evaluateHandle(
          config.img_upload_selector_fn
        );

        if (uploadButton) {
          await uploadButton.click();
          console.log(`🎯 点击上传按钮完成`);

          // 等待文件选择对话框出现
          await page.waitForTimeout(1000);

          // 查找文件上传区域
          const fileUploadArea = await page.evaluateHandle(config.file_upload);
          if (fileUploadArea) {
            // 上传文件
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
              await fileInput.uploadFile(frameFile);
              console.log(`✅ 图片上传完成`);

              // 等待上传处理完成
              await page.waitForTimeout(config.uploadWaitTime);
            } else {
              console.log(`⚠️ 未找到文件输入框，跳过第 ${i + 1} 张图片`);
              continue;
            }
          } else {
            console.log(`⚠️ 未找到文件上传区域，跳过第 ${i + 1} 张图片`);
            continue;
          }
        } else {
          console.log(`⚠️ 未找到上传按钮，跳过第 ${i + 1} 张图片`);
          continue;
        }

        // 步骤2.2: 输入去文字提示词并发送
        let inputSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!inputSuccess && retryCount < maxRetries) {
          try {
            const textarea = await page.evaluateHandle(
              config.input_selector_fn
            );
            if (textarea) {
              // 强制聚焦到输入框
              await textarea.click();
              await page.waitForTimeout(300);

              // 清空输入框
              await page.keyboard.down("Control");
              await page.keyboard.press("KeyA");
              await page.keyboard.up("Control");
              await page.keyboard.press("Delete");
              await page.waitForTimeout(200);

              // 输入去文字提示词
              await textarea.type(config.removeTextPrompt);
              await page.waitForTimeout(500);

              // 验证输入内容
              const inputValue = await page.evaluate(
                (el) => el.value,
                textarea
              );
              if (inputValue && inputValue.includes("文字")) {
                // 按回车键发送
                await page.keyboard.press("Enter");
                console.log(`📝 已发送去文字请求: ${config.removeTextPrompt}`);
                console.log(
                  `⌨️ 已按回车键发送内容 (尝试 ${retryCount + 1}/${maxRetries})`
                );

                // 验证是否成功发送（检查输入框是否被清空）
                await page.waitForTimeout(1000);
                const afterSendValue = await page.evaluate(
                  (el) => el.value,
                  textarea
                );
                if (
                  !afterSendValue ||
                  afterSendValue.length < inputValue.length / 2
                ) {
                  inputSuccess = true;
                  console.log(`✅ 去文字请求发送成功，输入框已清空`);
                } else {
                  console.log(`⚠️ 发送可能失败，输入框内容未清空，重试...`);
                  retryCount++;
                }
              } else {
                console.log(
                  `⚠️ 输入验证失败，期望包含"文字"，实际: "${inputValue?.substring(0, 50)}..."，重试...`
                );
                retryCount++;
              }
            } else {
              console.log(`⚠️ 未找到输入框，重试...`);
              retryCount++;
            }
          } catch (error) {
            console.log(`⚠️ 输入过程出错: ${error.message}，重试...`);
            retryCount++;
          }

          if (!inputSuccess && retryCount < maxRetries) {
            await page.waitForTimeout(1000); // 重试前等待
          }
        }

        if (!inputSuccess) {
          console.log(`❌ 去文字请求输入失败，跳过第 ${i + 1} 张图片`);
          continue;
        }

        // 等待AI处理
        console.log(
          `⏰ 等待AI处理去文字 (${config.generateWaitTime / 1000}秒)...`
        );
        await page.waitForTimeout(config.generateWaitTime);
      } catch (error) {
        console.error(`❌ 处理第 ${i + 1} 张图片失败:`, error.message);
      }
    }

    console.log(`\n🎉 所有图片去文字处理完成！`);
    console.log(`📋 请手动下载生成的无水印图片`);
  }

  console.log(`\n🔄 关闭浏览器...`);
  await browser.close();
}

/**
 * 创建初始processed_data.json
 */
async function createInitialProcessedData(
  videoName,
  extractedTitles,
  outputDir,
  config,
  prompts = []
) {
  console.log(`\n📄 [步骤6] 创建初始processed_data.json`);

  // 使用 defaultPrompt 作为默认提示词
  const defaultPrompt = config.defaultPrompt || "";
  
  const segments = extractedTitles.map((title, index) => ({
    title: title || `第${index + 1}段`,
    prompt: prompts[index] || defaultPrompt, // 优先使用获取的提示词，否则使用默认提示词
    shot: config.shot || CONFIG.DEFAULT_SHOT,
  }));

  const processedData = {
    name: videoName,
    timeNum: extractedTitles.length,
    segments: segments,
  };

  const jsonPath = path.join(outputDir, "processed_data.json");
  await fs.writeFile(jsonPath, JSON.stringify(processedData, null, 2), "utf8");

  console.log(`✅ 已创建初始数据文件: ${jsonPath}`);
  console.log(`📊 处理完成统计:`);
  console.log(`   总片段数: ${processedData.segments.length}`);
  console.log(
    `   有标题的片段: ${processedData.segments.filter((s) => s.title && s.title.trim() && !s.title.includes("第") && !s.title.includes("段")).length}`
  );

  return { processedData, jsonPath };
}

/**
 * 获取视频时长
 */
async function getVideoDuration(videoPath) {
  try {
    const ffprobeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const result = execSync(ffprobeCmd, { encoding: "utf8" });
    return parseFloat(result.trim());
  } catch (error) {
    console.error(`❌ 获取视频时长失败:`, error.message);
    throw error;
  }
}

/**
 * 自动计算 seconds 数组
 * 确保每一帧都能捕捉到分镜文案且文案不重复
 */
async function calculateAutoSeconds(videoPath, videoName) {
  console.log(`\n🔍 自动计算视频帧提取时间点...`);
  
  // 获取视频总时长
  const duration = await getVideoDuration(videoPath);
  console.log(`📹 视频总时长: ${duration.toFixed(2)} 秒`);
  
  // 检查是否已有 processed_data.json
  const outputDir = path.join(process.cwd(), "output", videoName);
  const jsonPath = path.join(outputDir, "processed_data.json");
  
  try {
    await fs.access(jsonPath);
    const data = JSON.parse(await fs.readFile(jsonPath, "utf8"));
    
    if (data.segments && data.segments.length > 0) {
      console.log(`✅ 从 processed_data.json 读取到 ${data.segments.length} 个分镜`);
      
      const seconds = [];
      
      // 计算每个分镜的时长
      const segmentDuration = duration / data.segments.length;
      
      console.log(`📐 每个分镜平均时长: ${segmentDuration.toFixed(2)} 秒`);
      
      // 为每个分镜计算中间时间点，确保能捕捉到文案
      for (let i = 0; i < data.segments.length; i++) {
        // 计算每个分镜的起始和结束时间
        const segmentStart = i * segmentDuration;
        const segmentEnd = (i + 1) * segmentDuration;
        
        // 在分镜的中间位置截取，确保文案已经显示且稳定
        // 使用分镜时长的 60% 位置，避免文案刚出现或即将消失
        const captureTime = segmentStart + segmentDuration * 0.6;
        
        // 确保不超过视频总时长，并保留2位小数
        const finalTime = Math.min(captureTime, duration - 0.5);
        seconds.push(parseFloat(finalTime.toFixed(2)));
        
        console.log(`   分镜 ${i + 1}: ${segmentStart.toFixed(2)}s - ${segmentEnd.toFixed(2)}s, 截取时间: ${finalTime.toFixed(2)}s`);
      }
      
      console.log(`\n📊 自动计算的时间点: ${seconds.map(s => s.toFixed(2)).join(", ")} 秒`);
      console.log(`📏 总帧数: ${seconds.length}`);
      console.log(`✅ 每一帧都将捕捉到对应分镜的文案`);
      
      return seconds;
    }
  } catch (error) {
    console.log(`⚠️ 未找到 processed_data.json，使用默认计算方式`);
  }
  
  // 如果没有 processed_data.json，使用默认方式：每5秒一帧
  const seconds = [0.5];
  const interval = 5;
  let currentTime = interval;
  
  while (currentTime < duration - 1) {
    seconds.push(currentTime);
    currentTime += interval;
  }
  
  console.log(`📊 默认计算的时间点: ${seconds.map(s => s.toFixed(2)).join(", ")} 秒`);
  console.log(`📏 总帧数: ${seconds.length}`);
  
  return seconds;
}

/**
 * 更新所有文件的 historyNum
 */
async function updateAllHistoryNum(num) {
  console.log(`\n📝 更新所有文件的 historyNum 为: ${num}`);
  
  const filesToUpdate = [
    "config.mjs",
    "lib/auto-deepseek-jimeng/deepseek-config.mjs",
    "lib/auto-deepseek-jimeng/promot/storytelling-constants.mjs",
    "lib/auto-deepseek-jimeng/promot/person-constants.mjs",
  ];
  
  for (const filePath of filesToUpdate) {
    try {
      let content = await fs.readFile(filePath, "utf-8");
      
      // 替换所有 historyNum 的值
      const historyNumRegex = /const historyNum = \d+;?/g;
      content = content.replace(historyNumRegex, `const historyNum = ${num};`);
      
      await fs.writeFile(filePath, content, "utf-8");
      
      // 使用 prettier 格式化
      try {
        const { execFile } = await import('child_process');
        const { promisify } = await import('util');
        const execFilePromise = promisify(execFile);
        
        const { stdout } = await execFilePromise('npx', ['prettier', '--write', filePath], {
          shell: true,
        });
        
        console.log(`   ✅ 已更新并格式化: ${filePath}`);
      } catch (formatError) {
        console.log(`   ✅ 已更新: ${filePath} (格式化跳过)`);
      }
    } catch (error) {
      console.warn(`   ⚠️  更新 ${filePath} 失败: ${error.message}`);
    }
  }
  
  console.log(`✅ 所有文件的 historyNum 已更新为: ${num}`);
}

/**
 * 更新 jimeng-video-config.mjs 的 name
 */
async function updateJimengVideoConfigName(name) {
  const jimengConfigPath = "lib/auto-deepseek-jimeng/jimeng-video-config.mjs";
  
  try {
    console.log(`\n📝 更新 jimeng-video-config.mjs 的 name 为: ${name}`);
    
    let content = await fs.readFile(jimengConfigPath, "utf-8");
    
    // 替换 name 常量
    const nameRegex = /export const name = "[^"]*";/;
    content = content.replace(nameRegex, `export const name = "${name}";`);
    
    await fs.writeFile(jimengConfigPath, content, "utf-8");
    
    // 使用 prettier 格式化
    try {
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFilePromise = promisify(execFile);
      
      await execFilePromise('npx', ['prettier', '--write', jimengConfigPath], {
        shell: true,
      });
      
      console.log(`✅ jimeng-video-config.mjs 已更新并格式化`);
    } catch (formatError) {
      console.log(`✅ jimeng-video-config.mjs 已更新 (格式化跳过)`);
    }
  } catch (error) {
    throw new Error(`更新 jimeng-video-config.mjs 失败: ${error.message}`);
  }
}

/**
 * 更新 config.mjs 的 videoName 和 videoPath
 */
async function updateConfigVideoName(name) {
  const configPath = "config.mjs";
  
  try {
    console.log(`\n📝 更新 config.mjs 的 videoName 和 videoPath 为: ${name}`);
    
    let content = await fs.readFile(configPath, "utf-8");
    
    // 替换 videoPath 中的视频名字
    // 匹配格式: videoPath: "input/get-promot-image-by-video/旧名字.mp4"
    const videoPathRegex = /(videoPath:\s*["']input\/get-promot-image-by-video\/)([^"'\/]+)(\.mp4["'])/;
    content = content.replace(videoPathRegex, `$1${name}$3`);
    
    // 替换 videoName 字段
    const videoNameRegex = /(videoName:\s*["'])([^"']*)(['"])/;
    content = content.replace(videoNameRegex, `$1${name}$3`);
    
    await fs.writeFile(configPath, content, "utf-8");
    
    // 使用 prettier 格式化
    try {
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFilePromise = promisify(execFile);
      
      await execFilePromise('npx', ['prettier', '--write', configPath], {
        shell: true,
      });
      
      console.log(`✅ config.mjs 已更新并格式化`);
    } catch (formatError) {
      console.log(`✅ config.mjs 已更新 (格式化跳过)`);
    }
  } catch (error) {
    throw new Error(`更新 config.mjs 失败: ${error.message}`);
  }
}

/**
 * 主函数
 */
export async function runGetPromotImageByVideo(config, options = {}) {
  console.log(`\n🚀 开始执行 get-promot-image-by-video 任务`);
  
  // 处理 --name 参数
  let videoName = config.videoName;
  let videoPath = config.videoPath;
  
  if (options.name) {
    console.log(`\n🔧 检测到 --name 参数，更新配置...`);
    videoName = options.name;
    
    // 更新 jimeng-video-config.mjs
    await updateJimengVideoConfigName(videoName);
    
    // 更新 config.mjs
    await updateConfigVideoName(videoName);
    
    // 更新运行时的 videoPath，使用新的名称
    // 从原路径中提取目录部分，然后拼接新的文件名
    const pathParts = videoPath.split('/');
    pathParts[pathParts.length - 1] = `${videoName}.mp4`;
    videoPath = pathParts.join('/');
  }
  
  console.log(`\n📋 配置信息:`);
  console.log(`   视频路径: ${videoPath}${options.name ? ' (已更新)' : ''}`);
  console.log(`   视频名称: ${videoName}${options.name ? ' (来自命令行参数)' : ' (来自配置文件)'}`);
  
  // 处理 useAutoSeconds
  let seconds = config.seconds;
  if (config.useAutoSeconds) {
    console.log(`   🤖 启用自动计算时间点模式`);
    seconds = await calculateAutoSeconds(videoPath, videoName);
    
    // 更新所有文件的 historyNum
    await updateAllHistoryNum(seconds.length);
  } else {
    console.log(`   提取时间点: ${config.seconds.join(", ")} 秒`);
  }
  
  console.log(`   豆包识别页面: ${config.get_title_path}`);

  try {
    // 检查是否已有完整的数据文件
    const outputDir = path.join(process.cwd(), "output", videoName);
    const hasCompleteData = await checkExistingData(outputDir);

    if (hasCompleteData) {
      console.log(`\n✅ 检测到完整标题和提示词数据已存在`);
      console.log(`📁 输出目录: ${outputDir}`);
      console.log(
        `📄 数据文件: ${path.join(outputDir, "processed_data.json")}`
      );

      // 即使数据完整，仍然执行去水印步骤
      if (config.image_remove_words_path) {
        console.log(`\n🚀 继续执行: 豆包AI图片去文字`);
        const frameFiles = [];
        // 构建帧文件路径
        for (let i = 0; i < seconds.length; i++) {
          const second = seconds[i];
          const frameFile = path.join(
            outputDir,
            `frame_${i + 1}_${second}s.png`
          );
          frameFiles.push(frameFile);
        }
        await doubaoImageProcessing(frameFiles, config);
      }

      console.log(`\n🎉 所有任务执行完成！`);
      return;
    }

    // 步骤1: 创建输出目录
    console.log(`\n🚀 自动执行: 创建输出目录`);
    const createdOutputDir = await createOutputDirectory(videoName);

    // 检查是否已有所有视频帧
    const hasAllFrames = await checkExistingFrames(
      createdOutputDir,
      seconds
    );

    // 步骤2: 提取视频帧
    if (!hasAllFrames) {
      console.log(`\n🚀 自动执行: 提取视频帧`);
    }
    const frameFiles = await extractVideoFrames(
      videoPath,
      seconds,
      createdOutputDir
    );

    // 步骤3: 豆包AI图片内容识别
    let extractedTitles = [];
    const hasValidTitles = await checkExistingTitles(createdOutputDir);

    if (hasValidTitles) {
      console.log(`\n✅ 跳过图片内容识别: 已有完整标题数据`);
      // 读取已有标题数据
      try {
        const jsonPath = path.join(createdOutputDir, "processed_data.json");
        const data = JSON.parse(await fs.readFile(jsonPath, "utf8"));
        extractedTitles = data.segments.map((s) => s.title);
      } catch (error) {
        console.log(`⚠️ 读取已有标题数据失败，重新获取`);
        extractedTitles = await doubaoImageRecognition(frameFiles, config);
      }
    } else {
      console.log(`\n🚀 自动执行: 豆包AI图片内容识别`);
      extractedTitles = await doubaoImageRecognition(frameFiles, config);

      // 获取完title后立即写入processed_data.json
      console.log(`\n🚀 自动执行: 写入标题数据到processed_data.json`);
      await createInitialProcessedData(
        videoName,
        extractedTitles,
        createdOutputDir,
        config,
        [] // 暂时没有提示词
      );
    }

    // 步骤4: 豆包AI提示词反推
    let prompts = [];
    const hasValidPrompts = await checkExistingPrompts(createdOutputDir);

    if (hasValidPrompts) {
      console.log(`\n✅ 跳过提示词反推: 已有完整提示词数据`);
      // 读取已有提示词数据
      try {
        const jsonPath = path.join(createdOutputDir, "processed_data.json");
        const data = JSON.parse(await fs.readFile(jsonPath, "utf8"));
        prompts = data.segments.map((s) => s.prompt);
      } catch (error) {
        console.log(`⚠️ 读取已有提示词数据失败，重新获取`);
        prompts = await doubaoPromptGeneration(frameFiles, config);
      }
    } else if (config.get_promot_path) {
      console.log(`\n🚀 自动执行: 豆包AI提示词反推`);
      prompts = await doubaoPromptGeneration(frameFiles, config);

      // 获取完prompts后立即更新processed_data.json
      console.log(`\n🚀 自动执行: 更新提示词数据到processed_data.json`);
      await createInitialProcessedData(
        videoName,
        extractedTitles,
        createdOutputDir,
        config,
        prompts
      );
    }

    // 确保数据文件存在（如果前面步骤被跳过）
    let jsonPath = path.join(createdOutputDir, "processed_data.json");
    try {
      await fs.access(jsonPath);
      console.log(`\n✅ 数据文件已存在: ${jsonPath}`);
    } catch (error) {
      console.log(`\n🚀 自动执行: 创建最终数据文件`);
      const result = await createInitialProcessedData(
        videoName,
        extractedTitles,
        createdOutputDir,
        config,
        prompts
      );
      jsonPath = result.jsonPath;
    }

    // 步骤5: 豆包AI图片去文字
    if (config.image_remove_words_path) {
      console.log(`\n🚀 自动执行: 豆包AI图片去文字`);
      await doubaoImageProcessing(frameFiles, config);
    }

    console.log(`\n🎉 get-promot-image-by-video 任务执行完成！`);
    console.log(`📁 输出目录: ${outputDir}`);
    console.log(`📄 数据文件: ${jsonPath}`);
    console.log(`🖼️ 提取的帧图片: ${frameFiles.length} 张`);
    console.log(
      `📝 识别的标题: ${extractedTitles.filter((t) => t && t.trim()).length} 个`
    );
    console.log(
      `🎯 生成的提示词: ${prompts.filter((p) => p && p.trim()).length} 个`
    );
  } catch (error) {
    console.error(`\n❌ 执行过程中发生错误:`, error);
    throw error;
  }
}
