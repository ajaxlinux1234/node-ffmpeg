import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import { getChromePath } from "../utils.mjs";

/**
 * 提取结果数据
 */
async function extractResults(page, deepseekResultTxtFn) {
  console.log("📊 开始提取DeepSeek结果数据...");

  try {
    const results = await page.evaluate(deepseekResultTxtFn);
    console.log(`✅ 成功提取到 ${results.length} 条结果数据`);
    return results;
  } catch (error) {
    console.error(`❌ 提取结果数据失败: ${error.message}`);
    throw error;
  }
}

/**
 * 处理并保存结果数据
 */
async function processAndSaveResults(results, templateData) {
  console.log("💾 开始处理并保存结果数据...");

  try {
    const processedData = {
      name: templateData.name,
      timeNum: templateData.timeNum,
      segments: results,
    };

    // 保存到文件
    const outputDir = path.join("output", templateData.name);
    await fs.mkdir(outputDir, { recursive: true });

    // 保存原始结果
    const rawResultsPath = path.join(outputDir, "raw_results.json");
    await fs.writeFile(rawResultsPath, JSON.stringify(results, null, 2), "utf8");

    // 保存处理后的数据
    const processedDataPath = path.join(outputDir, "processed_data.json");
    await fs.writeFile(processedDataPath, JSON.stringify(processedData, null, 2), "utf8");

    console.log(`✅ 数据已保存到:`);
    console.log(`   - ${rawResultsPath}`);
    console.log(`   - ${processedDataPath}`);
    console.log(`📊 处理完成，共 ${results.length} 个段落`);

    return processedData;
  } catch (error) {
    console.error(`❌ 处理和保存数据失败: ${error.message}`);
    throw error;
  }
}

/**
 * 分批输入文本内容
 */
async function typeTextInChunks(page, selector, text, chunkSize = 50) {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`未找到输入元素: ${selector}`);
  }

  // 清空输入框
  await page.evaluate((el) => {
    el.value = "";
    el.focus();
  }, element);

  // 分批输入
  const chunks = text.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [text];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(
      `📝 输入第 ${i + 1}/${chunks.length} 段内容 (${chunk.length} 字符)`
    );

    // 随机打字延迟，模拟人类
    const typingDelay = Math.floor(Math.random() * 30) + 20; // 20-50ms每字符
    await element.type(chunk, { delay: typingDelay });

    // 段落间随机停顿
    if (i < chunks.length - 1) {
      const pauseDelay = Math.floor(Math.random() * 300) + 100; // 100-400ms
      await page.waitForTimeout(pauseDelay);
    }
  }

  // 验证输入完整性
  const inputValue = await page.evaluate((el) => el.value, element);
  if (inputValue.length !== text.length) {
    console.warn(
      `⚠️ 输入内容长度不匹配，期望: ${text.length}，实际: ${inputValue.length}`
    );

    // 重新输入完整内容
    console.log("🔄 重新输入完整内容...");
    await page.evaluate(
      (el, fullText) => {
        el.value = fullText;
        el.focus();

        // 触发相关事件
        const inputEvent = new Event("input", { bubbles: true });
        el.dispatchEvent(inputEvent);

        const changeEvent = new Event("change", { bubbles: true });
        el.dispatchEvent(changeEvent);
      },
      element,
      text
    );
  }

  console.log(`✅ 文本输入完成，总长度: ${text.length} 字符`);
}

/**
 * 运行DeepSeek流程
 */
export async function runDeepSeekFlow(deepseek) {
  const {
    url,
    persistLogin = true,
    getConfig = false,
    login_selector,
    login_data,
    side_selector,
    chat_selector,
    send_chat_selector,
    send_msg_template,
    send_msg_template_data,
    get_deepseek_result_time,
    deepseek_result_txt_fn,
  } = deepseek;

  console.log("🤖 开始DeepSeek流程...");

  // 验证必需的配置
  if (!url) {
    throw new Error("DeepSeek 配置中缺少 url 字段");
  }

  // 如果不是直接获取配置模式，需要验证发送消息相关的配置
  if (
    !getConfig &&
    (!chat_selector || !send_msg_template || !send_msg_template_data)
  ) {
    throw new Error(
      "DeepSeek 配置不完整，请检查 chat_selector、send_msg_template、send_msg_template_data 字段"
    );
  }

  // 准备浏览器启动配置
  let launchConfig = {
    headless: false,
    defaultViewport: null,
    executablePath: getChromePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
      "--enable-local-storage",
      "--enable-session-storage",
      "--disable-web-security",
      "--allow-running-insecure-content",
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
    console.log("🔐 启用登录状态持久化，数据保存在:", userDataDir);
  } else {
    console.log("🔓 未启用登录状态持久化，每次都需要重新登录");
  }

  const browser = await puppeteer.launch(launchConfig);

  try {
    const page = await browser.newPage();

    // 1. 打开DeepSeek页面
    console.log("🌐 正在打开DeepSeek页面...");
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForTimeout(3000);

    // 2. 检查登录状态
    if (login_selector && login_data) {
      console.log("🔍 检查登录状态...");

      const usernameInput = await page.$(login_selector.username);
      if (usernameInput) {
        console.log("🔐 需要登录，开始自动登录...");

        // 切换到账号密码登录
        if (login_selector.username_password_tab) {
          const tabButton = await page.$(login_selector.username_password_tab);
          if (tabButton) {
            await tabButton.click();
            await page.waitForTimeout(1000);
          }
        }

        // 输入用户名
        await usernameInput.type(login_data.username);
        await page.waitForTimeout(500);

        // 输入密码
        const passwordInput = await page.$(login_selector.password);
        if (passwordInput) {
          await passwordInput.type(login_data.password);
          await page.waitForTimeout(500);
        }

        // 点击登录按钮
        const loginButton = await page.$(login_selector.login_button);
        if (loginButton) {
          await loginButton.click();
          console.log("⏳ 等待登录完成...");
          await page.waitForTimeout(5000);
        }
      } else {
        console.log("✅ 已登录状态，跳过登录流程");
      }
    }

    // 3. 点击侧边栏（如果配置了）
    if (side_selector) {
      console.log("🔍 点击侧边栏...");
      try {
        const sideElement = await page.$(side_selector);
        if (sideElement) {
          await sideElement.click();
          await page.waitForTimeout(2000);
          console.log("✅ 侧边栏点击成功");
        }
      } catch (error) {
        console.warn(`⚠️ 侧边栏点击失败: ${error.message}`);
      }
    }

    // 4. 如果是getConfig模式，直接获取数据
    if (getConfig) {
      console.log("🔧 getConfig 模式：直接从页面获取数据...");
      const results = await extractResults(page, deepseek_result_txt_fn);
      const processedData = await processAndSaveResults(
        results,
        send_msg_template_data || { name: "default" }
      );
      console.log("✅ getConfig 模式执行完成！");
      return processedData;
    }

    // 5. 发送消息模式
    console.log("📝 开始发送消息...");

    // 替换模板变量
    let message = send_msg_template;
    for (const [key, value] of Object.entries(send_msg_template_data)) {
      const placeholder = `{{${key}}}`;
      message = message.replaceAll(placeholder, value);
    }

    console.log(`📝 准备发送消息，长度: ${message.length} 字符`);

    // 等待聊天输入框出现
    await page.waitForSelector(chat_selector, { timeout: 10000 });

    // 分批输入消息内容
    await typeTextInChunks(page, chat_selector, message);

    // 6. 发送消息
    console.log("📤 发送消息...");
    const sendButton = await page.$(send_chat_selector);
    if (sendButton) {
      await sendButton.click();
      console.log("✅ 消息发送成功");
    } else {
      throw new Error(`未找到发送按钮: ${send_chat_selector}`);
    }

    // 7. 等待回复
    console.log(
      `⏳ 等待DeepSeek回复，预计等待 ${get_deepseek_result_time} 秒...`
    );
    await page.waitForTimeout(get_deepseek_result_time * 1000);

    // 8. 提取结果
    const results = await extractResults(page, deepseek_result_txt_fn);
    const processedData = await processAndSaveResults(
      results,
      send_msg_template_data
    );

    console.log("✅ DeepSeek流程执行完成！");
    return processedData;
  } finally {
    await browser.close();
  }
}

export default { runDeepSeekFlow };
