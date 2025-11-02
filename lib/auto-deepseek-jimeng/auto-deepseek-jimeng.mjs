import fs from "fs/promises";
import path from "path";
import { runJimengVideoFlow } from "./jimeng-video-generator.mjs";
import { runJimengFlow } from "./jimeng-generator.mjs";
import { runBaiduFlow } from "./baidu-generator.mjs";
import { runDeepSeekFlow } from "./deepseek-generator.mjs";

/**
 * 清理浏览器用户数据，强制重新登录
 * @param {number} accountId - 可选，指定清理特定账号的数据，不指定则清理所有账号
 */
export async function clearBrowserData(accountId = null) {
  const browserDataDir = path.join(process.cwd(), "browser-data");
  let success = true;

  try {
    // 清理 DeepSeek 数据
    const deepseekUserDataDir = path.join(browserDataDir, "deepseek-profile");
    await fs.rm(deepseekUserDataDir, { recursive: true, force: true });
    console.log("🧹 DeepSeek 浏览器数据已清理");
  } catch (error) {
    console.warn("⚠️ 清理 DeepSeek 浏览器数据时出错:", error.message);
    success = false;
  }

  try {
    if (accountId) {
      // 清理指定账号的即梦数据
      const jimengUserDataDir = path.join(
        browserDataDir,
        `jimeng-profile-${accountId}`
      );
      await fs.rm(jimengUserDataDir, { recursive: true, force: true });
      console.log(`🧹 即梦账号 ${accountId} 浏览器数据已清理`);
      
      // 清理指定账号的百度数据
      const baiduUserDataDir = path.join(
        browserDataDir,
        `baidu-profile-${accountId}`
      );
      await fs.rm(baiduUserDataDir, { recursive: true, force: true });
      console.log(`🧹 百度账号 ${accountId} 浏览器数据已清理`);
    } else {
      // 清理所有即梦账号数据
      try {
        const files = await fs.readdir(browserDataDir);
        const jimengProfiles = files.filter((file) =>
          file.startsWith("jimeng-profile-")
        );
        const baiduProfiles = files.filter((file) =>
          file.startsWith("baidu-profile-")
        );

        for (const profile of jimengProfiles) {
          const profilePath = path.join(browserDataDir, profile);
          await fs.rm(profilePath, { recursive: true, force: true });
          console.log(`🧹 ${profile} 浏览器数据已清理`);
        }
        
        for (const profile of baiduProfiles) {
          const profilePath = path.join(browserDataDir, profile);
          await fs.rm(profilePath, { recursive: true, force: true });
          console.log(`🧹 ${profile} 浏览器数据已清理`);
        }

        if (jimengProfiles.length === 0 && baiduProfiles.length === 0) {
          console.log("📝 未找到即梦或百度账号数据");
        }
      } catch (error) {
        console.warn("⚠️ 清理即梦浏览器数据时出错:", error.message);
        success = false;
      }
    }
  } catch (error) {
    console.warn("⚠️ 清理即梦浏览器数据时出错:", error.message);
    success = false;
  }

  if (success) {
    const message = accountId
      ? `✅ 账号 ${accountId} 的浏览器数据已清理，下次运行将需要重新登录`
      : "✅ 所有浏览器数据已清理，下次运行将需要重新登录";
    console.log(message);
  }

  return success;
}

/**
 * 检查账号是否已存在本地数据
 */
async function checkAccountExists(accountId) {
  const accountDataDir = path.join(
    process.cwd(),
    "browser-data",
    `jimeng-profile-${accountId}`
  );
  try {
    await fs.access(accountDataDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * 保存已使用的账号ID到记录文件
 */
async function saveUsedAccountId(accountId) {
  const browserDataDir = path.join(process.cwd(), "browser-data");
  await fs.mkdir(browserDataDir, { recursive: true });

  const accountRecordFile = path.join(browserDataDir, "used-accounts.json");

  let usedAccounts = [];
  try {
    const data = await fs.readFile(accountRecordFile, "utf8");
    usedAccounts = JSON.parse(data);
  } catch {
    // 文件不存在或解析失败，使用空数组
  }

  if (!usedAccounts.includes(accountId)) {
    usedAccounts.push(accountId);
    await fs.writeFile(
      accountRecordFile,
      JSON.stringify(usedAccounts, null, 2),
      "utf8"
    );
    console.log(`📝 记录账号 ${accountId} 为已使用账号`);
  }
}

/**
 * 检查账号ID是否是新账号（之前从未使用过）
 */
async function isNewAccount(accountId) {
  const browserDataDir = path.join(process.cwd(), "browser-data");
  const accountRecordFile = path.join(browserDataDir, "used-accounts.json");

  try {
    const data = await fs.readFile(accountRecordFile, "utf8");
    const usedAccounts = JSON.parse(data);
    return !usedAccounts.includes(accountId);
  } catch {
    // 文件不存在，说明是第一次使用任何账号
    return true;
  }
}

/**
 * 检查当前登录的账号是否匹配指定的accountId
 */
async function checkCurrentAccount(page, expectedAccountId) {
  try {
    // 这里可以添加检查当前登录账号的逻辑
    // 比如检查页面上的用户信息、头像等
    // 暂时返回true，后续可以根据实际页面结构完善
    console.log(`🔍 检查当前登录账号是否为账号 ${expectedAccountId}...`);

    // 可以在这里添加具体的账号验证逻辑
    // 例如：检查页面上的用户名、头像URL等

    return true; // 暂时默认匹配
  } catch (error) {
    console.warn(`⚠️ 检查当前账号失败: ${error.message}`);
    return false;
  }
}

/**
 * 使用无头浏览器自动化 DeepSeek 对话，获取视频生成提示词
 * @param {Object} config - 配置对象
 */
export default async function runAutoDeepseekJimeng(config) {
  console.log("🚀 启动 auto-deepseek-jimeng 功能...");

  const { 
    deepseek, 
    jimeng, 
    baidu, 
    imgGenerateType = "jimeng", // 默认使用即梦
    "jimeng-video-generator": jimengVideo 
  } = config;
  
  if (!deepseek) {
    throw new Error("配置中缺少 deepseek 配置项");
  }

  // 根据 imgGenerateType 选择图片生成服务
  let imageGeneratorConfig;
  let imageGeneratorName;
  
  if (imgGenerateType === "baidu") {
    if (!baidu) {
      throw new Error("配置中缺少 baidu 配置项，但 imgGenerateType 设置为 'baidu'");
    }
    imageGeneratorConfig = baidu;
    imageGeneratorName = "百度AI生图";
  } else {
    if (!jimeng) {
      throw new Error("配置中缺少 jimeng 配置项，但 imgGenerateType 设置为 'jimeng'");
    }
    imageGeneratorConfig = jimeng;
    imageGeneratorName = "即梦";
  }
  
  console.log(`🎨 使用图片生成服务: ${imageGeneratorName}`);

  const name = imageGeneratorConfig?.name || deepseek.send_msg_template_data?.name;

  // 检查本地是否已有数据
  const localDataExists = await checkLocalData(name);

  let processedData;
  if (localDataExists) {
    console.log("✅ 发现本地数据，跳过 DeepSeek 步骤");
    processedData = await loadLocalData(name);

    // 检查 processed_data.json 和 config.mjs 中的 sectionTitle 是否一致
    await checkAndUpdateSectionTitleConsistency(processedData, name);
  } else {
    console.log("🔍 未发现本地数据，开始 DeepSeek 流程");
    processedData = await runDeepSeekFlow(deepseek);
  }

  // 检查是否已有图片
  const imagesExist = await checkImagesExist(name);

  // 如果有图片生成配置且图片不存在，执行图片生成
  if (imageGeneratorConfig && !imagesExist) {
    console.log(`🎨 开始${imageGeneratorName}图片生成流程...`);
    
    if (imgGenerateType === "baidu") {
      await runBaiduFlow(imageGeneratorConfig, processedData, name);
    } else {
      await runJimengFlow(imageGeneratorConfig, processedData, name);
    }
  } else if (imagesExist) {
    console.log(`✅ 发现本地图片，跳过${imageGeneratorName}图片生成步骤`);
  }

  // 如果有即梦视频生成配置，执行视频生成
  if (jimengVideo) {
    // 在视频生成前再次检查图片是否存在
    const videoImagesExist = await checkImagesExist(name);

    if (!videoImagesExist && imageGeneratorConfig) {
      console.log("⚠️ 视频生成需要图片，但未找到图片文件");
      console.log(`🎨 开始${imageGeneratorName}图片生成流程...`);
      
      if (imgGenerateType === "baidu") {
        await runBaiduFlow(imageGeneratorConfig, processedData, name);
      } else {
        await runJimengFlow(imageGeneratorConfig, processedData, name);
      }
    } else if (!videoImagesExist && !imageGeneratorConfig) {
      throw new Error(`视频生成需要图片，但未配置${imageGeneratorName}图片生成且未找到现有图片`);
    }

    console.log("🎬 开始即梦视频生成流程...");
    await runJimengVideoFlow(jimengVideo, processedData, name);
  }

  return processedData;
}

/**
 * 检查本地是否已有数据
 */
async function checkLocalData(name) {
  if (!name) return false;

  const outputDir = path.join("output", name);
  const processedDataPath = path.join(outputDir, "processed_data.json");

  try {
    await fs.access(processedDataPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查本地是否已有图片
 */
async function checkImagesExist(name) {
  if (!name) return false;

  const imagesDir = path.join("output", name, "images");

  try {
    const files = await fs.readdir(imagesDir);
    // 检查是否有图片文件
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    console.log(`🔍 检查图片目录: ${imagesDir}`);
    console.log(
      `📁 找到 ${files.length} 个文件，其中 ${imageFiles.length} 个图片文件`
    );

    return imageFiles.length > 0;
  } catch (error) {
    console.log(`⚠️ 读取图片目录失败: ${error.message}`);
    return false;
  }
}

/**
 * 加载本地数据
 */
async function loadLocalData(name) {
  const outputDir = path.join("output", name);
  const processedDataPath = path.join(outputDir, "processed_data.json");

  try {
    const data = await fs.readFile(processedDataPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`加载本地数据失败: ${error.message}`);
  }
}

// runDeepSeekFlow 函数已移至 ./deepseek-generator.mjs

/**
 * 检查是否需要登录
 */
async function checkNeedLogin(page, login_selector, chat_selector) {
  try {
    // 首先检查是否能找到聊天输入框（表示已登录）
    await page.waitForSelector(chat_selector, { timeout: 3000 });
    console.log("🔍 找到聊天输入框，已登录");
    return false; // 找到聊天框，不需要登录
  } catch (error) {
    console.log("🔍 未找到聊天输入框，检查是否在登录页面...");

    // 如果找不到聊天框，检查是否在登录页面
    if (!login_selector || !login_selector.username) {
      console.log("⚠️ 未配置登录选择器，无法自动登录");
      return false;
    }

    try {
      // 首先尝试点击用户名密码登录标签页（如果存在）
      if (login_selector.username_password_tab) {
        try {
          console.log(
            `🔍 尝试查找标签页选择器: ${login_selector.username_password_tab}`
          );

          // 等待页面完全加载
          await page.waitForTimeout(2000);

          // 尝试多种方式查找标签页
          const tabSelectors = [
            login_selector.username_password_tab,
            'div[class="ds-tab"] + div', // 原始选择器
            "div.ds-tab + div", // 类选择器变体
            '[class*="ds-tab"] + div', // 包含类名的选择器
            "div:has(.ds-tab) + div", // 如果支持 :has 选择器
          ];

          let tabFound = false;
          for (const selector of tabSelectors) {
            try {
              console.log(`🔍 尝试选择器: ${selector}`);
              await page.waitForSelector(selector, { timeout: 3000 });
              await page.click(selector);
              console.log(`✅ 成功点击标签页，使用选择器: ${selector}`);
              tabFound = true;
              await page.waitForTimeout(1000); // 等待标签页切换
              break;
            } catch (selectorError) {
              console.log(`❌ 选择器失败: ${selector}`);
              continue;
            }
          }

          if (!tabFound) {
            // 尝试通过文本内容查找标签页
            try {
              console.log("🔍 尝试通过文本内容查找用户名密码标签页...");
              const tabElements = await page.$$("div, button, a");
              for (const element of tabElements) {
                const text = await page.evaluate(
                  (el) => el.textContent,
                  element
                );
                if (
                  text &&
                  (text.includes("密码") ||
                    text.includes("账号") ||
                    text.includes("邮箱"))
                ) {
                  await element.click();
                  console.log(`✅ 通过文本内容找到并点击标签页: "${text}"`);
                  tabFound = true;
                  await page.waitForTimeout(1000);
                  break;
                }
              }
            } catch (textError) {
              console.log("❌ 通过文本查找标签页也失败");
            }
          }

          if (!tabFound) {
            console.log("⚠️ 所有标签页查找方法都失败，继续查找登录表单");
          }
        } catch (tabError) {
          console.log(
            "🔍 标签页查找过程出错，继续查找登录表单:",
            tabError.message
          );
        }
      }

      await page.waitForSelector(login_selector.username, { timeout: 3000 });
      console.log("🔍 找到登录表单，需要登录");
      return true; // 找到登录表单，需要登录
    } catch (loginError) {
      console.log("⚠️ 既未找到聊天框也未找到登录表单，可能页面结构发生变化");

      // 尝试获取页面上的一些常见元素来帮助调试
      try {
        const commonSelectors = [
          "textarea",
          'input[type="text"]',
          'input[type="email"]',
          'input[type="tel"]',
          "button",
          '[role="button"]',
          ".login",
          ".signin",
          ".chat",
          'div[class*="tab"]',
          'div[class*="ds-"]',
          ".ds-tab",
        ];

        console.log("🔍 页面上找到的元素:");
        for (const selector of commonSelectors) {
          try {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
              console.log(`  - ${selector}: ${elements.length} 个`);

              // 对于 tab 相关的元素，显示更多信息
              if (selector.includes("tab") || selector.includes("ds-")) {
                for (let i = 0; i < Math.min(elements.length, 3); i++) {
                  const text = await page.evaluate(
                    (el) => el.textContent?.trim(),
                    elements[i]
                  );
                  const className = await page.evaluate(
                    (el) => el.className,
                    elements[i]
                  );
                  console.log(
                    `    [${i}] 文本: "${text}" 类名: "${className}"`
                  );
                }
              }
            }
          } catch (e) {
            // 忽略选择器错误
          }
        }

        // 额外检查页面HTML结构
        console.log("🔍 页面HTML片段:");
        const bodyHTML = await page.evaluate(() => {
          const body = document.body;
          return body ? body.innerHTML.substring(0, 1000) : "No body found";
        });
        console.log(bodyHTML);
      } catch (debugError) {
        console.log("调试信息获取失败:", debugError.message);
      }

      return false;
    }
  }
}

/**
 * 执行登录流程
 */
async function performLogin(page, login_selector, login_data) {
  const { username, password, login_button } = login_selector;
  const { username: usernameValue, password: passwordValue } = login_data;

  console.log("🔍 查找用户名输入框...");
  await page.waitForSelector(username, { timeout: 10000 });
  await page.click(username);
  await page.type(username, usernameValue);
  console.log("✅ 用户名已输入");

  console.log("🔍 查找密码输入框...");
  await page.waitForSelector(password, { timeout: 10000 });
  await page.click(password);
  await page.type(password, passwordValue);
  console.log("✅ 密码已输入");

  console.log("🔍 查找登录按钮...");
  await page.waitForSelector(login_button, { timeout: 10000 });
  await page.click(login_button);
  console.log("✅ 登录按钮已点击");

  console.log("🔄 正在登录...");
  await page.waitForTimeout(3000); // 等待登录处理
}

/**
 * 构建发送消息
 */
function buildMessage(template, data) {
  let message = template;

  // 替换模板变量
  Object.keys(data).forEach((key) => {
    const placeholder = `{{${key}}}`;
    message = message.replace(new RegExp(placeholder, "g"), data[key]);
  });

  return message;
}

/**
 * 发送消息
 */
async function sendMessage(page, chat_selector, send_chat_selector, message) {
  console.log("📝 开始输入消息...");

  // 点击输入框并清空现有内容
  await page.click(chat_selector);
  await page.keyboard.down("Meta"); // Mac 上的 Cmd 键
  await page.keyboard.press("a");
  await page.keyboard.up("Meta");
  await page.keyboard.press("Backspace");

  console.log(`📝 开始输入消息，总长度: ${message.length} 字符`);

  // 尝试使用剪贴板方式输入（更可靠）
  try {
    console.log("📋 尝试使用剪贴板方式输入...");
    await page.evaluate(async (text) => {
      await navigator.clipboard.writeText(text);
    }, message);

    await page.keyboard.down("Meta");
    await page.keyboard.press("v");
    await page.keyboard.up("Meta");
    console.log("✅ 剪贴板输入完成");
  } catch (clipboardError) {
    console.warn("⚠️ 剪贴板输入失败，使用键盘输入:", clipboardError.message);

    // 降级到键盘输入，使用较慢的速度确保稳定
    await page.type(chat_selector, message, { delay: 20 });
    console.log("✅ 键盘输入完成");
  }

  // 验证输入是否完整，最多重试3次
  let retryCount = 0;
  const maxRetries = 3;
  let inputComplete = false;

  while (!inputComplete && retryCount < maxRetries) {
    console.log(`🔍 验证输入完整性... (尝试 ${retryCount + 1}/${maxRetries})`);

    // 等待一下让输入稳定
    await page.waitForTimeout(1000);

    const inputValue = await page.$eval(
      chat_selector,
      (el) => el.value || el.innerText || el.textContent
    );
    const expectedLength = message.length;
    const actualLength = inputValue.length;

    console.log(`📊 预期长度: ${expectedLength}, 实际长度: ${actualLength}`);

    if (actualLength >= expectedLength * 0.9) {
      // 允许10%的误差
      console.log("✅ 输入完整性验证通过");
      inputComplete = true;
    } else {
      console.warn(`⚠️ 输入不完整，重新尝试输入... (第 ${retryCount + 1} 次)`);

      // 清空并重新输入
      await page.click(chat_selector);
      await page.keyboard.down("Meta");
      await page.keyboard.press("a");
      await page.keyboard.up("Meta");
      await page.keyboard.press("Backspace");

      // 等待清空完成
      await page.waitForTimeout(500);

      // 重新输入，使用更慢的速度
      await page.type(chat_selector, message, { delay: 30 });

      // 等待输入完成
      await page.waitForTimeout(2000);

      retryCount++;
    }
  }

  if (!inputComplete) {
    console.error("❌ 多次尝试后输入仍不完整，但继续执行...");
  }

  // 等待输入完全完成
  console.log("⏳ 最终等待输入完全完成...");
  await page.waitForTimeout(2000);

  // 点击发送按钮
  console.log("📤 准备发送消息...");
  try {
    // 尝试使用配置的选择器
    await page.waitForSelector(send_chat_selector, { timeout: 1000 });
    await page.click(send_chat_selector);
    console.log("✅ 使用配置选择器发送成功");
  } catch (error) {
    console.log("⚠️ 配置选择器失败，尝试常见选择器...");
    // 如果配置的选择器不工作，尝试常见的发送按钮选择器
    const commonSelectors = [
      'button[type="submit"]',
      '[data-testid="send-button"]',
      'button:has-text("发送")',
      'button:has-text("Send")',
      ".send-button",
      '[aria-label*="发送"]',
      '[aria-label*="Send"]',
    ];

    let sent = false;
    for (const selector of commonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 });
        await page.click(selector);
        console.log(`✅ 使用选择器 ${selector} 发送成功`);
        sent = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!sent) {
      // 最后尝试按 Enter 键
      console.log("⚠️ 所有选择器都失败，尝试按 Enter 键...");
      await page.keyboard.press("Enter");
    }
  }

  console.log("📤 消息已发送");
}

/**
 * 提取 DeepSeek 回复结果
 */
async function extractResults(page, resultFunction) {
  try {
    // 尝试执行配置的函数
    const results = await page.evaluate(resultFunction);
    console.log("results", results);
    if (results && results.length > 0) {
      return results;
    }
  } catch (error) {
    console.warn("⚠️ 配置的结果提取函数执行失败，尝试通用方法:", error.message);
  }

  // 如果配置的函数失败，尝试通用的结果提取方法
  const commonSelectors = [
    'div[class*="markdown"] p',
    ".message-content p",
    ".response-content p",
    ".chat-message p",
    '[data-testid*="message"] p',
    ".prose p",
  ];

  for (const selector of commonSelectors) {
    try {
      const results = await page.evaluate((sel) => {
        const elements = document.querySelectorAll(sel);
        return Array.from(elements)
          .map((el) => el.innerText)
          .filter((text) => text && typeof text === "string")
          .filter((text) => text.trim().length > 0);
      }, selector);

      if (results && results.length > 0) {
        console.log(
          `✅ 使用选择器 "${selector}" 成功提取到 ${results.length} 条结果`
        );
        return results;
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error("无法提取 DeepSeek 回复内容，请检查页面结构或配置");
}

/**
 * 处理和保存结果
 */
async function processAndSaveResults(results, templateData) {
  const { name } = templateData;
  const outputDir = path.join("output", name);

  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true });

  // 过滤和处理结果，确保获得指定数量的段落
  // let processedResults = results
  //   .filter((text) => text && typeof text === "string")
  //   .filter((text) => text.trim()?.length > 10) // 过滤太短的文本
  //   .slice(0, timeNum); // 取前 timeNum 段

  // if (processedResults.length < timeNum) {
  //   console.warn(
  //     `⚠️ 只获取到 ${processedResults.length} 段内容，期望 ${timeNum} 段`
  //   );
  // }

  let processedResults = results;

  // 智能合并相关片段
  console.log(`🔍 开始智能合并片段，原始数据条数: ${processedResults.length}`);
  const mergedSegments = mergeRelatedSegments(processedResults);
  console.log(`📊 合并后得到 ${mergedSegments.length} 个片段`);

  // 重新组织数据，合并相关片段
  const extractedData = {
    segments: [],
    rawResults: processedResults,
  };

  mergedSegments.forEach((segment, index) => {
    console.log(`📝 处理第 ${index + 1} 个片段: ${segment.title}`);
    extractedData.segments.push({
      index: index + 1,
      title: segment.title,
      shot: segment.shot,
      prompt: segment.prompt,
      originalText: segment.originalText,
    });
  });

  console.log(`✅ 最终 extractedData.segments 包含 ${extractedData.segments.length} 个片段`);

  // 保存原始结果
  const rawResultsPath = path.join(outputDir, "raw_results.json");
  await fs.writeFile(
    rawResultsPath,
    JSON.stringify(processedResults, null, 2),
    "utf8"
  );

  // 保存处理后的数据
  const processedDataPath = path.join(outputDir, "processed_data.json");
  await fs.writeFile(
    processedDataPath,
    JSON.stringify(extractedData, null, 2),
    "utf8"
  );

  // 保存为文本格式便于查看
  // const textOutputPath = path.join(outputDir, "segments.txt");
  // const textContent = extractedData.segments
  //   .map(
  //     (segment) =>
  //       `=== 第${segment.index}段 ===\n` +
  //       `标题: ${segment.title}\n` +
  //       `镜头: ${segment.shot}\n` +
  //       `提示词: ${segment.prompt}\n` +
  //       `原文: ${segment.originalText}\n\n`
  //   )
  //   .join("");

  // await fs.writeFile(textOutputPath, textContent, "utf8");

  console.log(`📊 处理完成，共 ${extractedData.segments.length} 段内容`);
  console.log(`📄 文件已保存:`);
  console.log(`   - ${rawResultsPath}`);
  console.log(`   - ${processedDataPath}`);

  // 更新 config.mjs 中的 sectionTitle
  await updateConfigSectionTitle(extractedData, name);

  return extractedData;
}

/**
 * 更新 config.mjs 中的 sectionTitle
 */
async function updateConfigSectionTitle(extractedData, name) {
  try {
    console.log("🔄 开始更新 config.mjs 中的 sectionTitle...");

    const configPath = path.join(process.cwd(), "config.mjs");

    // 读取当前配置文件
    let configContent = await fs.readFile(configPath, "utf8");

    // 提取新的 title 数组
    console.log(`🔍 extractedData.segments 类型: ${typeof extractedData.segments}, 长度: ${extractedData.segments?.length}`);
    console.log(`🔍 extractedData.segments 内容:`, extractedData.segments);
    
    const newTitles = extractedData.segments.map((segment) => segment.title);
    console.log(`📝 提取到 ${newTitles.length} 个新标题:`);
    newTitles.forEach((title, index) => {
      console.log(`  ${index + 1}. "${title}"`);
    });

    // 检查是否需要更新（比较现有的 sectionTitle）
    const needsUpdate = await checkIfSectionTitleNeedsUpdate(
      configContent,
      newTitles,
      name
    );

    if (needsUpdate) {
      console.log("🔄 检测到 sectionTitle 需要更新，开始更新...");

      // 构建新的 sectionTitle 数组字符串，正确转义换行符
      const sectionTitleArray = newTitles
        .map((title) => {
          // 将实际换行符转换为 \n 转义字符，确保在 JavaScript 字符串中正确显示
          const escapedTitle = title.replace(/\n/g, "\\n");
          return `"${escapedTitle}"`;
        })
        .join(",\n      ");

      const newSectionTitleString = `sectionTitle: [\n      ${sectionTitleArray},\n    ],`;

      // 使用正则表达式替换 sectionTitle 数组
      const sectionTitleRegex = /sectionTitle:\s*\[[\s\S]*?\],/;

      if (sectionTitleRegex.test(configContent)) {
        configContent = configContent.replace(
          sectionTitleRegex,
          newSectionTitleString
        );
        console.log("✅ 已替换现有的 sectionTitle");
      } else {
        console.warn("⚠️ 未找到现有的 sectionTitle，跳过更新");
        return;
      }

      // 写回配置文件
      await fs.writeFile(configPath, configContent, "utf8");
      console.log("✅ config.mjs 中的 sectionTitle 已更新并格式化");
    } else {
      console.log("✅ sectionTitle 已是最新，无需更新");
    }
  } catch (error) {
    console.error("❌ 更新 config.mjs 失败:", error.message);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 检查并更新 sectionTitle 一致性
 * 如果 processed_data.json 和 config.mjs 中的 sectionTitle 不一致，则清空重写
 */
async function checkAndUpdateSectionTitleConsistency(processedData, name) {
  try {
    console.log(
      "🔍 检查 processed_data.json 和 config.mjs 中的 sectionTitle 一致性..."
    );

    const configPath = path.join(process.cwd(), "config.mjs");
    const configContent = await fs.readFile(configPath, "utf8");

    // 从 processed_data.json 中提取 title 数组
    const processedTitles = processedData.segments.map(
      (segment) => segment.title
    );

    // 检查是否需要更新
    const needsUpdate = await checkIfSectionTitleNeedsUpdate(
      configContent,
      processedTitles,
      name
    );

    if (needsUpdate) {
      console.log(
        "⚠️ 检测到 processed_data.json 和 config.mjs 中的 sectionTitle 不一致"
      );
      console.log("🔄 开始清空并重写 sectionTitle...");

      // 直接调用更新函数
      await updateConfigSectionTitle(processedData, name);
    } else {
      console.log(
        "✅ processed_data.json 和 config.mjs 中的 sectionTitle 一致"
      );
    }
  } catch (error) {
    console.error("❌ 检查 sectionTitle 一致性失败:", error.message);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 检查 sectionTitle 是否需要更新
 */
async function checkIfSectionTitleNeedsUpdate(configContent, newTitles, name) {
  try {
    // 从配置内容中提取当前的 sectionTitle
    const sectionTitleMatch = configContent.match(
      /sectionTitle:\s*\[([\s\S]*?)\],/
    );

    if (!sectionTitleMatch) {
      console.log("🔍 未找到现有的 sectionTitle，需要更新");
      return true;
    }

    // 解析现有的 sectionTitle 数组
    const sectionTitleContent = sectionTitleMatch[1];
    const currentTitles = [];

    // 提取字符串内容
    const titleMatches = sectionTitleContent.match(/"([^"]+)"/g);
    if (titleMatches) {
      titleMatches.forEach((match) => {
        currentTitles.push(match.slice(1, -1)); // 去掉引号
      });
    }

    console.log(`🔍 当前配置中有 ${currentTitles.length} 个标题`);
    console.log(`🔍 新数据中有 ${newTitles.length} 个标题`);

    // 比较数量
    if (currentTitles.length !== newTitles.length) {
      console.log("📊 标题数量不同，需要更新");
      return true;
    }

    // 比较内容
    for (let i = 0; i < currentTitles.length; i++) {
      if (currentTitles[i] !== newTitles[i]) {
        console.log(`📊 标题内容不同 (第${i + 1}个):`, {
          current: currentTitles[i],
          new: newTitles[i],
        });
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn("⚠️ 检查 sectionTitle 时出错:", error.message);
    return true; // 出错时默认更新
  }
}

/**
 * 合并相关片段，组织成完整的提示词
 */
function mergeRelatedSegments(rawResults) {
  console.log(`🔍 mergeRelatedSegments 开始处理 ${rawResults.length} 条原始数据`);
  const segments = [];
  let currentSegment = null;

  for (let i = 0; i < rawResults.length; i++) {
    const text = rawResults[i].trim();
    console.log(`📝 处理第 ${i + 1} 条数据: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);

    // 检查是否是新的段落开始：第X段: 年份，标题 (年龄：约X岁)
    const segmentMatch = text.match(
      /第(\d+)段[:：]\s*(\d{4})年[，,]?\s*(.+?)\s*\(年龄[:：]\s*约?(\d+)岁\)/
    );

    if (segmentMatch) {
      console.log(`✅ 识别到新段落: ${segmentMatch[0]}`);
      // 保存之前的segment
      if (currentSegment) {
        segments.push(currentSegment);
        console.log(`💾 保存前一个段落: ${currentSegment.title}`);
      }

      // 开始新的segment
      currentSegment = {
        title: `第${segmentMatch[1]}段: ${segmentMatch[2]}年，${segmentMatch[3]} (年龄：约${segmentMatch[4]}岁)`,
        shot: "未识别到镜头描述",
        prompt: "",
        originalText: text,
      };
      console.log(`🆕 创建新段落: ${currentSegment.title}`);
    } else if (
      text.startsWith("视频生成提示词：") ||
      text.includes("视频生成提示词:")
    ) {
      // 这是视频生成提示词内容
      if (currentSegment) {
        const promptText = text.replace(/^视频生成提示词[:：]\s*/, "").trim();
        currentSegment.prompt = promptText;
        currentSegment.originalText += "\n" + text;
      }
    } else if (
      text.startsWith("镜头转换/运动方式：") ||
      text.includes("镜头转换/运动方式:")
    ) {
      // 这是镜头转换/运动方式
      if (currentSegment) {
        const shotText = text.replace(/^镜头转换\/运动方式[:：]\s*/, "").trim();
        currentSegment.shot = shotText;
        currentSegment.originalText += "\n" + text;
      }
    } else if (text.includes("视频比例") || text.includes("总体要求")) {
      // 这是总体要求，单独作为一个segment
      segments.push({
        title: "总体要求",
        shot: "未识别到镜头描述",
        prompt: text,
        originalText: text,
      });
    } else if (currentSegment && text.length > 10) {
      // 其他内容，如果当前有segment，就添加到其中
      currentSegment.originalText += "\n" + text;

      // 如果是多行的提示词或镜头描述，继续添加
      if (!currentSegment.prompt && text.includes("中国人面孔")) {
        currentSegment.prompt = text;
      }
    }
  }

  // 添加最后一个segment
  if (currentSegment) {
    segments.push(currentSegment);
    console.log(`💾 保存最后一个段落: ${currentSegment.title}`);
  }

  console.log(`🎯 mergeRelatedSegments 完成，共生成 ${segments.length} 个段落:`);
  segments.forEach((segment, index) => {
    console.log(`  ${index + 1}. "${segment.title}"`);
  });

  return segments;
}

// runJimengFlow 函数已移至 ./jimeng-generator.mjs

// runDeepSeekFlow 函数已移至 ./deepseek-generator.mjs

/**
 * 下载生成的图片（支持虚拟列表滚动）
 * @param {Object} page - Puppeteer页面对象
 * @param {string} resultSelector - 结果选择器
{{ ... }}
 * @param {number} count - 需要下载的数量
 * @param {string} name - 项目名称
 * @param {number} alreadyDownloaded - 已下载的数量
 * @param {Set} globalDownloadedHashes - 全局哈希集合
 * @param {boolean} useImgUrl - 是否使用图片URL直接下载（而非点击下载按钮）
 * @param {Function} imgResultUrlsFn - 获取图片URL列表的函数
 */
async function downloadGeneratedImages(
  page,
  resultSelector,
  count,
  name,
  alreadyDownloaded = 0,
  globalDownloadedHashes = null,
  useImgUrl = false,
  imgResultUrlsFn = null
) {
  // 创建下载目录
  const downloadDir = path.join("output", name, "images");
  await fs.mkdir(downloadDir, { recursive: true });

  // 设置下载路径和行为
  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadDir,
  });

  console.log("🔍 等待图片生成完成...");
  await page.waitForTimeout(5000);

  console.log(`🎯 开始下载 ${count} 张图片...`);

  // 初始化下载相关变量
  const downloadedUrls = new Set(); // 记录已下载的URL，避免重复
  const downloadedHashes = globalDownloadedHashes || new Set();
  let downloadedCount = 0;

  // 清理可能存在的临时文件
  console.log("🧹 清理临时文件...");
  try {
    const files = await fs.readdir(downloadDir).catch(() => []);
    const tempFiles = files.filter(
      (file) =>
        file.startsWith("jimeng-") && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );
    for (const tempFile of tempFiles) {
      await fs.unlink(path.join(downloadDir, tempFile)).catch(() => {});
      console.log(`🗑️ 删除临时文件: ${tempFile}`);
    }
  } catch (error) {
    console.warn("⚠️ 清理临时文件时出错:", error.message);
  }

  // 如果提供了 img_result_urls 函数且启用了 useImgUrl，优先使用该函数获取URL列表
  if (useImgUrl && imgResultUrlsFn && typeof imgResultUrlsFn === "function") {
    console.log("🔗 使用 img_result_urls 函数获取图片URL列表...");

    try {
      let allImageUrls = new Set(); // 使用Set自动去重
      let scrollAttempts = 0;
      const maxScrollAttempts = 20; // 最大滚动次数
      const targetCount = count; // 目标数量

      while (allImageUrls.size < targetCount && scrollAttempts < maxScrollAttempts) {
        // 执行 img_result_urls 函数获取当前页面的图片URL
        const currentUrls = await page.evaluate(imgResultUrlsFn);
        
        if (Array.isArray(currentUrls)) {
          const beforeSize = allImageUrls.size;
          // 将新获取的URL添加到Set中（自动去重）
          currentUrls.forEach(url => {
            if (url && url.startsWith("http")) {
              allImageUrls.add(url);
            }
          });
          
          const newUrlsCount = allImageUrls.size - beforeSize;
          console.log(`📝 第${scrollAttempts + 1}次获取: 新增${newUrlsCount}个URL，总计${allImageUrls.size}个URL (目标${targetCount}个)`);
          
          // 如果已经达到目标数量，退出循环
          if (allImageUrls.size >= targetCount) {
            console.log(`✅ 已获取到足够的图片URL: ${allImageUrls.size}/${targetCount}`);
            break;
          }
          
          // 如果这次没有获取到新的URL，说明可能需要滚动
          if (newUrlsCount === 0 && scrollAttempts > 0) {
            console.log("⚠️ 未获取到新URL，尝试滚动页面...");
          }
        } else {
          console.log(`⚠️ 第${scrollAttempts + 1}次获取失败，img_result_urls返回非数组`);
        }

        // 如果还没有达到目标数量，滚动页面
        if (allImageUrls.size < targetCount) {
          scrollAttempts++;
          if (scrollAttempts < maxScrollAttempts) {
            console.log(`🖱️ 向上滚动加载更多历史图片... (第${scrollAttempts}次滚动)`);
            
            // 获取滚动前的位置和页面信息
            const scrollInfo = await page.evaluate(() => {
              return {
                scrollY: window.pageYOffset,
                scrollHeight: document.documentElement.scrollHeight,
                clientHeight: document.documentElement.clientHeight,
                canScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight
              };
            });
            console.log(`📍 滚动前位置: ${scrollInfo.scrollY}px`);
            console.log(`📏 页面高度: ${scrollInfo.scrollHeight}px, 视口高度: ${scrollInfo.clientHeight}px`);
            console.log(`🔍 页面可滚动: ${scrollInfo.canScroll ? '是' : '否'}`);
            
            // 持续向上滚动来加载更多历史图片
            await page.evaluate(() => {
              console.log('🔄 执行第一次向上滚动 -800px');
              window.scrollBy(0, -800); // 向上滚动800px
            });
            await page.waitForTimeout(1000); // 等待图片加载
            
            const midScroll = await page.evaluate(() => window.pageYOffset);
            console.log(`📍 第一次滚动后位置: ${midScroll}px`);
            
            // 再向上滚动一些，确保加载更多内容
            await page.evaluate(() => {
              console.log('🔄 执行第二次向上滚动 -400px');
              window.scrollBy(0, -400); // 再向上滚动400px
            });
            await page.waitForTimeout(2000); // 等待图片完全加载
            
            const afterScroll = await page.evaluate(() => window.pageYOffset);
            console.log(`📍 最终滚动位置: ${afterScroll}px (总共滚动了 ${beforeScroll - afterScroll}px)`)
          }
        }
      }

      // 转换Set为数组并下载图片
      const finalImageUrls = Array.from(allImageUrls);
      
      if (finalImageUrls.length > 0) {
        console.log(`📝 最终获取到 ${finalImageUrls.length} 个去重后的图片URL`);

        // 限制下载数量为目标数量
        const urlsToDownload = finalImageUrls.slice(0, targetCount);

        for (let i = 0; i < urlsToDownload.length; i++) {
          const imgUrl = urlsToDownload[i];

          if (downloadedUrls.has(imgUrl)) {
            console.log(`⚠️ 跳过已处理的URL: ${imgUrl}`);
            continue;
          }

          try {
            console.log(`🔗 下载第 ${i + 1} 张图片: ${imgUrl}`);

            const imageBuffer = await downloadImageFromUrl(
              page,
              imgUrl,
              downloadDir,
              null,
              true
            );

            if (imageBuffer) {
              const hash = await calculateImageHash(imageBuffer);

              if (!downloadedHashes.has(hash)) {
                downloadedHashes.add(hash);
                downloadedUrls.add(imgUrl);
                downloadedCount++;

                const detectedFormat = detectImageFormat(imageBuffer, imgUrl);
                const filename = `image_${alreadyDownloaded + downloadedCount}.${detectedFormat}`;
                const finalPath = path.join(downloadDir, filename);

                await fs.writeFile(finalPath, imageBuffer);

                console.log(
                  `✅ 第 ${alreadyDownloaded + downloadedCount} 张图片下载完成 (${filename}) [格式: ${detectedFormat.toUpperCase()}] [URL列表模式]`
                );
              } else {
                console.log(`⚠️ 检测到重复图片内容，跳过`);
              }
            } else {
              console.log(`⚠️ URL下载失败: ${imgUrl}`);
            }
          } catch (urlError) {
            console.warn(`⚠️ 下载图片 ${i + 1} 失败: ${urlError.message}`);
          }
        }

        console.log(`📊 URL列表模式下载结果: ${downloadedCount}/${count}`);
        return downloadedCount;
      } else {
        console.log("⚠️ img_result_urls 函数未获取到任何图片URL，回退到传统模式");
      }
    } catch (fnError) {
      console.warn(
        `⚠️ 执行 img_result_urls 函数失败: ${fnError.message}，回退到传统模式`
      );
    }
  }

  // 传统模式：逐个处理图片元素
  console.log(`🖱️ 使用传统滚动模式`);

  let scrollAttempts = 0;
  const maxScrollAttempts = Math.ceil(count / 4) + 10; // 增加最大滚动次数

  while (downloadedCount < count && scrollAttempts < maxScrollAttempts) {
    console.log(`📜 第 ${scrollAttempts + 1} 次滚动检查...`);

    // 下载当前可见的图片（data-index 0-3）
    for (let i = 0; i < 4; i++) {
      try {
        const specificSelector = resultSelector.replace("*", i.toString());
        const element = await page.$(specificSelector);

        if (!element) continue;

        const imgElement = await element.$("img");
        if (!imgElement) continue;

        // 获取图片的src作为唯一标识
        const imgSrc = await imgElement.evaluate((img) => img.src);

        // 检查是否已处理过这张图片
        if (
          !imgSrc ||
          !imgSrc.startsWith("http") ||
          downloadedUrls.has(imgSrc)
        ) {
          continue;
        }

        console.log(`🖱️ 开始处理第 ${i} 张图片...`);

        if (useImgUrl) {
          // 使用图片URL直接下载模式
          console.log(`🔗 使用图片URL直接下载模式...`);

          try {
            // 直接使用图片的src URL进行下载
            const imageBuffer = await downloadImageFromUrl(
              page,
              imgSrc,
              downloadDir,
              null, // 不指定文件名，让函数自动处理
              true // 返回buffer
            );

            if (imageBuffer) {
              // 计算图片内容哈希
              const hash = await calculateImageHash(imageBuffer);

              // 检查内容哈希是否重复
              if (!downloadedHashes.has(hash)) {
                downloadedHashes.add(hash);
                downloadedUrls.add(imgSrc);
                downloadedCount++;

                // 检测图片格式并保存
                const detectedFormat = detectImageFormat(imageBuffer, imgSrc);
                const filename = `image_${alreadyDownloaded + downloadedCount}.${detectedFormat}`;
                const finalPath = path.join(downloadDir, filename);

                await fs.writeFile(finalPath, imageBuffer);

                console.log(
                  `✅ 第 ${alreadyDownloaded + downloadedCount} 张图片下载完成 (${filename}) [格式: ${detectedFormat.toUpperCase()}] [URL模式]`
                );

                // 如果已下载足够数量，退出
                if (downloadedCount >= count) {
                  break;
                }
              } else {
                console.log(`⚠️ 检测到重复图片内容，跳过`);
              }
            } else {
              console.log(`⚠️ URL下载失败，跳过第 ${i} 张图片`);
            }
          } catch (urlError) {
            console.warn(
              `⚠️ URL下载模式失败: ${urlError.message}，跳过第 ${i} 张图片`
            );
          }
        } else {
          // 传统的点击下载模式
          console.log(`📍 Hover到图片上显示下载按钮...`);
          await imgElement.hover();

          // 等待SVG下载按钮出现
          await page.waitForTimeout(500);

          // 2. 查找SVG下载按钮（在当前element内查找）
          const svgElement = await element.$("svg");
          if (!svgElement) {
            console.log(`⚠️ 未找到SVG下载按钮，跳过第 ${i} 张图片`);
            continue;
          }

          console.log(`🎯 找到SVG下载按钮，准备点击下载...`);

          // 3. 点击SVG下载按钮（不要移开鼠标，保持hover状态）
          // 监听下载事件
          const downloadPromise = new Promise(async (resolve) => {
            const client = await page.target().createCDPSession();

            client.on("Page.downloadWillBegin", (event) => {
              console.log(`📥 开始下载: ${event.url}`);
              resolve(event.url);
            });

            // 启用页面域
            await client.send("Page.enable");

            // 设置超时
            setTimeout(() => resolve(null), 10000);
          });

          // 点击SVG下载按钮
          await svgElement.click();

          // 等待下载开始
          const downloadUrl = await downloadPromise;

          if (downloadUrl) {
            downloadedUrls.add(imgSrc);

            // 等待下载完成并获取文件
            await page.waitForTimeout(2000);

            // 尝试从下载目录获取最新下载的文件（排除已重命名的image_X.jpg文件）
            const files = await fs.readdir(downloadDir).catch(() => []);
            const imageFiles = files.filter(
              (file) =>
                /\.(jpg|jpeg|png|gif|webp)$/i.test(file) &&
                !file.startsWith("image_") // 排除已重命名的文件
            );

            if (imageFiles.length > 0) {
              // 获取最新的图片文件
              const stats = await Promise.all(
                imageFiles.map(async (file) => ({
                  file,
                  mtime: (await fs.stat(path.join(downloadDir, file))).mtime,
                }))
              );

              const latestFile = stats.sort((a, b) => b.mtime - a.mtime)[0];
              const latestFilePath = path.join(downloadDir, latestFile.file);

              // 读取文件内容并计算哈希
              const imageBuffer = await fs.readFile(latestFilePath);
              const hash = await calculateImageHash(imageBuffer);

              // 检查内容哈希是否重复
              if (!downloadedHashes.has(hash)) {
                downloadedHashes.add(hash);
                downloadedCount++;

                // 检测图片格式
                const detectedFormat = detectImageFormat(imageBuffer, imgSrc);
                const filename = `image_${alreadyDownloaded + downloadedCount}.${detectedFormat}`;
                const finalPath = path.join(downloadDir, filename);

                // 重命名文件
                await fs.rename(latestFilePath, finalPath);

                console.log(
                  `✅ 第 ${alreadyDownloaded + downloadedCount} 张高清图片下载完成 (${filename}) [格式: ${detectedFormat.toUpperCase()}] [点击模式]`
                );

                // 如果已下载足够数量，退出
                if (downloadedCount >= count) {
                  break;
                }
              } else {
                console.log(`⚠️ 检测到重复图片内容，删除重复文件`);
                await fs.unlink(latestFilePath).catch(() => {});
              }
            } else {
              console.log(`⚠️ 下载完成但未找到图片文件`);
            }
          } else {
            console.log(`⚠️ SVG点击后未检测到下载，跳过第 ${i} 张图片`);
          }

          // 短暂等待避免操作过快
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.warn(`⚠️ 处理第 ${i} 个元素时出错: ${error.message}`);
      }
    }

    // 如果还需要更多图片，尝试滚动加载更多内容
    if (downloadedCount < count) {
      console.log(
        `📤 尝试滚动加载更多图片... (已下载: ${downloadedCount}/${count})`
      );

      // 增强的鼠标滚轮滚动
      console.log(`🖱️ 执行第 ${scrollAttempts + 1} 次增强向上滚动`);

      // 先移动鼠标到页面中央
      await page.mouse.move(500, 400);

      // 适度单次向上滚动幅度
      await page.mouse.wheel({ deltaY: -100 }); // 适度向上滚动幅度
      console.log(`   📜 适度向上滚动`);
      await page.waitForTimeout(1200); // 适度等待时间
      console.log("🖱️ 鼠标滚轮向上滚动");

      await page.waitForTimeout(3000); // 增加等待时间
      scrollAttempts++;
    } else {
      break;
    }
  }

  console.log(`📁 图片已保存到: ${downloadDir}`);
  console.log(`✅ 成功下载 ${downloadedCount} 张图片`);

  if (downloadedCount < count) {
    console.warn(`⚠️ 预期下载 ${count} 张，实际下载 ${downloadedCount} 张`);
  }

  return downloadedCount; // 返回实际下载的图片数量
}

/**
 * 计算图片内容的哈希值
 */
async function calculateImageHash(imageBuffer) {
  const crypto = await import("crypto");
  const hash = crypto.createHash("md5");
  hash.update(imageBuffer);
  return hash.digest("hex");
}

/**
 * 从 segment title 中提取年龄信息
 */
function extractAgeFromTitle(title) {
  if (!title || typeof title !== "string") {
    return null;
  }

  // 匹配各种年龄格式：
  // - "1974/0岁" (年份/年龄格式)
  // - "年龄：约25岁"
  // - "年龄：25岁"
  // - "25岁"
  // - "约25岁"
  const agePatterns = [
    /\d{4}\/(\d+)岁/, // 1974/0岁 格式
    /年龄[:：]\s*约?(\d+)岁/, // 年龄：约25岁
    /约?(\d+)岁/, // 约25岁 或 25岁
    /(\d+)\s*岁/, // 25 岁
  ];

  for (const pattern of agePatterns) {
    const match = title.match(pattern);
    if (match) {
      const age = parseInt(match[1]);
      if (age >= 0 && age < 150) {
        // 合理的年龄范围，包含0岁
        console.log(`📊 从标题 "${title}" 中提取到年龄: ${age}岁`);
        return age;
      }
    }
  }

  console.log(`⚠️ 无法从标题 "${title}" 中提取年龄信息`);
  return null;
}

/**
 * 删除已有的参考图片（增强版）
 * 确保一次只有一张参考图，新图片会替换旧图片
 */
async function removeExistingReferenceImage(
  page,
  imgContainerSelector,
  imgCloseSelector
) {
  try {
    console.log("🔍 检查并删除所有已有的参考图片...");

    // 查找所有可能的参考图片容器
    const imgContainers = await page.$$(imgContainerSelector);
    if (imgContainers.length === 0) {
      console.log("✅ 未找到参考图片容器，无需删除");
      return true;
    }

    console.log(`🔍 找到 ${imgContainers.length} 个参考图片容器`);
    let deletedCount = 0;

    // 遍历所有容器，删除其中的图片
    for (let i = 0; i < imgContainers.length; i++) {
      const imgContainer = imgContainers[i];

      // 检查容器中是否有图片
      const existingImgs = await imgContainer.$$("img");
      if (existingImgs.length === 0) {
        continue;
      }

      console.log(
        `🗑️ 容器 ${i + 1} 中发现 ${existingImgs.length} 张参考图片，开始删除...`
      );

      // 删除容器中的所有图片
      for (let j = 0; j < existingImgs.length; j++) {
        const existingImg = existingImgs[j];

        try {
          // 确保图片可见并滚动到视图中
          await existingImg.scrollIntoView();
          await page.waitForTimeout(300);

          // 模拟鼠标悬停到图片上
          console.log(`🖱️ 鼠标悬停到参考图片 ${j + 1} 上...`);
          await existingImg.hover();

          // 等待悬停效果生效，让删除按钮显示出来
          await page.waitForTimeout(1000);

          // 多种方式查找删除按钮
          let closeButton = null;

          // 方式1: 在当前容器内查找
          const containerCloseButtons = await imgContainer.$$(
            "svg, button, [role='button'], .close, .delete, .remove"
          );
          for (const btn of containerCloseButtons) {
            const isVisible = await btn.isIntersectingViewport();
            if (isVisible) {
              closeButton = btn;
              break;
            }
          }

          // 方式2: 使用配置的选择器
          if (!closeButton) {
            closeButton = await page.$(imgCloseSelector);
          }

          // 方式3: 查找悬停后出现的删除按钮
          if (!closeButton) {
            const hoverButtons = await page.$$(
              "svg[style*='opacity'], button[style*='opacity'], [class*='close'][style*='opacity']"
            );
            if (hoverButtons.length > 0) {
              closeButton = hoverButtons[0];
            }
          }

          if (closeButton) {
            // 确保删除按钮可见
            const isVisible = await closeButton.isIntersectingViewport();
            if (!isVisible) {
              await closeButton.scrollIntoView();
              await page.waitForTimeout(200);
            }

            console.log(`🎯 找到删除按钮，准备点击删除图片 ${j + 1}...`);
            await closeButton.click();
            console.log(`✅ 成功点击删除按钮`);

            // 等待删除动画完成
            await page.waitForTimeout(2000);
            deletedCount++;
          } else {
            console.log(`⚠️ 未找到图片 ${j + 1} 的删除按钮，尝试键盘删除...`);

            // 尝试使用键盘删除（选中图片后按Delete键）
            await existingImg.click();
            await page.waitForTimeout(300);
            await page.keyboard.press("Delete");
            await page.waitForTimeout(1000);

            // 检查是否删除成功
            const stillExists = await imgContainer.$("img");
            if (!stillExists) {
              console.log(`✅ 键盘删除成功`);
              deletedCount++;
            }
          }
        } catch (imgError) {
          console.warn(`⚠️ 删除图片 ${j + 1} 时出错: ${imgError.message}`);
        }
      }
    }

    // 最终验证：检查是否还有残留的参考图片
    await page.waitForTimeout(1000);
    const remainingImgs = await page.$$(imgContainerSelector + " img");

    if (remainingImgs.length === 0) {
      console.log(`✅ 成功删除了 ${deletedCount} 张参考图片，容器已清空`);
      return true;
    } else {
      console.log(
        `⚠️ 仍有 ${remainingImgs.length} 张参考图片未删除，尝试强制清理...`
      );

      // 强制清理：尝试删除所有残留图片
      for (const remainingImg of remainingImgs) {
        try {
          await remainingImg.hover();
          await page.waitForTimeout(500);

          // 查找并点击任何可能的删除按钮
          const allDeleteButtons = await page.$$(
            "svg, button, [role='button']"
          );
          for (const btn of allDeleteButtons) {
            try {
              const isVisible = await btn.isIntersectingViewport();
              if (isVisible) {
                await btn.click();
                await page.waitForTimeout(1000);
                break;
              }
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          continue;
        }
      }

      return false;
    }
  } catch (error) {
    console.warn(`⚠️ 删除已有参考图片失败: ${error.message}`);
    return false;
  }
}

/**
 * 根据年龄上传对应的参考图片（一次只保留一张）
 */
async function uploadReferenceImage(
  page,
  uploadSelector,
  segment,
  projectName,
  imgContainerSelector,
  imgCloseSelector
) {
  try {
    if (!segment || !segment.title) {
      console.log("⚠️ segment 或 title 为空，跳过参考图片上传");
      return;
    }

    console.log("🖼️ 开始参考图片替换流程（确保一次只有一张参考图）...");

    // 先强制删除所有已有的参考图片
    if (imgContainerSelector && imgCloseSelector) {
      const deleteSuccess = await removeExistingReferenceImage(
        page,
        imgContainerSelector,
        imgCloseSelector
      );

      if (!deleteSuccess) {
        console.log("⚠️ 删除已有参考图片未完全成功，但继续上传新图片");
      }

      // 额外等待，确保删除操作完全完成
      await page.waitForTimeout(2000);
    }

    // 提取年龄信息
    const age = extractAgeFromTitle(segment.title);
    if (age === null) {
      console.log("⚠️ 未找到年龄信息，跳过参考图片上传");
      return;
    }

    // 根据年龄选择图片基础名称
    let baseImageName;
    if (age >= 0 && age < 20) {
      baseImageName = "少年";
      console.log(`👦 年龄 ${age}岁，选择少年照片`);
    } else if (age >= 20 && age <= 30) {
      baseImageName = "青年";
      console.log(`👨 年龄 ${age}岁，选择青年照片`);
    } else if (age > 30 && age <= 50) {
      baseImageName = "中年";
      console.log(`👨 年龄 ${age}岁，选择中年照片`);
    } else if (age > 50) {
      baseImageName = "老年";
      console.log(`👴 年龄 ${age}岁，选择老年照片`);
    } else {
      console.log(`⚠️ 年龄 ${age}岁 超出范围，跳过参考图片上传`);
      return;
    }

    // 智能查找实际存在的图片文件（支持多种格式）
    const possibleExtensions = ["png", "jpg", "jpeg", "webp", "gif"];
    let imageName = null;
    let imagePath = null;

    // 构建输出目录路径
    const outputDir = path.join(process.cwd(), "output", projectName);

    for (const ext of possibleExtensions) {
      const testName = `${baseImageName}.${ext}`;
      const testPath = path.join(outputDir, testName);
      try {
        await fs.access(testPath);
        imageName = testName;
        imagePath = testPath;
        console.log(`✅ 找到参考图片: ${imageName}`);
        break;
      } catch (error) {
        // 文件不存在，继续尝试下一个扩展名
      }
    }

    if (!imageName) {
      console.log(
        `⚠️ 未找到 ${baseImageName} 的参考图片（尝试了格式: ${possibleExtensions.join(", ")}），跳过上传`
      );
      return;
    }

    // imagePath 已经在上面的循环中设置了，直接使用
    console.log(`✅ 准备上传参考图片: ${imagePath}`);

    // 查找上传区域
    console.log(`🔍 查找参考图片上传区域: ${uploadSelector}`);
    const uploadElements = await page.$$(uploadSelector);

    if (uploadElements.length === 0) {
      console.log(`⚠️ 未找到参考图片上传区域，选择器: ${uploadSelector}`);
      return;
    }

    // 使用第一个上传元素
    const uploadElement = uploadElements[0];

    // 查找文件输入框
    const fileInput = await uploadElement.$('input[type="file"]');
    if (!fileInput) {
      console.log("⚠️ 未找到文件输入框，尝试点击上传区域");

      // 尝试点击上传区域来触发文件选择
      await uploadElement.click();
      await page.waitForTimeout(1000);

      // 再次查找文件输入框
      const newFileInput = await page.$('input[type="file"]');
      if (newFileInput) {
        await newFileInput.uploadFile(imagePath);
        console.log(`✅ 成功上传参考图片: ${imageName}`);
      } else {
        console.log("⚠️ 点击后仍未找到文件输入框");
      }
    } else {
      // 直接上传文件
      console.log(`🔍 准备上传文件: ${imagePath} (类型: ${typeof imagePath})`);
      if (typeof imagePath !== 'string') {
        console.error(`❌ imagePath 不是字符串:`, imagePath);
        throw new Error(`imagePath 必须是字符串，但收到: ${typeof imagePath}`);
      }
      await fileInput.uploadFile(imagePath);
      console.log(`✅ 成功上传参考图片: ${imageName}`);
    }

    // 等待上传完成
    await page.waitForTimeout(3000);

    // 验证上传是否成功
    console.log("🔍 验证参考图片上传状态...");
    const uploadedImgs = await page.$$(imgContainerSelector + " img");

    if (uploadedImgs.length === 1) {
      console.log("✅ 参考图片上传成功，当前只有一张参考图");
    } else if (uploadedImgs.length > 1) {
      console.log(
        `⚠️ 检测到 ${uploadedImgs.length} 张参考图，应该只有一张。尝试清理多余图片...`
      );

      // 删除多余的图片，只保留最后一张
      for (let i = 0; i < uploadedImgs.length - 1; i++) {
        try {
          const imgToRemove = uploadedImgs[i];
          await imgToRemove.hover();
          await page.waitForTimeout(500);

          const deleteBtn = await page.$(imgCloseSelector);
          if (deleteBtn) {
            await deleteBtn.click();
            await page.waitForTimeout(1000);
          }
        } catch (e) {
          console.warn(`⚠️ 清理多余图片 ${i + 1} 失败: ${e.message}`);
        }
      }

      // 再次验证
      const finalImgs = await page.$$(imgContainerSelector + " img");
      console.log(`🔍 清理后剩余参考图数量: ${finalImgs.length}`);
    } else {
      console.log("⚠️ 参考图片上传可能失败，未检测到图片");
    }
  } catch (error) {
    console.warn(`⚠️ 上传参考图片失败: ${error.message}`);
    // 不抛出错误，继续执行后续流程
  }
}

/**
 * 检测图片格式并返回正确的扩展名
 */
function detectImageFormat(buffer, url) {
  // 检查文件头魔数
  if (buffer.length >= 8) {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "png";
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "jpg";
    }
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return "webp";
    }
    // GIF: 47 49 46 38
    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return "gif";
    }
  }

  // 如果魔数检测失败，尝试从URL推断
  const urlLower = url.toLowerCase();
  if (urlLower.includes(".png")) return "png";
  if (urlLower.includes(".jpg") || urlLower.includes(".jpeg")) return "jpg";
  if (urlLower.includes(".webp")) return "webp";
  if (urlLower.includes(".gif")) return "gif";

  // 默认返回jpg
  return "jpg";
}

/**
 * 从URL下载图片（使用fetch避免页面跳转）
 */
async function downloadImageFromUrl(
  page,
  imageUrl,
  downloadDir,
  filename,
  returnBuffer = false
) {
  try {
    // 使用页面的fetch API下载图片，避免页面跳转
    const buffer = await page.evaluate(async (url) => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return Array.from(new Uint8Array(arrayBuffer));
    }, imageUrl);

    const imageBuffer = Buffer.from(buffer);

    if (returnBuffer) {
      return imageBuffer;
    }

    if (filename) {
      // 检测图片格式并调整文件扩展名
      const detectedFormat = detectImageFormat(imageBuffer, imageUrl);
      const baseFilename = filename.replace(/\.[^.]+$/, ""); // 移除原扩展名
      const correctedFilename = `${baseFilename}.${detectedFormat}`;

      const filePath = path.join(downloadDir, correctedFilename);
      await fs.writeFile(filePath, imageBuffer);

      console.log(
        `📁 图片格式: ${detectedFormat.toUpperCase()}, 保存为: ${correctedFilename}`
      );

      return {
        buffer: imageBuffer,
        filename: correctedFilename,
        format: detectedFormat,
      };
    }

    return imageBuffer;
  } catch (error) {
    console.warn(`⚠️ 从URL下载图片失败: ${error.message}`);
    // 如果fetch失败，尝试传统方法
    try {
      const currentUrl = page.url();
      const response = await page.goto(imageUrl);
      const responseBuffer = await response.buffer();

      if (returnBuffer) {
        return responseBuffer;
      }

      if (filename) {
        // 检测图片格式并调整文件扩展名
        const detectedFormat = detectImageFormat(responseBuffer, imageUrl);
        const baseFilename = filename.replace(/\.[^.]+$/, ""); // 移除原扩展名
        const correctedFilename = `${baseFilename}.${detectedFormat}`;

        const filePath = path.join(downloadDir, correctedFilename);
        await fs.writeFile(filePath, responseBuffer);

        console.log(
          `📁 图片格式: ${detectedFormat.toUpperCase()}, 保存为: ${correctedFilename}`
        );
      }

      // 返回原页面
      await page.goto(currentUrl);
      await page.waitForTimeout(500);

      return responseBuffer;
    } catch (fallbackError) {
      console.warn(`⚠️ 备用下载方法也失败: ${fallbackError.message}`);
      return null;
    }
  }
}

/**
{{ ... }}
 */
async function downloadAllVisibleImages(page, downloadDir) {
  try {
    // 查找所有图片元素
    const images = await page.$$("img");
    let downloadCount = 0;

    for (let i = 0; i < images.length; i++) {
      try {
        const img = images[i];
        const src = await img.evaluate((el) => el.src);

        // 过滤掉小图标和无效图片
        const width = await img.evaluate((el) => el.naturalWidth);
        const height = await img.evaluate((el) => el.naturalHeight);

        if (width > 200 && height > 200 && src && src.startsWith("http")) {
          console.log(`📥 发现图片: ${width}x${height}, 正在下载...`);
          const result = await downloadImageFromUrl(
            page,
            src,
            downloadDir,
            `generated_image_${downloadCount + 1}.jpg`
          );

          if (result && result.filename) {
            console.log(
              `✅ 备用方法下载完成: ${result.filename} [格式: ${result.format.toUpperCase()}]`
            );
          }
          downloadCount++;

          // 限制下载数量，避免下载过多无关图片
          if (downloadCount >= 20) break;
        }
      } catch (error) {
        continue;
      }
    }

    console.log(`✅ 备用方法下载了 ${downloadCount} 张图片`);
  } catch (error) {
    console.warn(`⚠️ 备用下载方法失败: ${error.message}`);
  }
}

// runJimengVideoFlow 函数已移至 ./jimeng-video-generator.mjs
