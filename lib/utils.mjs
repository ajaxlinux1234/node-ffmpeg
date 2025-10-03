/**
 * 获取 Chrome 浏览器路径
 */
export function getChromePath() {
  const platform = process.platform;

  if (platform === "darwin") {
    // macOS
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  } else if (platform === "win32") {
    // Windows
    return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  } else {
    // Linux
    return "/usr/bin/google-chrome";
  }
}
