import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import { upscaleImagesInDirectory } from "./image-upscaler.mjs";
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
 * 运行即梦视频生成流程
 */
export async function runJimengVideoFlow(jimengVideo, processedData, name) {
  const {
    accountId = 1, // 默认账号ID为1
    persistLogin = true, // 默认启用登录状态持久化
    generate_section = 1, // 默认为第1批
    generate_section_num = 10, // 每批上传的图片数量，默认10张
    useShot = true, // 是否使用运镜描述，默认为true
    autoUpscale = true, // 是否启用自动图片放大
    upscaleConfig = {
      targetResolution: { width: 1920, height: 1080 },
      replaceOriginal: true,
      backupOriginal: true,
      outputSuffix: "_upscaled",
    }, // 图片放大配置
    url,
    generate_button_selector,
    video_generate_select_trigger_selector,
    video_generate_select_trigger_text,
    video_generate_select_item_selector,
    video_generate_select_item_text,
    video_generate_upload_text,
    video_generate_shot_text_btn_selector,
    video_generate_shot_input_selector,
    video_generate_shot_input_confirm_text,
    video_generate_shot_input_confirm_select,
  } = jimengVideo;

  console.log(`🎬 开始处理第 ${generate_section} 批次的视频生成...`);
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

  // 获取图片目录
  const imagesDir = path.join("output", name, "images");

  // 读取所有图片文件并按倒序排列
  let allImageFiles = [];
  try {
    const files = await fs.readdir(imagesDir);
    allImageFiles = files
      .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .sort((a, b) => {
        // 提取数字进行排序
        const numA = parseInt(a.match(/\d+/)?.[0] || "0");
        const numB = parseInt(b.match(/\d+/)?.[0] || "0");
        return numA - numB; // 倒序：image_16, image_15, ..., image_1
      });

    console.log(`📁 找到 ${allImageFiles.length} 张图片总数`);
  } catch (error) {
    throw new Error(`读取图片目录失败: ${error.message}`);
  }

  if (allImageFiles.length === 0) {
    throw new Error("未找到任何图片文件");
  }

  // 🔍 检测图片尺寸并进行无损放大（如果启用）
  if (autoUpscale) {
    console.log("🔍 检测图片尺寸，如需要将进行无损放大...");
    try {
      const upscaleResult = await upscaleImagesInDirectory(
        imagesDir,
        upscaleConfig
      );

      if (upscaleResult.success > 0) {
        console.log(`✅ 成功放大 ${upscaleResult.success} 张图片`);
      }
      if (upscaleResult.skipped > 0) {
        console.log(`⏭️ 跳过 ${upscaleResult.skipped} 张图片（尺寸已足够）`);
      }
      if (upscaleResult.failed > 0) {
        console.warn(`⚠️ ${upscaleResult.failed} 张图片放大失败`);
      }

      // 重新读取图片文件（可能有新的放大图片）
      const updatedFiles = await fs.readdir(imagesDir);
      const updatedImageFiles = updatedFiles
        .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .filter((file) => !file.includes("_original")) // 排除备份文件
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || "0");
          const numB = parseInt(b.match(/\d+/)?.[0] || "0");
          return numB - numA;
        });

      if (updatedImageFiles.length > allImageFiles.length) {
        console.log(`📁 更新后找到 ${updatedImageFiles.length} 张图片`);
        allImageFiles = updatedImageFiles;
      }
    } catch (error) {
      console.warn(`⚠️ 图片放大处理失败: ${error.message}`);
      console.log("📸 继续使用原始图片进行视频生成...");
    }
  } else {
    console.log("⏭️ 自动图片放大功能已禁用，跳过图片检测");
  }

  // 根据 generate_section 和 generate_section_num 参数选择要上传的图片和运镜描述
  let imageFiles = [];
  let shots = [];

  // 计算起始索引
  let startIndex, endIndex;

  if (generate_section === 1) {
    // 第一批：正常从0开始
    startIndex = 0;
    endIndex = Math.min(generate_section_num, allImageFiles.length);
  } else {
    // 第二批及以后：包含上一批的最后一张图片
    startIndex = (generate_section - 1) * generate_section_num - 1; // 减1是为了包含上一批的最后一张
    endIndex = Math.min(
      startIndex + generate_section_num,
      allImageFiles.length
    );
  }

  // 选择图片文件
  imageFiles = allImageFiles.slice(startIndex, endIndex);

  console.log(`🔍 调试信息:`);
  console.log(`  - imagesDir: ${imagesDir} (类型: ${typeof imagesDir})`);
  console.log(
    `  - allImageFiles: ${JSON.stringify(allImageFiles)} (类型: ${typeof allImageFiles})`
  );
  console.log(
    `  - imageFiles: ${JSON.stringify(imageFiles)} (类型: ${typeof imageFiles})`
  );
  console.log(`  - startIndex: ${startIndex}, endIndex: ${endIndex}`);

  // 选择对应的运镜描述
  if (generate_section === 1) {
    // 第一批：正常选择运镜描述
    shots = processedData.segments
      .slice(startIndex, endIndex)
      .map((seg) => seg.shot)
      .filter(Boolean);
  } else {
    // 第二批及以后：运镜描述从当前批次开始，不包含重复的
    const shotStartIndex = (generate_section - 1) * generate_section_num;
    const shotEndIndex = Math.min(
      shotStartIndex + generate_section_num - 1,
      processedData.segments.length
    ); // 减1因为图片多了一张

    console.log(
      `shotStartIndex: ${shotStartIndex}, shotEndIndex: ${shotEndIndex}`
    );
    shots = processedData.segments
      .slice(shotStartIndex - 1, shotEndIndex)
      .map((seg) => seg.shot)
      .filter(Boolean);
  }

  console.log(
    `📸 第${generate_section}批：上传图片 ${imageFiles[imageFiles.length - 1]} 到 ${imageFiles[0]}`
  );
  console.log(
    `📝 第${generate_section}批：运镜描述索引 ${startIndex}-${endIndex - 1} (共 ${shots.length} 个)`
  );

  console.log(`📁 本批次将上传 ${imageFiles.length} 张图片`);
  console.log(`📝 本批次将输入 ${shots.length} 个运镜描述`);

  // 准备浏览器启动配置
  let launchConfig = {
    headless: false,
    defaultViewport: null,
    executablePath: await getChromePath(),
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

    // 1. 打开即梦视频生成页面
    console.log("🌐 正在打开即梦视频生成页面...");
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForTimeout(3000);

    // 1.5. 检查登录状态，如果需要登录则使用 jimeng 的登录流程
    console.log("🔍 检查登录状态...");
    try {
      // 检查是否有登录按钮（如果有则说明未登录）
      const loginButton = await page.$("#SiderMenuLogin");
      if (loginButton) {
        console.log("🔑 需要登录，开始登录流程...");

        // 点击登录按钮
        await loginButton.click();
        await page.waitForTimeout(2000);

        // 等待用户手动登录
        console.log("⏰ 请手动完成登录，等待60秒...");

        // 等待登录完成（检查登录按钮消失）
        let loginCompleted = false;
        for (let i = 0; i < 60; i++) {
          await page.waitForTimeout(1000);
          const stillNeedLogin = await page.$("#SiderMenuLogin");
          if (!stillNeedLogin) {
            loginCompleted = true;
            console.log("✅ 登录成功！");
            break;
          }
        }

        if (!loginCompleted) {
          throw new Error("登录超时，请手动登录后重试");
        }

        await page.waitForTimeout(2000);
      } else {
        console.log("✅ 未发现登录按钮，可能已登录");
      }
    } catch (error) {
      console.warn(`⚠️ 登录检查失败: ${error.message}`);
    }

    // 2.5. 检查并设置视频比例为 9:16
    console.log("📐 检查视频比例设置...");
    const needsRefresh = await page.evaluate(() => {
      const currentImageRatio = localStorage.getItem(
        "dreamina__generator_image_aspectRatio"
      );
      const currentVideoRatio = localStorage.getItem(
        "dreamina__generator_video_aspectRatio"
      );
      const currentImageLockRatio = localStorage.getItem(
        "dreamina__generator_image_isLockRatio"
      );
      const currentVideoLockRatio = localStorage.getItem(
        "dreamina__generator_video_isLockRatio"
      );

      console.log(`当前图片比例: ${currentImageRatio}`);
      console.log(`当前视频比例: ${currentVideoRatio}`);
      console.log(`当前图片锁定比例: ${currentImageLockRatio}`);
      console.log(`当前视频锁定比例: ${currentVideoLockRatio}`);

      let needsRefresh = false;

      if (currentImageRatio !== "9:16") {
        localStorage.setItem("dreamina__generator_image_aspectRatio", "9:16");
        console.log('✅ 已设置 dreamina__generator_image_aspectRatio: "9:16"');
        needsRefresh = true;
      } else {
        console.log('✅ dreamina__generator_image_aspectRatio 已经是 "9:16"');
      }

      if (currentVideoRatio !== "9:16") {
        localStorage.setItem("dreamina__generator_video_aspectRatio", "9:16");
        console.log('✅ 已设置 dreamina__generator_video_aspectRatio: "9:16"');
        needsRefresh = true;
      } else {
        console.log('✅ dreamina__generator_video_aspectRatio 已经是 "9:16"');
      }

      if (currentImageLockRatio !== "true") {
        localStorage.setItem("dreamina__generator_image_isLockRatio", "true");
        console.log('✅ 已设置 dreamina__generator_image_isLockRatio: "true"');
        needsRefresh = true;
      } else {
        console.log('✅ dreamina__generator_image_isLockRatio 已经是 "true"');
      }

      if (currentVideoLockRatio !== "true") {
        localStorage.setItem("dreamina__generator_video_isLockRatio", "true");
        console.log('✅ 已设置 dreamina__generator_video_isLockRatio: "true"');
        needsRefresh = true;
      } else {
        console.log('✅ dreamina__generator_video_isLockRatio 已经是 "true"');
      }

      return needsRefresh;
    });

    // 强制保存存储状态
    console.log("💾 强制保存浏览器存储状态...");
    await page.evaluate(() => {
      // 触发存储保存
      if (typeof window !== "undefined") {
        // 强制写入 localStorage
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          const value = localStorage.getItem(key);
          localStorage.setItem(key, value);
        });

        // 强制写入 sessionStorage
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach((key) => {
          const value = sessionStorage.getItem(key);
          sessionStorage.setItem(key, value);
        });

        console.log("💾 存储状态已强制保存");
      }
    });

    // 3. 点击"首尾帧"切换到智能多帧模式
    console.log(`🔄 切换到智能多帧模式...`);
    let modeSwithSuccess = false;
    try {
      // 等待页面加载完成
      await page.waitForTimeout(3000);

      // 检查指定选择器范围内的元素
      console.log(
        `🔍 正在分析 ${video_generate_select_trigger_selector} 元素...`
      );
      const triggerElements = await page.evaluate((selector) => {
        const elements = Array.from(document.querySelectorAll(selector));
        return elements.map((el) => ({
          tag: el.tagName,
          text: el.textContent.trim(),
          className: el.className,
        }));
      }, video_generate_select_trigger_selector);

      console.log(
        `📊 找到 ${triggerElements.length} 个 ${video_generate_select_trigger_selector} 元素:`
      );
      triggerElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.tag} [${el.className}]: ${el.text}`);
      });

      // 查找包含"首尾帧"的元素并点击
      const triggerClicked = await page.evaluate(
        (selector, targetText) => {
          const elements = Array.from(document.querySelectorAll(selector));
          const targetElement = elements.find((el) =>
            el.textContent.includes(targetText)
          );

          if (targetElement) {
            console.log(`找到目标元素: ${targetElement.textContent}`);
            targetElement.click();
            return true;
          }
          return false;
        },
        video_generate_select_trigger_selector,
        video_generate_select_trigger_text
      );

      if (triggerClicked) {
        await page.waitForTimeout(1000);

        // 查找并点击"智能多帧"选项
        const itemClicked = await page.evaluate(
          (selector, targetText) => {
            const elements = Array.from(document.querySelectorAll(selector));
            const targetElement = elements.find((el) =>
              el.textContent.includes(targetText)
            );

            if (targetElement) {
              console.log(`找到智能多帧选项: ${targetElement.textContent}`);
              targetElement.click();
              return true;
            }
            return false;
          },
          video_generate_select_item_selector,
          video_generate_select_item_text
        );

        if (itemClicked) {
          modeSwithSuccess = true;
          console.log("✅ 已切换到智能多帧模式");
        } else {
          console.warn("⚠️ 未找到智能多帧选项");
        }
      } else {
        console.warn(
          `⚠️ 未找到包含"${video_generate_select_trigger_text}"的元素`
        );
      }
    } catch (error) {
      console.warn(`⚠️ 切换智能多帧模式失败: ${error.message}`);
    }

    // 4. 上传图片
    console.log("📤 开始上传图片...");
    try {
      // 智能多帧模式：点击第一帧元素进行批量上传
      console.log(`📝 智能多帧模式：点击第一帧元素进行批量上传`);

      // 查找"第一帧"元素
      console.log(`🔍 正在查找"${video_generate_upload_text}"元素...`);
      const firstFrameClicked = await page.evaluate((targetText) => {
        // 查找所有可能的元素
        const allElements = Array.from(document.querySelectorAll("*"));
        const targetElement = allElements.find((el) =>
          el.textContent.includes(targetText)
        );

        if (targetElement) {
          console.log(`找到第一帧元素: ${targetElement.textContent}`);
          targetElement.click();
          return true;
        }
        return false;
      }, video_generate_upload_text);

      if (firstFrameClicked) {
        console.log("✅ 成功点击第一帧元素");
        await page.waitForTimeout(1000);

        // 一次性上传所有图片
        console.log(`📤 开始一次性批量上传 ${imageFiles.length} 张图片...`);

        // 查找文件输入框
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          // 构建完整的文件路径
          const fullPaths = imageFiles.map((filename) => {
            const fullPath = path.resolve(imagesDir, filename);
            console.log(`🔍 构建路径: ${filename} -> ${fullPath}`);
            return fullPath;
          });

          console.log(`📤 一次性上传所有图片: ${imageFiles.join(", ")}`);
          console.log(`🔍 完整路径数组:`, fullPaths);
          console.log(
            `🔍 路径类型检查:`,
            fullPaths.map((p) => typeof p)
          );

          // 验证所有路径都是字符串
          const invalidPaths = fullPaths.filter((p) => typeof p !== "string");
          if (invalidPaths.length > 0) {
            console.error(`❌ 发现非字符串路径:`, invalidPaths);
            throw new Error(
              `路径必须是字符串，但发现: ${invalidPaths.map((p) => typeof p).join(", ")}`
            );
          }

          // 一次性上传所有文件
          await fileInput.uploadFile(...fullPaths);
          await page.waitForTimeout(3000);

          console.log(`✅ 成功一次性上传 ${imageFiles.length} 张图片`);
        } else {
          throw new Error("未找到文件上传输入框");
        }

        console.log("✅ 批量上传完成！");
      } else {
        throw new Error(`未找到"${video_generate_upload_text}"元素`);
      }
    } catch (error) {
      console.error(`❌ 图片上传失败: ${error.message}`);
      throw error;
    }

    // 5. 输入运镜描述
    if (useShot) {
      console.log("📝 开始输入运镜描述...");
      try {
        // 等待上传完成
        await page.waitForTimeout(3000);

        // 查找所有运镜按钮
        console.log(
          `🔍 正在分析运镜按钮元素 (${video_generate_shot_text_btn_selector})...`
        );

        console.log("📊 开始处理运镜描述...", shots);
        let processedCount = 0;

        // 逐个处理运镜描述
        for (let i = 0; i < generate_section_num - 1; i++) {
          const shot = shots[i];
          if (!shot) {
            console.log(`⚠️ 第 ${i + 1} 个运镜描述为空，跳过处理`);
            continue;
          }
          console.log(
            `📝 处理第 ${i + 1} 个运镜描述: ${shot.substring(0, 50)}...`
          );

          try {
            // 步骤1: 点击第i+1个运镜按钮
            console.log(`🔍 点击第 ${i + 1} 个运镜按钮...`);
            const buttonClicked = await page.evaluate(
              (selector, index) => {
                const button = document.querySelector(selector);
                if (button) {
                  // 点击 input 元素的父元素
                  const parentElement = button.parentElement;
                  // console.log(
                  //   `找到第 ${index + 1} 个运镜按钮:`,
                  //   buttons[index].tagName,
                  //   buttons[index].className,
                  //   `父元素:`,
                  //   parentElement.tagName,
                  //   parentElement.className
                  // );
                  parentElement.click();
                  return true;
                }
                return false;
              },
              video_generate_shot_text_btn_selector,
              i
            );

            if (buttonClicked) {
              console.log(`✅ 成功点击第 ${i + 1} 个运镜按钮，弹窗已出现`);
              await page.waitForTimeout(1000);

              // 步骤2: 在弹窗中查找textarea并输入运镜描述
              console.log(
                `📝 在当前弹窗中查找textarea并输入第 ${i + 1} 个运镜描述...`
              );
              const textareaFound = await page.evaluate((selector) => {
                const textareas = Array.from(
                  document.querySelectorAll(selector)
                );
                return textareas.length > 0;
              }, video_generate_shot_input_selector);

              if (textareaFound) {
                // 步骤3: 输入运镜描述
                console.log(`📝 开始模拟输入第 ${i + 1} 个运镜描述...`);
                const textarea = await page.$(
                  video_generate_shot_input_selector
                );

                // 清空并输入新内容
                await page.evaluate((el) => {
                  el.value = "";
                  el.focus();
                }, textarea);

                // 分段输入，模拟人类打字
                const chunks = shot.match(/.{1,20}/g) || [shot];
                for (let j = 0; j < chunks.length; j++) {
                  const chunk = chunks[j];
                  // 随机打字延迟，模拟人类
                  const typingDelay = Math.floor(Math.random() * 30) + 20; // 20-50ms每字符
                  await textarea.type(chunk, { delay: typingDelay });

                  // 段落间随机停顿
                  if (j < chunks.length - 1) {
                    const pauseDelay = Math.floor(Math.random() * 300) + 100; // 100-400ms
                    await page.waitForTimeout(pauseDelay);
                  }
                }

                // 触发相关事件确保输入被识别
                await page.evaluate(
                  (el, value) => {
                    el.value = value;
                    el.focus();

                    // 触发input事件
                    const inputEvent = new Event("input", { bubbles: true });
                    el.dispatchEvent(inputEvent);

                    // 触发change事件
                    const changeEvent = new Event("change", { bubbles: true });
                    el.dispatchEvent(changeEvent);

                    // 触发blur事件
                    const blurEvent = new Event("blur", { bubbles: true });
                    el.dispatchEvent(blurEvent);

                    // 再次聚焦确保状态正确
                    el.focus();
                  },
                  textarea,
                  shot
                );

                await page.waitForTimeout(500);
                console.log(
                  `✅ 第 ${i + 1} 个运镜描述输入完成，已触发相关事件`
                );

                // 步骤4: 点击确认按钮
                console.log(`🔍 点击确认按钮...`);
                const confirmClicked = await page.evaluate((selector) => {
                  const elements = Array.from(
                    document.querySelectorAll(selector)
                  );
                  const availableElements = elements.filter(
                    (el) =>
                      !el.disabled &&
                      !el.hasAttribute("disabled") &&
                      el.offsetParent !== null
                  );

                  if (availableElements.length > 0) {
                    console.log(
                      `找到可点击的确认按钮:`,
                      availableElements[0].tagName,
                      availableElements[0].className
                    );
                    availableElements[0].click();
                    return true;
                  }
                  return false;
                }, video_generate_shot_input_confirm_select);

                if (confirmClicked) {
                  // 步骤5: 等待弹窗关闭，准备处理下一个
                  await page.waitForTimeout(1500);
                  processedCount++;
                  console.log(
                    `✅ 第 ${
                      i + 1
                    } 个运镜描述处理完成，弹窗已关闭 (已处理 ${processedCount} 个)`
                  );

                  // 如果不是最后一个，显示准备处理下一个的信息
                  if (i < shots.length - 1) {
                    console.log(`🔄 准备处理第 ${i + 2} 个运镜描述...`);
                  }
                } else {
                  console.warn(
                    `⚠️ 未找到当前弹窗中的确认按钮，第 ${
                      i + 1
                    } 个运镜描述可能未完成`
                  );
                }
              } else {
                console.warn(`⚠️ 未找到当前弹窗中的textarea输入框`);
              }
            } else {
              console.warn(`⚠️ 未找到第${i + 1}个运镜按钮元素`);
            }
          } catch (error) {
            console.warn(`⚠️ 处理第 ${i + 1} 个运镜描述失败: ${error.message}`);
          }
        }

        console.log("✅ 即梦视频生成配置完成！");
        console.log("⏰ 请手动点击生成按钮开始视频生成...");

        // 等待用户手动操作（减少等待时间）
        await page.waitForTimeout(1000000000);
      } catch (error) {
        console.error(`❌ 输入运镜描述失败: ${error.message}`);
        throw error;
      }
    } else {
      console.log("⚠️ useShot 为 false，跳过运镜描述输入");
      console.log("✅ 即梦视频生成配置完成！");
      console.log("⏰ 请手动点击生成按钮开始视频生成...");

      // 等待用户手动操作（减少等待时间）
      await page.waitForTimeout(1000000000);
    }
  } finally {
    await browser.close();
  }
}
