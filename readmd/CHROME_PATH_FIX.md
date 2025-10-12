# Chrome浏览器路径修复指南

## 🐛 问题描述
在Windows系统上运行 `auto-deepseek-jimeng` 时遇到Chrome浏览器路径错误：
```
Error: Failed to launch the browser process! spawn C:\Program Files\Google\Chrome\Application\chrome.exe ENOENT
```

## 🔧 修复方案

### 1. **智能Chrome路径检测**
修改了 `lib/utils.mjs` 中的 `getChromePath()` 函数：

```javascript
export async function getChromePath() {
  const platform = process.platform;

  if (platform === "win32") {
    // Windows - 尝试多个可能的路径
    const possiblePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
      process.env.PROGRAMFILES + "\\Google\\Chrome\\Application\\chrome.exe",
      process.env["PROGRAMFILES(X86)"] + "\\Google\\Chrome\\Application\\chrome.exe"
    ];
    
    // 返回第一个存在的路径
    for (const chromePath of possiblePaths) {
      if (chromePath) {
        try {
          await fs.access(chromePath);
          return chromePath;
        } catch (error) {
          continue;
        }
      }
    }
    
    // 如果都找不到，返回undefined让Puppeteer使用默认路径
    return undefined;
  }
  // ... 其他平台
}
```

### 2. **更新所有生成器**
在所有生成器文件中添加了智能Chrome路径设置：

#### DeepSeek生成器 (`deepseek-generator.mjs`)
```javascript
// 智能设置Chrome路径
const chromePath = await getChromePath();
if (chromePath) {
  launchConfig.executablePath = chromePath;
  console.log(`🔍 使用Chrome路径: ${chromePath}`);
} else {
  console.log(`🔍 使用系统默认Chrome路径`);
}
```

#### 即梦生成器 (`jimeng-generator.mjs`)
```javascript
// 智能设置Chrome路径
const chromePath = await getChromePath();
if (chromePath) {
  launchConfig.executablePath = chromePath;
  console.log(`🔍 使用Chrome路径: ${chromePath}`);
} else {
  console.log(`🔍 使用系统默认Chrome路径`);
}
```

#### 百度生成器 (`baidu-generator.mjs`)
```javascript
// 智能设置Chrome路径
const chromePath = await getChromePath();
if (chromePath) {
  launchConfig.executablePath = chromePath;
  console.log(`🔍 使用Chrome路径: ${chromePath}`);
} else {
  console.log(`🔍 使用系统默认Chrome路径`);
}
```

## 🎯 修复效果

### 修复前
```
Error: Failed to launch the browser process! spawn C:\Program Files\Google\Chrome\Application\chrome.exe ENOENT
```

### 修复后
```
🔍 使用系统默认Chrome路径
🔐 启用登录状态持久化，数据保存在: E:\node-ffmpeg\browser-data\deepseek-profile
🌐 正在打开DeepSeek页面...
```

## 🚀 技术特点

### 1. **多路径检测**
- 检查多个常见的Chrome安装路径
- 支持不同的Windows安装方式
- 使用环境变量动态构建路径

### 2. **智能回退**
- 如果找到有效路径，使用指定路径
- 如果找不到，让Puppeteer使用系统默认路径
- 避免硬编码路径导致的问题

### 3. **异步处理**
- 使用 `fs.access()` 异步检查文件存在性
- 避免阻塞主线程
- 更好的错误处理

### 4. **统一实现**
- 所有生成器使用相同的Chrome路径检测逻辑
- 一致的日志输出格式
- 便于维护和调试

## 📝 使用说明

现在运行任何 auto-deepseek-jimeng 相关命令都会自动检测Chrome路径：

```bash
npx node-ffmpeg-tools auto-deepseek-jimeng
```

系统会自动：
1. 检测Chrome安装路径
2. 显示使用的路径信息
3. 正常启动浏览器进行自动化操作

## 🔍 故障排除

如果仍然遇到Chrome路径问题：

1. **手动安装Chrome** - 确保系统已安装Google Chrome浏览器
2. **检查安装路径** - 验证Chrome是否安装在标准路径
3. **查看日志** - 观察控制台输出的Chrome路径信息
4. **环境变量** - 确保相关环境变量设置正确

这个修复确保了在各种Windows环境下都能正常启动Chrome浏览器进行自动化操作。
