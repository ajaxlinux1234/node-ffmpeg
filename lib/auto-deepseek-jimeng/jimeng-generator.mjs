import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import puppeteer from "puppeteer";
import { getChromePath } from "../utils.mjs";

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
  const agePatterns = [
    /年龄[:：]\s*约?(\d+)岁/,
    /约?(\d+)岁/,
    /(\d+)\s*岁/
  ];
  
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
async function uploadReferenceImage(page, uploadSelector, segment, projectName) {
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
    const imagePath = path.join(process.cwd(), "output", projectName, imageName);
    
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
    console.error(`下载图片失败: ${error.message}`);
    return null;
  }
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
  globalDownloadedHashes = null
) {
  const downloadedHashes = globalDownloadedHashes || new Set();
  let downloadedCount = 0;

  try {
    // 创建下载目录
    const downloadDir = path.join("output", name, "images");
    await fs.mkdir(downloadDir, { recursive: true });

    console.log(`📥 开始下载生成的图片，目标数量: ${count}`);

    // 获取所有图片元素
    const imageElements = await page.$$(resultSelector);
    console.log(`🔍 找到 ${imageElements.length} 个图片元素`);

    for (let i = 0; i < imageElements.length && downloadedCount < count; i++) {
      try {
        const element = imageElements[i];
        const imgElement = await element.$("img");

        if (imgElement) {
          const imgSrc = await imgElement.evaluate((img) => img.src);

          if (imgSrc && imgSrc.startsWith("http")) {
            console.log(`📥 正在下载第 ${i + 1} 张图片...`);

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

              // 检查内容哈希是否重复（跨重试检测）
              if (!downloadedHashes.has(hash)) {
                downloadedHashes.add(hash);
                downloadedCount++;

                const filename = `image_${alreadyDownloaded + downloadedCount}.jpg`;
                await fs.writeFile(
                  path.join(downloadDir, filename),
                  imageBuffer
                );
                console.log(
                  `✅ 第 ${alreadyDownloaded + downloadedCount} 张图片下载完成 (${filename})`
                );
              } else {
                console.log(`⚠️ 检测到重复图片内容，跳过下载`);
              }
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
export async function runJimengFlow(jimeng, processedData) {
  const {
    accountId = 1,
    persistLogin = true,
    name,
    downloadImg = true,
    url,
    login_selector,
    useImgUrl = false,
    generate_button_selector,
    aspect_ratio_trigger_selector,
    aspect_ratio_selector,
    img_generate_input_selector,
    reference_upload_column_selector,
    reference_img_container,
    reference_img_close,
    img_generate_input_send_selector,
    gernerate_img_result_selector,
    img_result_urls,
    inputPrefixText = "", // 新增：输入前缀文本
    inputSuffixText = "", // 兼容：输入后缀文本
  } = jimeng;

  console.log(`🎨 开始即梦图片生成流程...`);
  console.log(`🔑 使用即梦账号ID: ${accountId}`);

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

    // 1. 打开即梦图片生成页面
    console.log("🌐 正在打开即梦图片生成页面...");
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
      const prompts = processedData.segments
        .map((seg) => seg.prompt)
        .filter(Boolean);
      console.log(`📝 准备生成 ${prompts.length} 张图片`);

      // 检查是否直接下载图片
      if (downloadImg) {
        console.log("📥 downloadImg=true，直接下载现有图片...");
        
        // 创建全局哈希集合用于去重
        const downloadedHashes = new Set();
        let downloadedCount = 0;
        const maxRetries = 20;
        let retryCount = 0;

        // 等待第一批图片加载
        console.log("⏳ 等待20秒让图片加载...");
        await page.waitForTimeout(20000);

        // 重试机制：不成功下载目标数量的图片就不关闭
        while (downloadedCount < prompts.length && retryCount < maxRetries) {
          console.log(`🔄 第 ${retryCount + 1} 次尝试下载图片...`);

          const currentDownloaded = await downloadGeneratedImages(
            page,
            gernerate_img_result_selector,
            prompts.length - downloadedCount,
            name,
            downloadedCount,
            downloadedHashes
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
          if (reference_upload_column_selector && processedData && processedData.segments) {
            await uploadReferenceImage(page, reference_upload_column_selector, processedData.segments[i], name);
          }

          // 找到输入框并输入提示词
          let inputElement;
          
          if (typeof img_generate_input_selector === 'function') {
            // 如果是函数，在页面中执行函数获取元素
            try {
              console.log("🔍 使用函数选择器查找输入框...");
              inputElement = await page.evaluateHandle(img_generate_input_selector);
              
              // 检查是否成功获取到元素
              if (inputElement && inputElement.asElement) {
                inputElement = inputElement.asElement();
                console.log("✅ 函数选择器成功找到输入框");
              } else {
                console.warn("⚠️ 函数选择器未返回有效元素，使用备用选择器");
                inputElement = await page.$('textarea:last-of-type');
              }
            } catch (error) {
              console.warn(`⚠️ 函数选择器执行失败: ${error.message}`);
              // 回退到通用选择器
              console.log("🔄 回退到通用选择器: textarea:last-of-type");
              inputElement = await page.$('textarea:last-of-type');
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
            await page.keyboard.press('Enter');
            console.log(`✅ 第 ${i + 1} 个提示词已发送`);
            
            // 等待图片生成
            await page.waitForTimeout(10000);
          } else {
            console.error(`❌ 未找到输入框，选择器类型: ${typeof img_generate_input_selector}`);
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
            downloadedHashes
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
  } finally {
    await browser.close();
  }
}

export default { runJimengFlow };
