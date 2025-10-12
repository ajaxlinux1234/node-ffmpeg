import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import { getChromePath } from "../utils.mjs";
import {
  waitForManualDownload,
  checkManualDownloadedImages,
} from "./manual-download-helper.mjs";
import { upscaleImage, upscaleImagesInDirectory } from "./image-upscaler.mjs";

/**
 * 检查账号是否已存在
 */
async function checkAccountExists(accountId) {
  try {
    const userDataDir = path.join(
      process.cwd(),
      "browser-data",
      `jimeng-profile-${accountId}`
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
    const usedAccountsFile = path.join(process.cwd(), "used-accounts.json");
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
    const usedAccountsFile = path.join(process.cwd(), "used-accounts.json");
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
      console.log(`📝 记录账号 ${accountId} 为已使用账号`);
    }
  } catch (error) {
    console.warn(`⚠️ 保存账号记录失败: ${error.message}`);
  }
}

/**
 * 计算图片内容哈希
 */
async function calculateImageHash(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

/**
 * 提取年龄信息
 */
function extractAgeFromTitle(title) {
  const agePatterns = [/年龄[:：]\s*约?(\d+)岁/, /约?(\d+)岁/, /(\d+)\s*岁/];

  for (const pattern of agePatterns) {
    const match = title.match(pattern);
    if (match) {
      const age = parseInt(match[1]);
      if (age > 0 && age < 150) {
        return age;
      }
    }
  }
  return null;
}

/**
 * 上传参考图片
 */
async function uploadReferenceImage(
  page,
  uploadSelector,
  segment,
  projectName
) {
  try {
    console.log("📸 尝试上传参考图片...");

    const age = extractAgeFromTitle(segment.title);
    if (!age) {
      console.log("⚠️ 未能从标题中提取年龄信息，跳过参考图片上传");
      return;
    }

    // 根据年龄选择图片
    let imageName;
    if (age > 0 && age <= 40) {
      imageName = "青年.jpeg";
    } else if (age > 40) {
      imageName = "中年.jpeg";
    } else {
      console.log("⚠️ 年龄信息不在预期范围内，跳过参考图片上传");
      return;
    }

    // 构建图片路径
    const imagePath = path.join(
      process.cwd(),
      "output",
      projectName,
      imageName
    );

    // 检查图片是否存在
    try {
      await fs.access(imagePath);
    } catch (error) {
      console.log(`⚠️ 参考图片不存在: ${imagePath}`);
      return;
    }

    // 查找上传区域
    const uploadArea = await page.$(uploadSelector);
    if (!uploadArea) {
      console.log(`⚠️ 未找到上传区域: ${uploadSelector}`);
      return;
    }

    // 查找文件输入框
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      console.log("⚠️ 未找到文件输入框");
      return;
    }

    // 上传文件
    await fileInput.uploadFile(imagePath);
    console.log(`✅ 参考图片上传成功: ${imageName} (年龄: ${age}岁)`);

    // 等待上传完成
    await page.waitForTimeout(2000);
  } catch (error) {
    console.warn(`⚠️ 参考图片上传失败: ${error.message}`);
  }
}

/**
 * 获取随机User-Agent
 */
function getRandomUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * 从URL下载图片（增强版，支持代理和反检测）
 */
async function downloadImageFromUrl(
  page,
  url,
  downloadDir,
  filename = null,
  returnBuffer = false,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔗 尝试下载图片 (第${attempt}次): ${url.substring(0, 50)}...`
      );

      // 使用页面内的fetch API下载，避免直接访问
      const buffer = await page.evaluate(async (imageUrl) => {
        try {
          const response = await fetch(imageUrl, {
            method: "GET",
            headers: {
              Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
              "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
              "Sec-Fetch-Dest": "image",
              "Sec-Fetch-Mode": "no-cors",
              "Sec-Fetch-Site": "cross-site",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          return Array.from(new Uint8Array(arrayBuffer));
        } catch (error) {
          throw new Error(`Fetch failed: ${error.message}`);
        }
      }, url);

      const imageBuffer = Buffer.from(buffer);

      if (returnBuffer) {
        console.log(`✅ 图片下载成功 (${imageBuffer.length} bytes)`);
        return imageBuffer;
      }

      if (filename) {
        const filePath = path.join(downloadDir, filename);
        await fs.writeFile(filePath, imageBuffer);
        console.log(
          `✅ 图片保存成功: ${filename} (${imageBuffer.length} bytes)`
        );
        return filePath;
      }

      return imageBuffer;
    } catch (error) {
      console.warn(`⚠️ 第${attempt}次下载失败: ${error.message}`);

      if (attempt < maxRetries) {
        const delay = Math.random() * 2000 + 1000; // 1-3秒随机延迟
        console.log(`⏳ 等待${Math.round(delay / 1000)}秒后重试...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(`❌ 图片下载最终失败，已重试${maxRetries}次`);
        return null;
      }
    }
  }
  return null;
}

/**
 * 下载生成的图片
 */
async function downloadGeneratedImages(
  page,
  resultSelector,
  count,
  name,
  alreadyDownloaded = 0,
  globalDownloadedHashes = null,
  useImgUrl = false
) {
  const downloadedHashes = globalDownloadedHashes || new Set();
  let downloadedCount = 0;

  try {
    // 创建下载目录
    const downloadDir = path.join("output", name, "images");
    await fs.mkdir(downloadDir, { recursive: true });

    console.log(`📥 开始下载生成的图片，目标数量: ${count}`);

    // 获取所有图片元素
    const oImageElements = await page.$$(resultSelector);
    const imageElements = Array.from(oImageElements).filter(
      (_, index) => index % 4 === 0
    );
    console.log(`🔍 找到 ${imageElements.length} 个图片元素`);

    for (let i = 0; i < imageElements.length && downloadedCount < count; i++) {
      try {
        const element = imageElements[i];
        const imgElement = await element.$("img");

        if (imgElement) {
          console.log(`📥 正在下载第 ${i + 1} 张图片...`);

          let imageBuffer = null;

          if (useImgUrl) {
            // 方式1: 直接通过URL下载（有头模式优化）
            const imgSrc = await imgElement.evaluate((img) => img.src);
            if (imgSrc && imgSrc.startsWith("http")) {
              console.log(`🔗 使用URL直接下载: ${imgSrc.substring(0, 50)}...`);

              // 在有头模式下，先模拟用户查看图片
              await imgElement.scrollIntoView();
              await page.waitForTimeout(500 + Math.random() * 1000); // 随机等待0.5-1.5秒

              imageBuffer = await downloadImageFromUrl(
                page,
                imgSrc,
                downloadDir,
                null,
                true
              );
            }
          } else {
            // 方式2: 鼠标悬停+点击下载按钮（有头模式优化）
            console.log(`🖱️ 使用鼠标悬停+点击下载按钮方式`);
            try {
              // 滚动到图片位置，确保可见
              await element.scrollIntoView();
              await page.waitForTimeout(500);

              // 悬停到图片元素上
              console.log(`📍 悬停到图片上...`);
              await element.hover();
              await page.waitForTimeout(1500 + Math.random() * 1000); // 增加等待时间

              // 查找下载按钮（通常是悬停后出现的）
              const downloadButton = await element.$("svg");

              if (downloadButton) {
                console.log(`🎯 找到下载按钮，准备点击...`);

                // 设置下载监听
                const downloadPath = path.join(
                  downloadDir,
                  `image_${alreadyDownloaded + downloadedCount + 1}.jpg`
                );

                // 🔄 改用更接近手动操作的方式
                console.log(`🎯 尝试模拟真实用户的下载操作...`);

                // 先移动鼠标到按钮附近，但不要太精确
                const buttonBox = await downloadButton.boundingBox();
                if (buttonBox) {
                  // 先移动到按钮附近的随机位置
                  const nearX = buttonBox.x + Math.random() * buttonBox.width;
                  const nearY = buttonBox.y + Math.random() * buttonBox.height;

                  await page.mouse.move(nearX, nearY, { steps: 10 });
                  await page.waitForTimeout(500 + Math.random() * 1000);

                  // 然后慢慢移动到按钮中心
                  const centerX = buttonBox.x + buttonBox.width / 2;
                  const centerY = buttonBox.y + buttonBox.height / 2;

                  await page.mouse.move(centerX, centerY, { steps: 5 });
                  await page.waitForTimeout(300 + Math.random() * 500);

                  // 使用更自然的点击方式 - 先按下，停留一会，再释放
                  await page.mouse.down({ button: "left" });
                  await page.waitForTimeout(150 + Math.random() * 100); // 按下时间更长
                  await page.mouse.up({ button: "left" });

                  console.log(`✅ 完成真实用户风格的点击操作`);
                } else {
                  // 如果无法获取按钮位置，使用右键点击然后选择保存
                  console.log(`🔄 尝试右键菜单下载方式...`);
                  await downloadButton.click({ button: "right" });
                  await page.waitForTimeout(1000);

                  // 尝试按下 'S' 键选择保存
                  await page.keyboard.press("KeyS");
                  await page.waitForTimeout(500);
                }

                // 等待下载完成，有头模式下可能需要更长时间
                console.log(`⏳ 等待下载完成...`);

                // 检查页面是否还存在，避免会话关闭错误
                try {
                  await page.evaluate(() => document.title); // 简单的页面存活检查
                } catch (error) {
                  console.warn(`⚠️ 页面会话可能已关闭，尝试恢复...`);
                  // 如果页面关闭了，跳过这张图片
                  continue;
                }

                await page.waitForTimeout(3000 + Math.random() * 2000); // 3-5秒等待时间

                // 再次检查页面状态
                try {
                  await page.evaluate(() => document.title);
                } catch (error) {
                  console.warn(`⚠️ 页面会话已关闭，跳过当前图片`);
                  continue;
                }

                // 检查文件是否下载成功
                try {
                  const stats = await fs.stat(downloadPath);
                  if (stats.size > 0) {
                    imageBuffer = await fs.readFile(downloadPath);
                    console.log(`✅ 通过下载按钮成功下载图片`);
                  } else {
                    console.warn(`⚠️ 下载的文件大小为0，可能下载失败`);
                  }
                } catch (error) {
                  console.warn(`⚠️ 下载文件检查失败: ${error.message}`);
                  // 如果文件不存在，尝试等待更长时间
                  console.log(`⏳ 延长等待时间，再次检查...`);
                  await page.waitForTimeout(5000);

                  try {
                    const stats = await fs.stat(downloadPath);
                    if (stats.size > 0) {
                      imageBuffer = await fs.readFile(downloadPath);
                      console.log(`✅ 延长等待后成功找到下载文件`);
                    }
                  } catch (retryError) {
                    console.warn(`⚠️ 重试后仍未找到下载文件`);
                  }
                }
              } else {
                console.warn(`⚠️ 未找到下载按钮，尝试备用方法...`);
                // 备用方法：直接获取图片URL
                const imgSrc = await imgElement.evaluate((img) => img.src);
                if (imgSrc && imgSrc.startsWith("http")) {
                  imageBuffer = await downloadImageFromUrl(
                    page,
                    imgSrc,
                    downloadDir,
                    null,
                    true
                  );
                }
              }
            } catch (hoverError) {
              console.warn(`⚠️ 鼠标悬停操作失败: ${hoverError.message}`);
              // 备用方法：直接获取图片URL
              const imgSrc = await imgElement.evaluate((img) => img.src);
              if (imgSrc && imgSrc.startsWith("http")) {
                imageBuffer = await downloadImageFromUrl(
                  page,
                  imgSrc,
                  downloadDir,
                  null,
                  true
                );
              }
            }
          }

          // 处理下载的图片
          if (imageBuffer) {
            const hash = await calculateImageHash(imageBuffer);

            // 检查内容哈希是否重复（跨重试检测）
            if (!downloadedHashes.has(hash)) {
              downloadedHashes.add(hash);
              downloadedCount++;

              const filename = `image_${alreadyDownloaded + downloadedCount}.jpg`;
              const filePath = path.join(downloadDir, filename);
              await fs.writeFile(filePath, imageBuffer);
              console.log(
                `✅ 第 ${alreadyDownloaded + downloadedCount} 张图片下载完成 (${filename})`
              );

              // 检查是否需要进行无损放大
              const jimengConfig = global.currentJimengConfig;
              if (jimengConfig?.imageUpscaling?.enabled) {
                console.log(`🔍 检查图片分辨率并进行无损放大...`);
                await upscaleImage(filePath, {
                  targetResolution:
                    jimengConfig.imageUpscaling.targetResolution,
                  replaceOriginal: jimengConfig.imageUpscaling.replaceOriginal,
                  backupOriginal: jimengConfig.imageUpscaling.backupOriginal,
                });
              }
            } else {
              console.log(`⚠️ 检测到重复图片内容，跳过下载`);
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ 下载第 ${i + 1} 张图片失败: ${error.message}`);
      }
    }

    console.log(`📥 本次下载完成，成功下载 ${downloadedCount} 张图片`);
    return downloadedCount;
  } catch (error) {
    console.error(`❌ 下载图片过程中出错: ${error.message}`);
    return downloadedCount;
  }
}

/**
 * 智能滚动获取图片URL
 */
async function getImageUrlsWithScroll(page, imgResultUrlsFn, targetCount) {
  let allImageUrls = new Set(); // 使用Set自动去重
  let scrollAttempts = 0;
  const maxScrollAttempts = 20; // 最大滚动次数

  console.log(`🔗 使用 img_result_urls 函数获取图片URL列表...`);

  while (
    allImageUrls.size < targetCount &&
    scrollAttempts < maxScrollAttempts
  ) {
    // 1. 执行 img_result_urls 函数获取当前页面的图片URL
    const currentUrls = await page.evaluate(imgResultUrlsFn);

    const previousSize = allImageUrls.size;

    // 2. 将新URL添加到Set中（自动去重）
    currentUrls.forEach((url) => {
      if (url && url.startsWith("http")) {
        allImageUrls.add(url);
      }
    });

    const newUrls = allImageUrls.size - previousSize;
    console.log(
      `📝 第${scrollAttempts + 1}次获取: 新增${newUrls}个URL，总计${allImageUrls.size}个URL (目标${targetCount}个)`
    );

    // 3. 检查是否达到目标数量
    if (allImageUrls.size >= targetCount) {
      console.log(
        `✅ 已获取到足够的图片URL: ${allImageUrls.size}/${targetCount}`
      );
      break;
    }

    scrollAttempts++;

    if (scrollAttempts < maxScrollAttempts) {
      console.log(`🖱️ 向上滚动加载更多历史图片... (第${scrollAttempts}次滚动)`);

      // 4. 滚动页面加载更多图片 - 修复后：持续向上滚动
      await page.evaluate(() => {
        window.scrollBy(0, -800); // 向上滚动800px
      });
      await page.evaluate(() => {
        window.scrollBy(0, -400); // 再向上滚动400px
      });
      await page.waitForTimeout(2000); // 等待图片加载
    }
  }

  console.log(`📝 最终获取到 ${allImageUrls.size} 个去重后的图片URL`);
  return Array.from(allImageUrls);
}

/**
 * 运行即梦图片生成流程
 */
export async function runJimengFlow(jimeng, processedData, name) {
  const {
    accountId = 1,
    persistLogin = true,
    url,
    login_selector,
    generate_button_selector,
    img_generate_input_selector,
    img_generate_input_send_selector,
    gernerate_img_result_selector,
    downloadImg = true,
    useImgUrl = false,
    inputPrefixText = "",
    inputSuffixText = "",
    reference_upload_column_selector,
    reference_img_container,
    reference_img_close,
    img_result_urls,
    downloadMode = { autoDownload: true, manualDownloadTimeout: 300 },
  } = jimeng;

  console.log(`🎨 开始即梦图片生成流程...`);
  console.log(`🔑 使用即梦账号ID: ${accountId}`);

  // 从processedData中提取prompts
  const prompts =
    processedData?.segments?.map((segment) => segment.prompt) || [];
  console.log(`📝 准备生成 ${prompts.length} 张图片`);

  // 设置全局配置供其他函数使用
  global.currentJimengConfig = jimeng;

  // 只有在启用持久化登录时才检查账号数据
  if (persistLogin) {
    const accountExists = await checkAccountExists(accountId);
    const isNew = await isNewAccount(accountId);

    if (accountExists) {
      console.log(`✅ 发现账号 ${accountId} 的本地数据，将尝试复用登录状态`);
    } else if (isNew) {
      console.log(`📝 账号 ${accountId} 首次使用，需要登录并保存登录状态`);
    } else {
      console.log(`🔄 账号 ${accountId} 之前使用过但数据已清理，需要重新登录`);
    }
  } else {
    console.log(`🔓 持久化登录已禁用，账号 ${accountId} 将使用临时会话`);
  }

  // 保存账号ID到已使用记录
  await saveUsedAccountId(accountId);

  // 准备浏览器启动配置 - 强制使用有头模式
  let launchConfig = {
    headless: false, // 必须使用有头模式，无头模式会被检测
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
      "--disable-blink-features=AutomationControlled", // 隐藏自动化标识
      "--exclude-switches=enable-automation", // 移除自动化开关
      "--disable-extensions-except", // 禁用扩展检测
      "--disable-plugins-discovery", // 禁用插件发现
      "--disable-default-apps", // 禁用默认应用
      "--start-maximized", // 最大化窗口，更像真实用户
      "--disable-infobars", // 禁用信息栏
      "--disable-notifications", // 禁用通知
    ],
  };

  // 如果配置了代理，添加代理参数
  if (jimeng.proxy) {
    console.log(`🌐 使用代理: ${jimeng.proxy}`);
    launchConfig.args.push(`--proxy-server=${jimeng.proxy}`);
  }

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
      `jimeng-profile-${accountId}`
    );
    await fs.mkdir(userDataDir, { recursive: true });
    launchConfig.userDataDir = userDataDir;
    console.log(
      `🔐 启用登录状态持久化，账号 ${accountId} 数据保存在:`,
      userDataDir
    );
  } else {
    console.log(
      `🔓 未启用登录状态持久化，账号 ${accountId} 每次都需要重新登录`
    );
  }

  const browser = await puppeteer.launch(launchConfig);

  try {
    const page = await browser.newPage();

    // 设置随机User-Agent
    const userAgent = getRandomUserAgent();
    await page.setUserAgent(userAgent);
    console.log(`🎭 使用User-Agent: ${userAgent.substring(0, 50)}...`);

    // 设置额外的请求头来模拟真实浏览器
    await page.setExtraHTTPHeaders({
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    });

    // 隐藏webdriver属性和增强反检测（有头模式优化）
    await page.evaluateOnNewDocument(() => {
      // 隐藏webdriver标识
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // 模拟真实的Chrome插件
      Object.defineProperty(navigator, "plugins", {
        get: () => [
          { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
          {
            name: "Chromium PDF Plugin",
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
          },
          { name: "Microsoft Edge PDF Plugin", filename: "pdf" },
          { name: "WebKit built-in PDF", filename: "internal-pdf-viewer" },
        ],
      });

      // 模拟真实的语言设置
      Object.defineProperty(navigator, "languages", {
        get: () => ["zh-CN", "zh", "en-US", "en"],
      });

      // 模拟真实的Chrome对象
      window.chrome = {
        runtime: {
          onConnect: undefined,
          onMessage: undefined,
        },
        app: {
          isInstalled: false,
        },
      };

      // 模拟权限API
      Object.defineProperty(navigator, "permissions", {
        get: () => ({
          query: (params) => {
            return Promise.resolve({
              state: params.name === "notifications" ? "denied" : "granted",
            });
          },
        }),
      });

      // 模拟真实的屏幕属性
      Object.defineProperty(screen, "availWidth", { get: () => 1920 });
      Object.defineProperty(screen, "availHeight", { get: () => 1080 });
      Object.defineProperty(screen, "width", { get: () => 1920 });
      Object.defineProperty(screen, "height", { get: () => 1080 });

      // 移除自动化检测的其他标识
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    });

    // 添加页面加载完成后的额外优化
    await page.evaluateOnNewDocument(() => {
      // 模拟真实的鼠标移动
      let mouseX = Math.floor(Math.random() * 800) + 100;
      let mouseY = Math.floor(Math.random() * 600) + 100;

      document.addEventListener("DOMContentLoaded", () => {
        // 模拟随机鼠标移动
        setInterval(
          () => {
            mouseX += (Math.random() - 0.5) * 50;
            mouseY += (Math.random() - 0.5) * 50;
            mouseX = Math.max(0, Math.min(window.innerWidth, mouseX));
            mouseY = Math.max(0, Math.min(window.innerHeight, mouseY));
          },
          5000 + Math.random() * 10000
        );
      });
    });

    // 1. 打开即梦图片生成页面（有头模式优化）
    console.log("🌐 正在打开即梦图片生成页面...");
    console.log("👀 注意：浏览器窗口将保持打开，请不要手动关闭");

    await page.goto(url, { waitUntil: "networkidle2" });

    // 有头模式下的额外等待时间，让页面完全加载
    console.log("⏳ 等待页面完全加载...");
    await page.waitForTimeout(5000);

    // 模拟用户浏览行为
    await page.evaluate(() => {
      window.scrollTo(0, Math.floor(Math.random() * 200));
    });
    await page.waitForTimeout(1000 + Math.random() * 2000);

    // 2. 检查登录状态
    console.log("🔍 检查登录状态...");
    const loginButton = await page.$(login_selector.login_button);

    if (loginButton) {
      console.log("🔐 检测到登录按钮，需要登录...");
      await loginButton.click();
      await page.waitForTimeout(2000);

      // 等待用户手动登录
      console.log("⏰ 请手动完成登录，等待60秒...");

      let loginCompleted = false;
      for (let i = 0; i < 60; i++) {
        await page.waitForTimeout(1000);
        const stillNeedLogin = await page.$(login_selector.login_button);
        if (!stillNeedLogin) {
          loginCompleted = true;
          console.log("✅ 登录成功！");
          break;
        }
      }

      if (!loginCompleted) {
        throw new Error("登录超时，请手动登录后重试");
      }
    } else {
      console.log("✅ 检测到已登录状态，跳过登录流程");
      console.log("   - 原因：页面没有登录按钮");
    }

    // 3. 点击生成按钮
    console.log("🔍 查找生成按钮...");
    const generateButton = await page.$(generate_button_selector);
    if (generateButton) {
      console.log("🎯 点击生成按钮...");
      await generateButton.click();
      await page.waitForTimeout(3000);
    } else {
      console.log("⚠️ 未找到生成按钮，可能已在生成页面");
    }

    // 4. 处理图片生成
    if (processedData && processedData.segments) {
      // 模拟用户浏览行为
      await page.evaluate(() => {
        window.scrollTo(0, Math.floor(Math.random() * 200));
      });
      // await page.waitForTimeout(1000 + Math.random() * 2000);

      // 2. 检查登录状态
      console.log("🔍 检查登录状态...");
      const loginButton = await page.$(login_selector.login_button);

      if (loginButton) {
        console.log("🔐 检测到登录按钮，需要登录...");
        await loginButton.click();
        await page.waitForTimeout(2000);

        // 等待用户手动登录
        console.log("⏰ 请手动完成登录，等待60秒...");
        await page.waitForTimeout(60000);
      } else {
        console.log("✅ 检测到已登录状态，跳过登录流程");
        console.log("   - 原因：页面没有登录按钮");
      }

      // 检查是否需要下载图片且启用手动下载模式
      // 只有在实际需要生成和下载图片时才触发手动下载
      // 检查本地是否已有足够的图片
      const imagesDir = path.join("output", name, "images");
      let existingImageCount = 0;
      try {
        const files = await fs.readdir(imagesDir);
        existingImageCount = files.filter((file) =>
          /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        ).length;
      } catch (error) {
        // 目录不存在，图片数量为0
      }

      const needsImageGeneration = existingImageCount < prompts.length;

      console.log(`🔍 图片生成检查:`);
      console.log(`   - 现有图片数量: ${existingImageCount}`);
      console.log(`   - 需要图片数量: ${prompts.length}`);
      console.log(`   - 需要生成图片: ${needsImageGeneration}`);
      console.log(`   - downloadImg: ${downloadImg}`);
      console.log(`   - autoDownload: ${downloadMode.autoDownload}`);

      if (downloadImg && !downloadMode.autoDownload && needsImageGeneration) {
        console.log("🛑 检测到手动下载模式已启用");
        await waitForManualDownload(downloadMode, name, prompts.length);

        // 检查手动下载的图片数量
        const downloadedCount = await checkManualDownloadedImages(name);
        console.log(`📊 手动下载完成，共 ${downloadedCount} 张图片`);

        // 关闭浏览器并返回
        await page.close();
        return;
      }

      if (downloadImg) {
        console.log("📥 downloadImg=true，直接下载现有图片...");
        console.log("👀 有头模式下，您可以看到浏览器的操作过程");

        // 创建全局哈希集合用于去重
        const downloadedHashes = new Set();
        let downloadedCount = 0;
        const maxRetries = 20;
        let retryCount = 0;

        // 等待图片加载
        console.log("⏳ 等待10秒让图片完全加载...");
        await page.waitForTimeout(10000);
        // 模拟用户滚动查看图片
        console.log("📜 模拟用户滚动查看图片...");
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 3);
        });
        await page.waitForTimeout(2000);
        await page.evaluate(() => {
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(2000);

        // 重试机制：不成功下载目标数量的图片就不关闭
        while (downloadedCount < prompts.length && retryCount < maxRetries) {
          console.log(`🔄 第 ${retryCount + 1} 次尝试下载图片...`);

          const currentDownloaded = await downloadGeneratedImages(
            page,
            gernerate_img_result_selector,
            prompts.length - downloadedCount,
            name,
            downloadedCount,
            downloadedHashes,
            useImgUrl
          );

          downloadedCount += currentDownloaded;

          if (downloadedCount >= prompts.length) {
            console.log(
              `✅ 成功下载了 ${downloadedCount} 张图片，达到目标数量！`
            );
            break;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            console.log(
              `⏳ 等待更多图片生成，继续重试... (${retryCount}/${maxRetries})`
            );
            await page.waitForTimeout(15000);
          }
        }

        if (downloadedCount < prompts.length) {
          console.warn(
            `⚠️ 达到最大重试次数，仅下载了 ${downloadedCount}/${prompts.length} 张图片`
          );
        }
      } else {
        console.log("📝 downloadImg=false，开始发送图片生成提示词...");

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

          console.log(`📝 发送第 ${i + 1}/${prompts.length} 个提示词:`);
          console.log(`   原始: ${originalPrompt.substring(0, 50)}...`);
          if (inputPrefixText || inputSuffixText) {
            console.log(`   完整: ${finalPrompt.substring(0, 80)}...`);
          }

          // 在发送前上传参考图片（如果配置了的话）
          if (
            reference_upload_column_selector &&
            processedData &&
            processedData.segments
          ) {
            await uploadReferenceImage(
              page,
              reference_upload_column_selector,
              processedData.segments[i],
              name
            );
          }

          // 找到输入框并输入提示词
          let inputElement;

          if (typeof img_generate_input_selector === "function") {
            // 如果是函数，在页面中执行函数获取元素
            try {
              console.log("🔍 使用函数选择器查找输入框...");
              inputElement = await page.evaluateHandle(
                img_generate_input_selector
              );

              // 检查是否成功获取到元素
              if (inputElement && inputElement.asElement) {
                inputElement = inputElement.asElement();
                console.log("✅ 函数选择器成功找到输入框");
              } else {
                console.warn("⚠️ 函数选择器未返回有效元素，使用备用选择器");
                inputElement = await page.$("textarea:last-of-type");
              }
            } catch (error) {
              console.warn(`⚠️ 函数选择器执行失败: ${error.message}`);
              // 回退到通用选择器
              console.log("🔄 回退到通用选择器: textarea:last-of-type");
              inputElement = await page.$("textarea:last-of-type");
            }
          } else {
            // 如果是字符串选择器，直接使用
            console.log(`🔍 使用字符串选择器: ${img_generate_input_selector}`);
            inputElement = await page.$(img_generate_input_selector);
          }

          if (inputElement) {
            await inputElement.click();
            await page.waitForTimeout(500);

            // 清空输入框
            await page.evaluate((el) => {
              el.value = "";
              el.focus();
            }, inputElement);

            // 输入完整的提示词（包含前缀和后缀）
            await inputElement.type(finalPrompt);
            await page.waitForTimeout(1000);

            // 发送（通常是回车键）
            await page.keyboard.press("Enter");
            console.log(`✅ 第 ${i + 1} 个提示词已发送`);

            // 等待图片生成
            await page.waitForTimeout(10000);
          } else {
            console.error(
              `❌ 未找到输入框，选择器类型: ${typeof img_generate_input_selector}`
            );
            break;
          }
        }

        console.log("⏳ 等待所有图片生成完成...");
        await page.waitForTimeout(30000);

        // 生成完成后下载图片
        console.log("📥 开始下载生成的图片...");

        // 创建全局哈希集合用于去重
        const downloadedHashes = new Set();
        let downloadedCount = 0;
        const maxRetries = 10;
        let retryCount = 0;

        // 重试机制：不成功下载目标数量的图片就不关闭
        while (downloadedCount < prompts.length && retryCount < maxRetries) {
          console.log(`🔄 第 ${retryCount + 1} 次尝试下载图片...`);

          const currentDownloaded = await downloadGeneratedImages(
            page,
            gernerate_img_result_selector,
            prompts.length - downloadedCount,
            name,
            downloadedCount,
            downloadedHashes,
            useImgUrl
          );

          downloadedCount += currentDownloaded;

          if (downloadedCount >= prompts.length) {
            console.log(
              `✅ 成功下载了 ${downloadedCount} 张图片，达到目标数量！`
            );
            break;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            console.log(
              `⏳ 等待更多图片生成，继续重试... (${retryCount}/${maxRetries})`
            );
            await page.waitForTimeout(15000);
          }
        }

        if (downloadedCount < prompts.length) {
          console.warn(
            `⚠️ 达到最大重试次数，仅下载了 ${downloadedCount}/${prompts.length} 张图片`
          );
        }
      }
    }

    console.log("✅ 即梦图片生成流程完成！");

    // 检查是否需要对现有图片进行无损放大
    if (jimeng.imageUpscaling?.enabled) {
      console.log("🔍 检查现有图片是否需要无损放大...");
      const downloadDir = path.join("output", name, "images");

      try {
        await upscaleImagesInDirectory(downloadDir, {
          targetResolution: jimeng.imageUpscaling.targetResolution,
          replaceOriginal: jimeng.imageUpscaling.replaceOriginal,
          backupOriginal: jimeng.imageUpscaling.backupOriginal,
        });
      } catch (error) {
        console.warn(`⚠️ 批量处理图片时出错: ${error.message}`);
      }
    }

    console.log("👀 浏览器窗口将在 5 秒后自动关闭...");
    await page.waitForTimeout(5000);
  } finally {
    await browser.close();
  }
}

export default { runJimengFlow };
