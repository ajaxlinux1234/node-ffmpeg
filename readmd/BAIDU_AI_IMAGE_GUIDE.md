# 百度AI生图配置指南

## 🎯 概述

百度AI生图功能已集成到 `auto-deepseek-jimeng` 模块中，支持从DeepSeek获取提示词后自动使用百度AI生成图片。

## 🔧 配置说明

### 主配置文件设置

在 `config.mjs` 中设置图片生成类型：

```javascript
"auto-deepseek-jimeng": {
  imgGenerateType: "baidu", // 设置为 "baidu" 使用百度AI生图
  deepseek: deepseekConfig,
  jimeng: jimengConfig,
  baidu: baiduConfig, // 百度配置
}
```

### 百度配置参数

#### 基础配置
- `persistLogin: true` - 启用登录状态持久化
- `downloadImg: true` - 启用图片下载功能
- `useImgUrl: true` - 使用URL直接下载模式

#### 网站配置
- `url: "https://chat.baidu.com/search"` - 百度AI生图页面
- `inputPrefixText` - 输入前缀文本，自动添加到每个提示词前面

#### 选择器配置
- `login_selector` - 登录相关选择器（手动登录模式）
- `generate_button_selector` - 生成按钮选择器
- `img_generate_input_selector` - 输入框选择器（函数格式）
- `img_generate_input_send_selector` - 发送按钮选择器
- `gernerate_img_result_selector` - 生成结果容器选择器

#### 特有配置
- `waitForGeneration: 30000` - 等待图片生成完成的时间（毫秒）
- `scrollWaitTime: 3000` - 滚动等待时间（毫秒）
- `downloadRetryCount: 3` - 下载重试次数
- `downloadTimeout: 30000` - 下载超时时间（毫秒）

## 🚀 使用流程

### 1. 设置配置
```javascript
// 在 config.mjs 中设置
"auto-deepseek-jimeng": {
  imgGenerateType: "baidu", // 关键：选择百度
  deepseek: deepseekConfig,
  baidu: baiduConfig, // 确保百度配置存在
  // ... 其他配置
}
```

### 2. 运行命令
```bash
npx node-ffmpeg-tools auto-deepseek-jimeng
```

### 3. 自动化流程
1. **DeepSeek流程** - 自动获取视频生成提示词
2. **百度AI生图** - 自动打开百度AI生图页面
3. **手动登录** - 首次使用需要手动登录（60秒内）
4. **前缀增强** - 每个提示词自动添加 `inputPrefixText` 前缀
5. **批量生成** - 自动发送所有提示词到百度AI
6. **自动下载** - 使用URL直接下载模式获取生成的图片

## 🎨 功能特点

### URL直接下载模式
- ✅ **高效快速** - 直接获取图片URL进行下载
- ✅ **稳定可靠** - 避免复杂的页面交互操作
- ✅ **智能去重** - 自动检测并避免重复下载
- ✅ **格式支持** - 自动检测图片格式（PNG、JPG、WebP等）

### 浏览器状态持久化
- ✅ **一次登录** - 首次手动登录后，后续自动保持登录状态
- ✅ **状态保存** - 浏览器自动保存Cookie、缓存等登录信息
- ✅ **反检测** - 真实用户行为，不会被反自动化检测

### 智能批量处理
- ✅ **批量发送** - 自动发送所有DeepSeek生成的提示词
- ✅ **前缀增强** - 每个提示词前自动添加`inputPrefixText`，提升生图质量
- ✅ **智能等待** - 自动等待图片生成完成
- ✅ **错误处理** - 单个图片失败不影响整体流程

### 前缀文本功能
`inputPrefixText` 会在每个DeepSeek提示词前自动添加，例如：

**原始提示词**：
```
1924年，安徽一户书香门第的内室，温暖的烛光下...
```

**实际发送**：
```
AI生图 超清画质 电影写实风格 比例9:16 1924年，安徽一户书香门第的内室，温暖的烛光下...
```

这样可以确保每张图片都具有统一的高质量标准和正确的比例。

## 🔧 代码实现

### 核心文件结构
```
lib/auto-deepseek-jimeng/
├── auto-deepseek-jimeng.mjs     # 主控制器，支持 imgGenerateType 选择
├── baidu-generator.mjs          # 百度AI生图专用生成器
├── baidu-config.mjs             # 百度配置文件
├── jimeng-generator.mjs         # 即梦生成器（已更新支持前缀文本）
└── deepseek-generator.mjs       # DeepSeek生成器
```

### 关键实现特性

#### 1. **智能服务选择**
```javascript
// 根据 imgGenerateType 自动选择服务
if (imgGenerateType === "baidu") {
  await runBaiduFlow(imageGeneratorConfig, processedData);
} else {
  await runJimengFlow(imageGeneratorConfig, processedData);
}
```

#### 2. **前缀文本处理**
```javascript
// 在发送前自动添加前缀和后缀
let finalPrompt = originalPrompt;

if (inputPrefixText) {
  finalPrompt = `${inputPrefixText} ${finalPrompt}`;
}

if (inputSuffixText) {
  finalPrompt = `${finalPrompt} ${inputSuffixText}`;
}
```

#### 3. **独立的浏览器数据管理**
- 百度：`browser-data/baidu-profile-{accountId}/`
- 即梦：`browser-data/jimeng-profile-{accountId}/`
- DeepSeek：`browser-data/deepseek-profile/`

#### 4. **统一的下载机制**
```javascript
// URL列表模式下载，支持多种图片格式
const imageUrls = await page.evaluate(img_result_urls);
await downloadImagesFromUrls(page, imageUrls, name, downloadedHashes);
```

## 📁 输出结构

```
output/
└── {name}/
    ├── processed_data.json    # DeepSeek处理数据
    ├── raw_results.json       # DeepSeek原始数据
    ├── segments.txt           # 文本格式数据
    └── images/                # 百度AI生成的图片
        ├── image_1.jpg        # 第1个提示词对应的图片
        ├── image_2.jpg        # 第2个提示词对应的图片
        └── ...
```

## 🔍 与即梦的区别

| 特性 | 百度AI生图 | 即梦 |
|------|------------|------|
| 登录方式 | 手动登录 | 手动登录 |
| 下载模式 | URL直接下载 | URL直接下载 + 虚拟列表滚动 |
| 页面结构 | 标准列表 | 虚拟列表 |
| 选择器 | `.ai-entry-block` | `div[data-index]` |
| 等待时间 | 30秒 | 动态调整 |

## 🛠️ 故障排除

### 常见问题

1. **登录失败**
   - 确保在60秒内完成手动登录
   - 检查网络连接是否正常
   - 尝试清理浏览器数据：`npx node-ffmpeg-tools clear-browser-data`

2. **图片下载失败**
   - 检查 `useImgUrl: true` 是否设置
   - 确认 `downloadImg: true` 已启用
   - 查看控制台日志中的错误信息

3. **提示词发送失败**
   - 检查输入框选择器是否正确
   - 确认发送按钮选择器是否有效
   - 验证页面是否已正确加载

### 调试模式

设置 `headless: false` 可以看到浏览器操作过程：
```javascript
// 在配置中临时设置
headless: false, // 显示浏览器窗口用于调试
```

## 📝 日志示例

### 成功运行日志
```
🚀 启动 auto-deepseek-jimeng 功能...
🎨 使用图片生成服务: 百度AI生图
🎨 开始百度AI生图图片生成流程...
🔑 使用百度账号ID: 1
📝 百度账号 1 首次使用，需要登录并保存登录状态
🔐 启用登录状态持久化，百度账号 1 数据保存在: browser-data/baidu-profile-1
🌐 正在打开百度AI生图页面...
🔍 检查登录状态...
🔐 检测到登录按钮，需要登录...
⏰ 请手动完成百度登录，等待60秒...
✅ 百度登录成功！
📝 准备发送 18 个提示词到百度AI生图
📝 发送第 1/18 个提示词到百度AI:
   原始: 中国人面孔，像邓稼先，生成图片要符合实际生活场景，1924年...
   完整: AI生图 超清画质 电影写实风格 比例9:16 中国人面孔，像邓稼先...
✅ 第 1 个提示词已发送到百度AI
...
⏳ 等待所有图片生成完成... (30秒)
📥 开始下载百度AI生成的图片...
🔄 第 1 次尝试获取百度图片URL...
📝 百度AI生图获取到 18 个图片URL
🔗 百度AI生图URL列表模式下载 18 张图片...
✅ 第 1 张图片下载完成 (image_1.png) [格式: PNG] [百度URL模式]
✅ 第 2 张图片下载完成 (image_2.jpg) [格式: JPG] [百度URL模式]
...
📊 百度URL列表模式下载结果: 18/18
✅ 百度AI生图流程完成！
```

## 🎯 最佳实践

1. **首次使用** - 确保网络稳定，预留足够时间进行手动登录
2. **批量生成** - 建议一次处理10-20个提示词，避免过多请求
3. **定期清理** - 定期清理浏览器数据以保持最佳性能
4. **备份配置** - 保存有效的选择器配置以备后用

这个配置让你可以无缝地从即梦切换到百度AI生图，享受不同AI生图服务的特色功能。
