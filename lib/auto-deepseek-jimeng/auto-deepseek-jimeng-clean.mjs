import fs from "fs/promises";
import path from "path";

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
    } else {
      // 清理所有即梦账号数据
      try {
        const files = await fs.readdir(browserDataDir);
        const jimengProfiles = files.filter((file) =>
          file.startsWith("jimeng-profile-")
        );

        for (const profile of jimengProfiles) {
          const profilePath = path.join(browserDataDir, profile);
          await fs.rm(profilePath, { recursive: true, force: true });
          console.log(`🧹 ${profile} 浏览器数据已清理`);
        }

        if (jimengProfiles.length === 0) {
          console.log("📝 未找到即梦账号数据");
        }
      } catch (error) {
        console.warn("⚠️ 读取浏览器数据目录时出错:", error.message);
        success = false;
      }
    }
  } catch (error) {
    console.warn("⚠️ 清理即梦浏览器数据时出错:", error.message);
    success = false;
  }

  if (success) {
    console.log("✅ 浏览器数据清理完成");
  } else {
    console.warn("⚠️ 部分浏览器数据清理失败");
  }

  return success;
}

// 其他必要的函数...
// (这里需要包含原文件中除了 runJimengVideoFlow 之外的所有函数)

// runJimengVideoFlow 函数已移至 ./jimeng-video-generator.mjs
