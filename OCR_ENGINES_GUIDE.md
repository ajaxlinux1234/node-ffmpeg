# OCR引擎使用指南

## 🎯 概述

`get-promot-image-by-video` 模块现在支持多种OCR引擎，大大提升了中文文字识别的准确率。

## 🔧 支持的OCR引擎

### 1. 百度OCR (推荐)
- **优势**: 中文识别准确率最高，支持复杂场景
- **要求**: 需要申请百度AI开放平台的API密钥
- **成本**: 每月有免费额度，超出后按调用量收费

### 2. PaddleOCR (免费)
- **优势**: 完全免费，本地运行，隐私安全
- **要求**: 需要安装Python和PaddleOCR库
- **性能**: 中文识别效果良好，速度较快

### 3. Tesseract (增强版)
- **优势**: 开源免费，无需网络连接
- **特点**: 使用Sharp进行图像预处理，提升识别率
- **适用**: 作为备用方案，处理简单文字

## ⚙️ 配置方式

### 在config.mjs中配置OCR引擎

```javascript
"get-promot-image-by-video": {
  // OCR引擎配置 - 按优先级排序
  ocrEngines: ['baidu', 'paddle', 'tesseract'],
  
  // 百度OCR配置 (推荐方式：使用环境变量)
  // 在系统环境变量中设置:
  // BAIDU_OCR_API_KEY=你的API密钥
  // BAIDU_OCR_SECRET_KEY=你的SECRET密钥
  
  // 或者直接在配置中设置 (不推荐，有安全风险)
  // baiduOCR: {
  //   apiKey: "your_api_key_here",
  //   secretKey: "your_secret_key_here"
  // },
  
  // 其他配置...
}
```

## 🚀 快速开始

### 1. 仅使用Tesseract (无需额外配置)
```javascript
ocrEngines: ['tesseract']
```

### 2. 使用PaddleOCR (需要安装Python依赖)
```bash
# 安装PaddleOCR
pip install paddlepaddle paddleocr
```

```javascript
ocrEngines: ['paddle', 'tesseract']
```

### 3. 使用百度OCR (需要API密钥)
```bash
# 设置环境变量 (Windows)
set BAIDU_OCR_API_KEY=你的API密钥
set BAIDU_OCR_SECRET_KEY=你的SECRET密钥

# 设置环境变量 (Linux/macOS)
export BAIDU_OCR_API_KEY=你的API密钥
export BAIDU_OCR_SECRET_KEY=你的SECRET密钥
```

```javascript
ocrEngines: ['baidu', 'paddle', 'tesseract']
```

## 📋 百度OCR API申请步骤

### 1. 注册百度AI开放平台
- 访问: https://ai.baidu.com/
- 注册并完成实名认证

### 2. 创建应用
- 进入控制台 → 文字识别
- 创建应用，选择"通用文字识别"
- 获取API Key和Secret Key

### 3. 配置密钥
```bash
# 方式1: 环境变量 (推荐)
set BAIDU_OCR_API_KEY=你的API密钥
set BAIDU_OCR_SECRET_KEY=你的SECRET密钥

# 方式2: 直接在config.mjs中配置 (不推荐)
baiduOCR: {
  apiKey: "你的API密钥",
  secretKey: "你的SECRET密钥"
}
```

## 🔄 工作原理

### 多引擎优先级
1. **百度OCR**: 优先使用，识别率最高
2. **PaddleOCR**: 百度失败时使用，免费本地方案
3. **Tesseract**: 最后备用，确保总能得到结果

### 自动回退机制
- 如果百度OCR API密钥未配置，自动跳过
- 如果PaddleOCR未安装，自动跳过
- Tesseract作为最后保障，确保功能可用

### 结果选择策略
- 优先使用百度OCR的结果
- 其次使用PaddleOCR的结果
- 最后使用Tesseract的结果

## 📊 性能对比

| OCR引擎 | 中文准确率 | 处理速度 | 成本 | 网络要求 |
|---------|------------|----------|------|----------|
| 百度OCR | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 💰 | 需要 |
| PaddleOCR | ⭐⭐⭐⭐ | ⭐⭐⭐ | 免费 | 不需要 |
| Tesseract | ⭐⭐⭐ | ⭐⭐ | 免费 | 不需要 |

## 🎨 使用建议

### 推荐配置 (最佳效果)
```javascript
ocrEngines: ['baidu', 'paddle', 'tesseract']
```
- 有网络时使用百度OCR获得最佳效果
- 无网络或API额度用完时自动切换到本地方案

### 离线配置 (无需网络)
```javascript
ocrEngines: ['paddle', 'tesseract']
```
- 完全本地运行，保护隐私
- 需要预先安装PaddleOCR

### 简单配置 (开箱即用)
```javascript
ocrEngines: ['tesseract']
```
- 无需任何额外配置
- 适合简单的文字识别需求

## 🔧 故障排除

### 百度OCR相关问题
```
❌ 百度OCR API密钥未配置，跳过
```
**解决**: 设置环境变量或在配置文件中添加API密钥

```
❌ 百度OCR识别失败: Request failed with status code 401
```
**解决**: 检查API密钥是否正确，是否有调用额度

### PaddleOCR相关问题
```
❌ PaddleOCR识别失败: No module named 'paddleocr'
```
**解决**: 安装PaddleOCR: `pip install paddlepaddle paddleocr`

```
❌ PaddleOCR识别失败: Command failed
```
**解决**: 检查Python环境，确保paddleocr正确安装

### Tesseract相关问题
```
❌ 增强Tesseract识别失败: Error: spawn tesseract ENOENT
```
**解决**: 确保已安装Tesseract OCR程序

## 📝 日志示例

### 成功运行日志
```
🔍 [步骤3] OCR文本识别 (多引擎支持)
📋 启用的OCR引擎: BAIDU, PADDLE, TESSERACT

📝 识别第 1/6 张图片: frame_1_1s.png

🔍 尝试使用 BAIDU 引擎识别...
✅ BAIDU 识别成功
🎯 使用 BAIDU 的识别结果
✅ 文本识别完成: "罗斯福的一生 1882年 出生于政商家庭"
```

### 回退机制日志
```
🔍 尝试使用 BAIDU 引擎识别...
⚠️ 百度OCR API密钥未配置，跳过

🔍 尝试使用 PADDLE 引擎识别...
✅ PADDLE 识别成功
🎯 使用 PADDLE 的识别结果
```

## 🎯 最佳实践

1. **生产环境**: 使用百度OCR获得最佳识别效果
2. **开发测试**: 使用PaddleOCR节省API调用费用
3. **离线环境**: 使用PaddleOCR + Tesseract组合
4. **简单场景**: 仅使用增强版Tesseract即可

通过合理配置OCR引擎，可以在识别准确率、成本和便利性之间找到最佳平衡点。
