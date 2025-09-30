import "zx/globals";
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

/**
 * 清理浏览器用户数据，强制重新登录
 */
export async function clearBrowserData() {
  const deepseekUserDataDir = path.join(
    process.cwd(),
    "browser-data",
    "deepseek-profile"
  );
  const jimengUserDataDir = path.join(
    process.cwd(),
    "browser-data",
    "jimeng-profile"
  );

  let success = true;

  try {
    await fs.rm(deepseekUserDataDir, { recursive: true, force: true });
    console.log("🧹 DeepSeek 浏览器数据已清理");
  } catch (error) {
    console.warn("⚠️ 清理 DeepSeek 浏览器数据时出错:", error.message);
    success = false;
  }

  try {
    await fs.rm(jimengUserDataDir, { recursive: true, force: true });
    console.log("🧹 即梦浏览器数据已清理");
  } catch (error) {
    console.warn("⚠️ 清理即梦浏览器数据时出错:", error.message);
    success = false;
  }

  if (success) {
    console.log("✅ 所有浏览器数据已清理，下次运行将需要重新登录");
  }

  return success;
}

/**
 * 使用无头浏览器自动化 DeepSeek 对话，获取视频生成提示词
 * @param {Object} config - 配置对象
 */
export default async function runAutoDeepseekJimeng(config) {
  console.log("🚀 启动 auto-deepseek-jimeng 功能...");

  const { deepseek, jimeng } = config;
  if (!deepseek) {
    throw new Error("配置中缺少 deepseek 配置项");
  }

  // 检查本地是否已有数据
  const localDataExists = await checkLocalData(
    jimeng?.name || deepseek.send_msg_template_data?.name
  );

  let processedData;
  if (localDataExists) {
    console.log("✅ 发现本地数据，跳过 DeepSeek 步骤");
    processedData = await loadLocalData(
      jimeng?.name || deepseek.send_msg_template_data?.name
    );
  } else {
    console.log("🔍 未发现本地数据，开始 DeepSeek 流程");
    processedData = await runDeepSeekFlow(deepseek);
  }

  // 如果有即梦配置，执行即梦自动化
  if (jimeng) {
    console.log("🎨 开始即梦自动化流程...");
    await runJimengFlow(jimeng, processedData);
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
  } catch (error) {
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

/**
 * 运行 DeepSeek 流程
 */
async function runDeepSeekFlow(deepseek) {
  const {
    url,
    persistLogin = true, // 默认启用登录状态持久化
    login_selector,
    login_data,
    chat_selector,
    send_chat_selector,
    send_msg_template,
    send_msg_template_data,
    get_deepseek_result_time,
    deepseek_result_txt_fn,
  } = deepseek;

  // 验证必需的配置
  if (!url || !chat_selector || !send_msg_template || !send_msg_template_data) {
    throw new Error("DeepSeek 配置不完整，请检查必需字段");
  }

  // 准备浏览器启动配置
  let launchConfig = {
    headless: false, // 设为 false 以便调试
    defaultViewport: null,
    args: [
      "--start-maximized",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
    ],
  };

  // 如果启用登录状态持久化，创建用户数据目录
  if (persistLogin) {
    const userDataDir = path.join(
      process.cwd(),
      "browser-data",
      "deepseek-profile"
    );
    await fs.mkdir(userDataDir, { recursive: true });
    launchConfig.userDataDir = userDataDir;
    console.log("🔐 启用登录状态持久化，用户数据保存在:", userDataDir);
  } else {
    console.log("🔓 未启用登录状态持久化，每次都需要重新登录");
  }

  // 尝试启动浏览器，处理不同的 Chrome 安装情况
  let browser;
  try {
    browser = await puppeteer.launch(launchConfig);
  } catch (error) {
    console.log("⚠️ 使用默认 Chrome 失败，尝试查找系统 Chrome...");

    // 常见的 Chrome 安装路径
    const chromePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    ];

    let chromeFound = false;
    for (const chromePath of chromePaths) {
      try {
        const fs = await import("fs");
        if (fs.existsSync(chromePath)) {
          console.log(`✅ 找到 Chrome: ${chromePath}`);
          launchConfig.executablePath = chromePath;
          browser = await puppeteer.launch(launchConfig);
          chromeFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!chromeFound) {
      throw new Error(`
Chrome 浏览器未找到。请选择以下解决方案之一：

1. 安装 Puppeteer 的 Chrome:
   npx puppeteer browsers install chrome

2. 安装 Google Chrome 浏览器:
   https://www.google.com/chrome/

3. 手动指定 Chrome 路径（修改 auto-deepseek-jimeng.mjs 文件）

原始错误: ${error.message}
      `);
    }
  }

  try {
    const page = await browser.newPage();

    // 设置用户代理
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("📖 正在打开 DeepSeek 网站...");
    await page.goto(url, { waitUntil: "networkidle2" });

    // 添加调试信息：显示当前页面标题和URL
    const pageTitle = await page.title();
    const currentUrl = page.url();
    console.log(`📄 页面标题: ${pageTitle}`);
    console.log(`🔗 当前URL: ${currentUrl}`);

    // 检查是否需要登录
    console.log("🔍 检查登录状态...");
    const needLogin = await checkNeedLogin(page, login_selector, chat_selector);

    if (needLogin) {
      console.log("🔐 需要登录，正在执行登录流程...");
      await performLogin(page, login_selector, login_data);

      // 等待登录完成，重新导航到聊天页面
      console.log("⏳ 等待登录完成...");
      await page.waitForTimeout(5000);
      await page.goto(url, { waitUntil: "networkidle2" });

      // 再次检查聊天界面是否加载
      console.log("🔍 验证登录是否成功...");
      try {
        await page.waitForSelector(chat_selector, { timeout: 10000 });
        console.log("✅ 登录成功，找到聊天输入框");
      } catch (error) {
        throw new Error(`登录后仍无法找到聊天输入框。可能的原因：
1. 登录失败（用户名密码错误）
2. 需要验证码
3. 页面选择器已更新
4. 网络延迟过长

请检查浏览器窗口或手动登录后重试。`);
      }
    } else {
      console.log("✅ 已登录，跳过登录流程");
      // 等待聊天界面加载
      console.log("⏳ 等待聊天界面加载...");
      await page.waitForSelector(chat_selector, { timeout: 10000 });
    }

    // 构建发送消息
    const message = buildMessage(send_msg_template, send_msg_template_data);
    console.log("📝 准备发送消息:", message.substring(0, 100) + "...");

    // 发送消息
    await sendMessage(page, chat_selector, send_chat_selector, message);

    // 等待 DeepSeek 回复
    console.log(`⏱️ 等待 ${get_deepseek_result_time} 秒获取 DeepSeek 回复...`);
    await page.waitForTimeout(get_deepseek_result_time * 1000);

    // 获取结果
    console.log("📥 正在提取 DeepSeek 回复内容...");
    const results = await extractResults(page, deepseek_result_txt_fn);

    // 处理和保存结果
    const processedData = await processAndSaveResults(
      results,
      send_msg_template_data
    );

    console.log("✅ auto-deepseek-jimeng 执行完成！");
    console.log(`📁 结果已保存到: output/${send_msg_template_data.name}/`);

    return processedData;
  } finally {
    await browser.close();
  }
}

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
  // 点击输入框并输入消息
  await page.click(chat_selector);
  await page.type(chat_selector, message);

  // 等待一下让消息完全输入
  await page.waitForTimeout(1000);

  // 点击发送按钮
  try {
    // 尝试使用配置的选择器
    await page.waitForSelector(send_chat_selector, { timeout: 1000 });
    await page.click(send_chat_selector);
  } catch (error) {
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
        sent = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!sent) {
      // 最后尝试按 Enter 键
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
  const { name, timeNum } = templateData;
  const outputDir = path.join("output", name);

  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true });

  // 过滤和处理结果，确保获得指定数量的段落
  let processedResults = results
    .filter((text) => text.trim().length > 10) // 过滤太短的文本
    .slice(0, timeNum); // 取前 timeNum 段

  if (processedResults.length < timeNum) {
    console.warn(
      `⚠️ 只获取到 ${processedResults.length} 段内容，期望 ${timeNum} 段`
    );
  }

  // 重新组织数据，合并相关片段
  const extractedData = {
    segments: [],
    rawResults: processedResults,
  };

  // 智能合并相关片段
  const mergedSegments = mergeRelatedSegments(processedResults);

  mergedSegments.forEach((segment, index) => {
    extractedData.segments.push({
      index: index + 1,
      title: segment.title,
      shot: segment.shot,
      prompt: segment.prompt,
      originalText: segment.originalText,
    });
  });

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
  const textOutputPath = path.join(outputDir, "segments.txt");
  const textContent = extractedData.segments
    .map(
      (segment) =>
        `=== 第${segment.index}段 ===\n` +
        `标题: ${segment.title}\n` +
        `镜头: ${segment.shot}\n` +
        `提示词: ${segment.prompt}\n` +
        `原文: ${segment.originalText}\n\n`
    )
    .join("");

  await fs.writeFile(textOutputPath, textContent, "utf8");

  console.log(`📊 处理完成，共 ${extractedData.segments.length} 段内容`);
  console.log(`📄 文件已保存:`);
  console.log(`   - ${rawResultsPath}`);
  console.log(`   - ${processedDataPath}`);
  console.log(`   - ${textOutputPath}`);

  return extractedData;
}

/**
 * 合并相关片段，组织成完整的提示词
 */
function mergeRelatedSegments(rawResults) {
  const segments = [];
  let currentSegment = null;

  for (let i = 0; i < rawResults.length; i++) {
    const text = rawResults[i].trim();

    // 检查是否是新的段落开始：第X段: 年份，标题 (年龄：约X岁)
    const segmentMatch = text.match(
      /第(\d+)段[:：]\s*(\d{4})年[，,]?\s*(.+?)\s*\(年龄[:：]\s*约?(\d+)岁\)/
    );

    if (segmentMatch) {
      // 保存之前的segment
      if (currentSegment) {
        segments.push(currentSegment);
      }

      // 开始新的segment
      currentSegment = {
        title: `第${segmentMatch[1]}段: ${segmentMatch[2]}年，${segmentMatch[3]} (年龄：约${segmentMatch[4]}岁)`,
        shot: "未识别到镜头描述",
        prompt: "",
        originalText: text,
      };
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
  }

  return segments;
}

/**
 * 运行即梦自动化流程
 */
async function runJimengFlow(jimeng, processedData) {
  const {
    url,
    login_selector,
    generate_button_selector,
    img_generate_input_selector,
    img_generate_input_send_selector,
    gernerate_img_result_selector,
  } = jimeng;

  // 验证必需的配置
  if (!url) {
    throw new Error("即梦配置不完整，请检查必需字段");
  }

  // 创建即梦专用的用户数据目录来保存登录状态
  const jimengUserDataDir = path.join(
    process.cwd(),
    "browser-data",
    "jimeng-profile"
  );
  await fs.mkdir(jimengUserDataDir, { recursive: true });

  // 准备浏览器启动配置
  let launchConfig = {
    headless: false, // 设为 false 以便调试
    defaultViewport: null,
    args: [
      "--start-maximized",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
    ],
    userDataDir: jimengUserDataDir, // 使用持久化的用户数据目录
  };

  // 启动浏览器
  let browser;
  try {
    browser = await puppeteer.launch(launchConfig);
  } catch (error) {
    console.log("⚠️ 使用默认 Chrome 失败，尝试查找系统 Chrome...");

    // 常见的 Chrome 安装路径
    const chromePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    ];

    let chromeFound = false;
    for (const chromePath of chromePaths) {
      try {
        const fs = await import("fs");
        if (fs.existsSync(chromePath)) {
          console.log(`✅ 找到 Chrome: ${chromePath}`);
          launchConfig.executablePath = chromePath;
          browser = await puppeteer.launch(launchConfig);
          chromeFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!chromeFound) {
      throw new Error(`Chrome 浏览器未找到: ${error.message}`);
    }
  }

  try {
    const page = await browser.newPage();

    // 设置用户代理
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("🌐 正在打开即梦网站...");
    await page.goto(url, { waitUntil: "networkidle2" });

    // 检查登录状态
    console.log("🔍 检查登录状态...");
    await page.waitForTimeout(3000); // 等待页面完全加载

    // 检查是否有登录按钮（如果有说明未登录）
    const loginButton = await page.$(
      login_selector?.login_button || "#SiderMenuLogin"
    );
    if (loginButton) {
      console.log("🔐 检测到登录按钮，点击登录按钮...");
      await loginButton.click();
      await page.waitForTimeout(2000);

      // 检查是否有同意政策按钮
      const agreeButton = await page.$(
        login_selector?.agree_policy ||
          "div.zoomModal-enter-done .lv-btn-primary"
      );
      if (agreeButton) {
        console.log("📋 点击同意政策按钮...");
        await agreeButton.click();
        await page.waitForTimeout(2000);
      }

      console.log("⏰ 请在60秒内完成扫码登录，并手动切换到图片生成界面...");
      console.log("🔍 等待登录完成和页面切换...");

      // 等待60秒让用户手动登录
      await page.waitForTimeout(60000);

      console.log("✅ 等待时间结束，继续执行自动化流程...");
    } else {
      console.log("✅ 未发现登录按钮，可能已登录");
    }

    // 点击生成按钮
    console.log("🎯 点击生成按钮...");
    try {
      await page.waitForSelector(generate_button_selector, { timeout: 10000 });
      await page.click(generate_button_selector);
    } catch (error) {
      console.warn("⚠️ 未找到生成按钮，尝试其他选择器...");
      // 尝试其他可能的选择器
      const alternativeSelectors = [
        "#AIGeneratedRecord",
        '[data-testid="generate-button"]',
        ".generate-btn",
        'button:contains("生成")',
      ];

      let buttonFound = false;
      for (const selector of alternativeSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          await page.click(selector);
          buttonFound = true;
          console.log(`✅ 使用选择器 ${selector} 成功点击生成按钮`);
          break;
        } catch (e) {
          continue;
        }
      }

      if (!buttonFound) {
        throw new Error("无法找到生成按钮，请检查页面状态或选择器配置");
      }
    }

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 获取提示词列表
    const prompts = processedData.segments.map(
      (segment) => segment.prompt || segment.originalText
    );
    console.log(`📝 准备发送 ${prompts.length} 个提示词`);

    // 逐个发送提示词
    for (let i = 0; i < prompts.length; i++) {
      try {
        const prompt = prompts[i];
        console.log(
          `📤 发送第 ${i + 1} 个提示词: ${prompt.substring(0, 50)}...`
        );

        // 检查页面是否仍然可用
        if (page.isClosed()) {
          throw new Error("页面已关闭，无法继续发送提示词");
        }

        // 等待页面稳定
        await page.waitForTimeout(500);

        // 选择页面最后一个 textarea
        const textareas = await page.$$("textarea");
        if (textareas.length === 0) {
          console.warn(`⚠️ 第 ${i + 1} 次未找到 textarea，尝试刷新页面...`);
          await page.reload({ waitUntil: "networkidle2" });
          await page.waitForTimeout(2000);

          const retryTextareas = await page.$$("textarea");
          if (retryTextareas.length === 0) {
            throw new Error("刷新后仍未找到 textarea 输入框");
          }
        }

        // 重新获取 textarea（防止页面刷新后元素失效）
        const currentTextareas = await page.$$("textarea");
        const lastTextarea = currentTextareas[currentTextareas.length - 1];

        // 确保 textarea 可见和可交互
        await page.evaluate((element) => {
          element.scrollIntoView();
        }, lastTextarea);

        // 清空并输入提示词
        await lastTextarea.click();
        await page.waitForTimeout(200);

        // 使用更安全的清空方法
        await page.evaluate((element) => {
          element.value = "";
          element.focus();
        }, lastTextarea);

        // 分批输入文本（避免长文本输入问题）
        const chunks = prompt.match(/.{1,100}/g) || [prompt];
        for (const chunk of chunks) {
          await lastTextarea.type(chunk, { delay: 10 });
        }

        // 发送提示词（优先使用回车键，更可靠）
        try {
          // 先尝试回车键发送
          await lastTextarea.press("Enter");
          await page.waitForTimeout(500);
        } catch (enterError) {
          // 如果回车键失败，尝试点击发送按钮
          try {
            await page.waitForSelector(img_generate_input_send_selector, {
              timeout: 3000,
            });
            await page.click(img_generate_input_send_selector);
          } catch (clickError) {
            console.warn(`⚠️ 发送失败，跳过第 ${i + 1} 个提示词`);
            continue;
          }
        }

        console.log(`✅ 第 ${i + 1} 个提示词发送成功`);

        // 等待处理完成再发送下一个
        if (i < prompts.length - 1) {
          await page.waitForTimeout(2000); // 增加等待时间
        }
      } catch (error) {
        console.error(`❌ 发送第 ${i + 1} 个提示词失败: ${error.message}`);

        // 如果是页面关闭错误，尝试重新打开
        if (
          error.message.includes("Target closed") ||
          error.message.includes("页面已关闭")
        ) {
          console.log("🔄 检测到页面关闭，尝试重新打开...");
          await page.goto(url, { waitUntil: "networkidle2" });
          await setCookieAndLocalStorage(page, cookie_localstorage);
          await page.reload({ waitUntil: "networkidle2" });
          await page.waitForTimeout(3000);

          // 重新点击生成按钮
          await page.waitForSelector(generate_button_selector, {
            timeout: 10000,
          });
          await page.click(generate_button_selector);
          await page.waitForTimeout(2000);

          // 重试当前提示词
          i--; // 回退一步，重试当前提示词
          continue;
        }

        // 其他错误继续下一个
        continue;
      }
    }

    console.log("⏳ 等待图片生成完成...");
    await page.waitForTimeout(20000); // 等待图片生成

    // 下载生成的图片，带重试机制
    console.log("📥 开始下载生成的图片...");
    const maxRetries = 20; // 最大重试次数
    let downloadedCount = 0;
    let retryCount = 0;
    const downloadedHashes = new Set(); // 全局哈希集合，跨重试检测重复

    while (downloadedCount < prompts.length && retryCount < maxRetries) {
      console.log(`🔄 第 ${retryCount + 1} 次下载尝试... (已下载: ${downloadedCount}/${prompts.length})`);

      const currentDownloaded = await downloadGeneratedImages(
        page,
        gernerate_img_result_selector,
        prompts.length - downloadedCount, // 还需要的数量
        jimeng.name,
        downloadedCount, // 已下载的数量
        downloadedHashes // 传递全局哈希集合
      );

      downloadedCount += currentDownloaded;

      if (downloadedCount >= prompts.length) {
        console.log(`✅ 成功下载了 ${downloadedCount} 张图片，达到目标数量！`);
        break;
      }

      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`⏳ 等待更多图片生成，继续重试... (${retryCount}/${maxRetries})`);
        await page.waitForTimeout(15000); // 等待15秒后重试
      }
    }

    if (downloadedCount < prompts.length) {
      console.warn(`⚠️ 经过 ${maxRetries} 次尝试，仍只下载了 ${downloadedCount}/${prompts.length} 张图片`);
    } else {
      console.log(`✅ 成功完成了 ${downloadedCount} 张图片的下载任务！`);
    }

    console.log("✅ 即梦自动化流程完成！");
  } finally {
    await browser.close();
  }
}

/**
 * 下载生成的图片（支持虚拟列表滚动）
 */
async function downloadGeneratedImages(page, resultSelector, count, name, alreadyDownloaded = 0, globalDownloadedHashes = null) {
  // 创建下载目录
  const downloadDir = path.join("output", name, "images");
  await fs.mkdir(downloadDir, { recursive: true });

  console.log("🔍 等待图片生成完成...");
  await page.waitForTimeout(5000);

  console.log(`🎯 开始下载 ${count} 张图片（虚拟列表模式）...`);

  console.log(`🖱️ 使用鼠标滚轮滚动模式`);

  const downloadedUrls = new Set(); // 记录已下载的URL，避免重复
  // 使用全局哈希集合，如果没有则创建新的
  const downloadedHashes = globalDownloadedHashes || new Set();
  let downloadedCount = 0;
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

        const imgSrc = await imgElement.evaluate((img) => img.src);

        // 检查URL是否有效且未下载过
        if (
          imgSrc &&
          imgSrc.startsWith("http") &&
          !downloadedUrls.has(imgSrc)
        ) {
          downloadedUrls.add(imgSrc);

          // 获取图片内容并计算哈希
          const imageBuffer = await downloadImageFromUrl(
            page,
            imgSrc,
            downloadDir,
            null,
            true
          );
          if (imageBuffer) {
            const hash = await calculateImageHash(imageBuffer);

            // 检查内容哈希是否重复
            if (!downloadedHashes.has(hash)) {
              downloadedHashes.add(hash);
              downloadedCount++;

              const filename = `image_${alreadyDownloaded + downloadedCount}.jpg`;
              await fs.writeFile(path.join(downloadDir, filename), imageBuffer);
              console.log(
                `✅ 第 ${alreadyDownloaded + downloadedCount} 张图片下载完成 (${filename})`
              );

              // 如果已下载足够数量，退出
              if (downloadedCount >= count) {
                break;
              }
            } else {
              console.log(`⚠️ 检测到重复图片内容，跳过下载`);
            }
          }
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

      // 使用鼠标滚轮滚动
      console.log(`🖱️ 使用鼠标滚轮第 ${scrollAttempts + 1} 次滚动`);

      // 先移动鼠标到页面中央
      await page.mouse.move(500, 400);

      // 一直向上滚动来加载更早的内容
      await page.mouse.wheel({ deltaY: -200 });
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
      const filePath = path.join(downloadDir, filename);
      await fs.writeFile(filePath, imageBuffer);
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
        const filePath = path.join(downloadDir, filename);
        await fs.writeFile(filePath, responseBuffer);
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
          await downloadImageFromUrl(
            page,
            src,
            downloadDir,
            `generated_image_${downloadCount + 1}.jpg`
          );
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
