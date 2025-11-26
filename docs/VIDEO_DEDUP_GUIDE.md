# 视频去重工具使用指南

## 功能概述

视频去重工具提供多种技术手段对视频进行去重处理，避免平台重复检测，所有功能可以同时启用或单独配置。

### 🚀 性能优化
- **GPU硬件加速**: 自动检测并使用VideoToolbox(macOS)、CUDA(NVIDIA)、QSV(Intel)等硬件加速
- **多线程处理**: CPU模式下自动使用75%的CPU核心进行多线程编码
- **实时进度显示**: 显示处理进度条和百分比
- **优化预设**: 根据硬件自动选择最优编码预设

## 核心功能

### 1. 随机噪点 ✨
- 为视频添加随机噪点效果
- 每次运行生成不同的噪点模式
- 可配置噪点强度
- 不明显影响视频观看体验

### 2. MD5修改 🔐
- 自动修改视频文件的MD5值
- 在文件末尾添加随机数据
- 不影响视频播放

### 3. 黑边框 📐
- 添加上下或左右黑边框
- 改变视频尺寸特征
- 适合调整视频比例

### 4. 锐化 🔪
- 适当锐化视频画面
- 提升视频清晰度
- 三档强度可选

### 5. 降噪 🔇
- 对视频进行降噪处理
- 改善视频质量
- 三档强度可选

### 6. 变速处理 ⚡
- 可配置的加快变速（1.0-1.2倍）
- 同时调整视频和音频速度
- 保持音调自然

## 配置说明

在 `config.mjs` 中添加 `video-dedup` 配置：

```javascript
"video-dedup": {
  input: "input/video.mp4",              // 输入视频路径
  output: "output/video-dedup/out.mp4",  // 输出路径（可选）
  
  // 噪点配置
  sweepLight: {
    enabled: true,                        // 是否启用
    opacity: 0.15,                        // 噪点强度 0.05-0.3
    speed: 'medium',                      // 保留参数（兼容性）
    angle: null,                          // 保留参数（兼容性）
    width: 0.3,                           // 保留参数（兼容性）
    color: 'white'                        // 保留参数（兼容性）
  },
  
  // MD5修改
  modifyMD5: true,                        // 是否修改MD5
  
  // 黑边框配置
  letterbox: {
    enabled: true,                        // 是否启用
    top: 40,                              // 上边框高度（像素）
    bottom: 40,                           // 下边框高度（像素）
    left: 0,                              // 左边框宽度（像素）
    right: 0                              // 右边框宽度（像素）
  },
  
  // 锐化配置
  sharpen: {
    enabled: true,                        // 是否启用
    strength: 'medium'                    // 强度: light, medium, strong
  },
  
  // 降噪配置
  denoise: {
    enabled: true,                        // 是否启用
    strength: 'light'                     // 强度: light, medium, strong
  },
  
  // 变速配置
  speedChange: {
    enabled: true,                        // 是否启用
    speed: 1.05                           // 速度倍数 1.0-1.2
  },
  
  quality: 'high',                        // 质量: high, medium, low
  keepAudio: true                         // 是否保留音频
}
```

## 使用方法

### 查看帮助
```bash
npx node-ffmpeg-tools video-dedup --help
```

### 运行去重处理
```bash
npx node-ffmpeg-tools video-dedup
```

## 配置建议

### 轻度去重（保持原视频质量）
```javascript
sweepLight: { enabled: true, opacity: 0.1, speed: 'fast' },
modifyMD5: true,
letterbox: { enabled: false },
sharpen: { enabled: false },
denoise: { enabled: false },
speedChange: { enabled: false }
```

### 中度去重（平衡效果和质量）
```javascript
sweepLight: { enabled: true, opacity: 0.15, speed: 'medium' },
modifyMD5: true,
letterbox: { enabled: true, top: 40, bottom: 40 },
sharpen: { enabled: true, strength: 'light' },
denoise: { enabled: true, strength: 'light' },
speedChange: { enabled: true, speed: 1.03 }
```

### 强度去重（最大化去重效果）
```javascript
sweepLight: { enabled: true, opacity: 0.2, speed: 'slow' },
modifyMD5: true,
letterbox: { enabled: true, top: 60, bottom: 60 },
sharpen: { enabled: true, strength: 'medium' },
denoise: { enabled: true, strength: 'medium' },
speedChange: { enabled: true, speed: 1.08 }
```

## 参数详解

### 噪点效果参数
- **opacity**: 噪点强度，建议0.1-0.2，过高会影响观看体验
- **speed**: 保留参数（兼容性，不影响功能）
- **angle**: 保留参数（兼容性，不影响功能）
- **color**: 保留参数（兼容性，不影响功能）

### 黑边框参数
- **top/bottom**: 上下边框高度，建议30-60像素
- **left/right**: 左右边框宽度，建议0或30-60像素
- 注意：添加边框会改变视频分辨率

### 锐化强度
- **light**: 轻微锐化，适合已经较清晰的视频
- **medium**: 中等锐化，适合大多数情况
- **strong**: 强烈锐化，可能产生过锐化效果

### 降噪强度
- **light**: 轻微降噪，保留更多细节
- **medium**: 中等降噪，平衡效果
- **strong**: 强烈降噪，可能损失细节

### 变速范围
- **1.0**: 不变速
- **1.03-1.05**: 轻微加快，不易察觉
- **1.05-1.08**: 中等加快，略有感知
- **1.08-1.2**: 明显加快，可能影响观看体验

## 注意事项

1. **质量设置**: 建议使用 `high` 质量以保持视频清晰度
2. **组合使用**: 所有去重效果可以同时启用，效果叠加
3. **随机性**: 扫光角度设为null时，每次运行都会生成不同效果
4. **音频处理**: 变速会同时调整视频和音频，保持同步
5. **文件大小**: 高质量设置会产生较大文件，可根据需要调整
6. **处理时间**: 启用多个效果会增加处理时间

## 输出说明

处理完成后会显示：
- 输出文件路径
- 文件大小
- 启用的去重效果摘要

输出文件默认保存在 `output/video-dedup/` 目录下。

## 常见问题

**Q: 扫光效果太明显怎么办？**  
A: 降低 `opacity` 参数，建议设置为 0.1-0.15

**Q: 变速后音频不自然？**  
A: 降低 `speed` 参数，建议不超过 1.08

**Q: 处理时间太长？**  
A: 可以降低 `quality` 设置为 `medium` 或禁用部分效果

**Q: 如何只使用某几个功能？**  
A: 将不需要的功能的 `enabled` 设置为 `false`

## 技术原理

- **噪点**: 使用FFmpeg的noise滤镜添加随机噪点
- **MD5**: 在文件末尾添加随机字节
- **黑边框**: 使用pad滤镜添加边框
- **锐化**: 使用unsharp滤镜
- **降噪**: 使用hqdn3d滤镜
- **变速**: 使用setpts和atempo滤镜
- **GPU加速**: VideoToolbox(macOS)、h264_nvenc(NVIDIA)、h264_qsv(Intel)
- **多线程**: libx264多线程编码，自动使用75%的CPU核心
- **进度显示**: 解析FFmpeg输出，实时显示处理进度
