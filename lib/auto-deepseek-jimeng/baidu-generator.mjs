import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import puppeteer from "puppeteer";
import { getChromePath } from "../utils.mjs";

const WAIT_TIME = 8000;

/**
 * 检查账号是否已存在
 */
async function checkAccountExists(accountId) {
  try {
    const userDataDir = path.join(
      process.cwd(),
      "browser-data",
      `baidu-profile-${accountId}`
    );
    const stat = await fs.stat(userDataDir);
    return stat.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * 检查是否为新账号
 */
async function isNewAccount(accountId) {
  try {
    const usedAccountsFile = path.join(
      process.cwd(),
      "used-baidu-accounts.json"
    );
    const data = await fs.readFile(usedAccountsFile, "utf8");
    const usedAccounts = JSON.parse(data);
    return !usedAccounts.includes(accountId);
  } catch (error) {
    return true; // 如果文件不存在，认为是新账号
  }
}

/**
 * 保存已使用的账号ID
 */
async function saveUsedAccountId(accountId) {
  try {
    const usedAccountsFile = path.join(
      process.cwd(),
      "used-baidu-accounts.json"
    );
    let usedAccounts = [];

    try {
      const data = await fs.readFile(usedAccountsFile, "utf8");
      usedAccounts = JSON.parse(data);
    } catch (error) {
      // 文件不存在，使用空数组
    }

    if (!usedAccounts.includes(accountId)) {
      usedAccounts.push(accountId);
      await fs.writeFile(
        usedAccountsFile,
        JSON.stringify(usedAccounts, null, 2)
      );
      console.log(`📝 记录百度账号 ${accountId} 为已使用账号`);
    }
  } catch (error) {
    console.warn(`⚠️ 保存百度账号记录失败: ${error.message}`);
  }
}

/**
 * 计算图片内容哈希
 */
async function calculateImageHash(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

/**
 * 从URL下载图片
 */
async function downloadImageFromUrl(
  page,
  url,
  downloadDir,
  filename = null,
  returnBuffer = false
) {
  try {
    const response = await page.goto(url);
    const buffer = await response.buffer();

    if (returnBuffer) {
      return buffer;
    }

    if (filename) {
      const filePath = path.join(downloadDir, filename);
      await fs.writeFile(filePath, buffer);
      return filePath;
    }

    return buffer;
  } catch (error) {
    console.error(`百度图片下载失败: ${error.message}`);
    return null;
  }
}

/**
 * 使用URL列表模式下载图片
 */
async function downloadImagesFromUrls(page, urls, name, downloadedHashes) {
  let downloadedCount = 0;

  try {
    // 创建下载目录
    const downloadDir = path.join("output", name, "images");
    await fs.mkdir(downloadDir, { recursive: true });

    console.log(`🔗 百度AI生图URL列表模式下载 ${urls.length} 张图片...`);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      if (!url || !url.startsWith("http")) {
        console.warn(`⚠️ 跳过无效URL: ${url}`);
        continue;
      }

      try {
        console.log(`🔗 下载第 ${i + 1} 张图片: ${url.substring(0, 60)}...`);

        // 获取图片内容并计算哈希
        const imageBuffer = await downloadImageFromUrl(
          page,
          url,
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

            // 自动检测图片格式
            let extension = "jpg";
            if (url.includes(".png")) extension = "png";
            else if (url.includes(".webp")) extension = "webp";
            else if (url.includes(".gif")) extension = "gif";

            const filename = `image_${downloadedCount}.${extension}`;
            await fs.writeFile(path.join(downloadDir, filename), imageBuffer);

            console.log(
              `✅ 第 ${downloadedCount} 张图片下载完成 (${filename}) [格式: ${extension.toUpperCase()}] [百度URL模式]`
            );
          } else {
            console.log(`⚠️ 检测到重复图片内容，跳过下载`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ 下载第 ${i + 1} 张图片失败: ${error.message}`);
      }
    }

    console.log(
      `📊 百度URL列表模式下载结果: ${downloadedCount}/${urls.length}`
    );
    return downloadedCount;
  } catch (error) {
    console.error(`❌ 百度图片下载过程中出错: ${error.message}`);
    return downloadedCount;
  }
}

/**
 * 运行百度AI生图流程
 */
export async function runBaiduFlow(baidu, processedData) {
  const {
    accountId = 1,
    persistLogin = true,
    name,
    downloadImg = true,
    url,
    login_selector,
    useImgUrl = true,
    generate_button_selector,
    img_generate_input_selector,
    img_generate_input_send_selector,
    gernerate_img_result_selector,
    img_result_urls,
    inputPrefixText = "",
    inputSuffixText = "",
    waitForGeneration = 30000,
    scrollWaitTime = 3000,
    downloadRetryCount = 3,
    downloadTimeout = 30000,
  } = baidu;

  console.log(`🎨 开始百度AI生图流程...`);
  console.log(`🔑 使用百度账号ID: ${accountId}`);

  // 只有在启用持久化登录时才检查账号数据
  if (persistLogin) {
    const accountExists = await checkAccountExists(accountId);
    const isNew = await isNewAccount(accountId);

    if (accountExists) {
      console.log(
        `✅ 发现百度账号 ${accountId} 的本地数据，将尝试复用登录状态`
      );
    } else if (isNew) {
      console.log(`📝 百度账号 ${accountId} 首次使用，需要登录并保存登录状态`);
    } else {
      console.log(
        `🔄 百度账号 ${accountId} 之前使用过但数据已清理，需要重新登录`
      );
    }
  } else {
    console.log(`🔓 持久化登录已禁用，百度账号 ${accountId} 将使用临时会话`);
  }

  // 保存账号ID到已使用记录
  await saveUsedAccountId(accountId);

  // 准备浏览器启动配置
  let launchConfig = {
    headless: false,
    defaultViewport: null,
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

  // 智能设置Chrome路径
  const chromePath = await getChromePath();
  if (chromePath) {
    launchConfig.executablePath = chromePath;
    console.log(`🔍 使用Chrome路径: ${chromePath}`);
  } else {
    console.log(`🔍 使用系统默认Chrome路径`);
  }

  // 如果启用登录状态持久化，创建用户数据目录
  if (persistLogin) {
    const userDataDir = path.join(
      process.cwd(),
      "browser-data",
      `baidu-profile-${accountId}`
    );
    await fs.mkdir(userDataDir, { recursive: true });
    launchConfig.userDataDir = userDataDir;
    console.log(
      `🔐 启用登录状态持久化，百度账号 ${accountId} 数据保存在:`,
      userDataDir
    );
  } else {
    console.log(
      `🔓 未启用登录状态持久化，百度账号 ${accountId} 每次都需要重新登录`
    );
  }

  const browser = await puppeteer.launch(launchConfig);

  try {
    const page = await browser.newPage();

    // 1. 打开百度AI生图页面
    console.log("🌐 正在打开百度AI生图页面...");
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForTimeout(3000);

    // 2. 检查登录状态
    console.log("🔍 检查登录状态...");
    const loginButton = await page.$(login_selector.login_button);

    if (loginButton) {
      console.log("🔐 检测到登录按钮，需要登录...");
      await loginButton.click();
      await page.waitForTimeout(2000);

      // 等待用户手动登录
      console.log("⏰ 请手动完成百度登录，等待60秒...");

      let loginCompleted = false;
      for (let i = 0; i < 60; i++) {
        await page.waitForTimeout(1000);
        const stillNeedLogin = await page.$(login_selector.login_button);
        if (!stillNeedLogin) {
          loginCompleted = true;
          console.log("✅ 百度登录成功！");
          break;
        }
      }

      if (!loginCompleted) {
        throw new Error("百度登录超时，请手动登录后重试");
      }
    } else {
      console.log("✅ 检测到已登录状态，跳过登录流程");
      console.log("   - 原因：页面没有登录按钮");
    }

    // 3. 点击生成按钮（如果有）
    if (generate_button_selector) {
      console.log("🔍 查找生成按钮...");
      const generateButton = await page.$(generate_button_selector);
      if (generateButton) {
        console.log("🎯 点击生成按钮...");
        await generateButton.click();
        await page.waitForTimeout(3000);
      } else {
        console.log("⚠️ 未找到生成按钮，可能已在生成页面");
      }
    }

    // 4. 处理图片生成
    if (processedData && processedData.segments) {
      const prompts = processedData.segments
        .map((seg) => seg.prompt)
        .filter(Boolean);
      console.log(`📝 准备发送 ${prompts.length} 个提示词到百度AI生图`);

      // 发送每个提示词生成图片
      for (let i = 0; i < prompts.length; i++) {
        const originalPrompt = prompts[i];

        // 构建完整的提示词：前缀 + 原始提示词 + 后缀
        let finalPrompt = originalPrompt;

        if (inputPrefixText) {
          finalPrompt = `${inputPrefixText} ${finalPrompt}`;
        }

        if (inputSuffixText) {
          finalPrompt = `${finalPrompt} ${inputSuffixText}`;
        }

        console.log(`📝 发送第 ${i + 1}/${prompts.length} 个提示词到百度AI:`);
        console.log(`   原始: ${originalPrompt.substring(0, 50)}...`);
        if (inputPrefixText || inputSuffixText) {
          console.log(`   完整: ${finalPrompt.substring(0, 80)}...`);
        }

        // 找到输入框并输入提示词
        let inputElement;

        console.log(
          `🔍 百度输入框选择器类型: ${typeof img_generate_input_selector}`
        );
        console.log(`🔍 百度输入框选择器值: ${img_generate_input_selector}`);

        if (typeof img_generate_input_selector === "function") {
          // 如果是函数，在页面中执行函数获取元素，然后用选择器获取
          try {
            const elementInfo = await page.evaluate(
              img_generate_input_selector
            );
            if (elementInfo) {
              // 如果函数返回了选择器字符串，使用它
              if (typeof elementInfo === "string") {
                inputElement = await page.$(elementInfo);
              } else {
                // 如果函数直接返回了元素，尝试通过其他方式获取
                inputElement = await page.$("#chat-textarea");
              }
            }
          } catch (error) {
            console.warn(`⚠️ 百度输入框函数选择器执行失败: ${error.message}`);
            // 回退到百度专用选择器
            inputElement = await page.$("#chat-textarea");
          }
        } else {
          // 如果是字符串选择器，直接使用
          inputElement = await page.$(img_generate_input_selector);
        }

        if (inputElement) {
          await inputElement.click();
          await page.waitForTimeout(500);

          // 清空输入框（百度使用 contenteditable div）
          await page.evaluate((el) => {
            el.innerHTML = "";
            el.textContent = "";
            el.focus();
          }, inputElement);

          // 输入完整的提示词（使用 innerHTML 或 textContent 设置内容）
          await page.evaluate(
            (el, text) => {
              el.textContent = text;
              // 触发输入事件
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            },
            inputElement,
            finalPrompt
          );
          await page.waitForTimeout(WAIT_TIME);

          // 发送（通常是回车键或点击发送按钮）
          if (img_generate_input_send_selector) {
            const sendButton = await page.$(img_generate_input_send_selector);
            if (sendButton) {
              await sendButton.click();
            } else {
              await page.keyboard.press("Enter");
            }
          } else {
            await page.keyboard.press("Enter");
          }

          console.log(`✅ 第 ${i + 1} 个提示词已发送到百度AI`);

          // 等待图片生成
          await page.waitForTimeout(waitForGeneration / prompts.length);
        } else {
          console.error(
            `❌ 未找到百度输入框，选择器类型: ${typeof img_generate_input_selector}`
          );
          console.log(`🔍 尝试备用选择器...`);

          // 尝试备用选择器
          const backupSelectors = [
            "#ai-input-editor",
            "#chat-textarea",
            "textarea",
            "[contenteditable='true']",
            ".input-box",
            ".chat-input",
          ];

          for (const selector of backupSelectors) {
            console.log(`🔍 尝试选择器: ${selector}`);
            inputElement = await page.$(selector);
            if (inputElement) {
              console.log(`✅ 找到输入框，使用选择器: ${selector}`);

              // 执行输入操作
              await inputElement.click();
              await page.waitForTimeout(WAIT_TIME);

              // 清空输入框（百度使用 contenteditable div）
              await page.evaluate((el) => {
                el.innerHTML = "";
                el.textContent = "";
                el.focus();
              }, inputElement);

              // 输入完整的提示词（使用 innerHTML 或 textContent 设置内容）
              await page.evaluate(
                (el, text) => {
                  el.textContent = text;
                  // 触发输入事件
                  el.dispatchEvent(new Event("input", { bubbles: true }));
                  el.dispatchEvent(new Event("change", { bubbles: true }));
                },
                inputElement,
                finalPrompt
              );
              await page.waitForTimeout(WAIT_TIME);

              // 发送（通常是回车键或点击发送按钮）
              if (img_generate_input_send_selector) {
                const sendButton = await page.$(
                  img_generate_input_send_selector
                );
                if (sendButton) {
                  await sendButton.click();
                } else {
                  await page.keyboard.press("Enter");
                }
              } else {
                await page.keyboard.press("Enter");
              }

              console.log(`✅ 第 ${i + 1} 个提示词已发送到百度AI`);
              break;
            }
          }

          if (!inputElement) {
            console.error(`❌ 所有备用选择器都失败，跳过此提示词`);
            continue;
          }
        }
      }

      console.log(`⏳ 等待所有图片生成完成... (${waitForGeneration / 1000}秒)`);
      await page.waitForTimeout(waitForGeneration);

      // 生成完成后下载图片
      if (downloadImg) {
        console.log("📥 开始下载百度AI生成的图片...");

        const downloadedHashes = new Set();
        let downloadedCount = 0;
        let retryCount = 0;

        // 使用URL列表模式下载
        if (useImgUrl && img_result_urls) {
          while (
            downloadedCount < prompts.length &&
            retryCount < downloadRetryCount
          ) {
            console.log(`🔄 第 ${retryCount + 1} 次尝试获取百度图片URL...`);

            try {
              const imageUrls = await page.evaluate(img_result_urls);
              console.log(`📝 百度AI生图获取到 ${imageUrls.length} 个图片URL`);

              if (imageUrls.length > 0) {
                const currentDownloaded = await downloadImagesFromUrls(
                  page,
                  imageUrls.slice(downloadedCount),
                  name,
                  downloadedHashes
                );
                downloadedCount += currentDownloaded;
              }

              if (downloadedCount >= prompts.length) {
                console.log(
                  `✅ 百度AI生图成功下载了 ${downloadedCount} 张图片，达到目标数量！`
                );
                break;
              }
            } catch (error) {
              console.warn(`⚠️ 获取百度图片URL失败: ${error.message}`);
            }

            retryCount++;
            if (retryCount < downloadRetryCount) {
              console.log(
                `⏳ 等待更多图片生成，继续重试... (${retryCount}/${downloadRetryCount})`
              );
              await page.waitForTimeout(scrollWaitTime);
            }
          }
        }

        if (downloadedCount < prompts.length) {
          console.warn(
            `⚠️ 达到最大重试次数，百度AI生图仅下载了 ${downloadedCount}/${prompts.length} 张图片`
          );
        }
      }
    }

    console.log("✅ 百度AI生图流程完成！");
  } finally {
    await browser.close();
  }
}

export default { runBaiduFlow };
