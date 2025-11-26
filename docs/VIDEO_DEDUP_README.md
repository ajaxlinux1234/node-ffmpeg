# 视频去重功能 (Video Deduplication)

## 快速开始

### 1. 配置
在 `config.mjs` 中配置 `video-dedup` 部分：

```javascript
"video-dedup": {
  input: "input/video.mp4",
  
  sweepLight: { enabled: true, opacity: 0.15 },
  modifyMD5: true,
  letterbox: { enabled: true, top: 40, bottom: 40 },
  sharpen: { enabled: true, strength: 'medium' },
  denoise: { enabled: true, strength: 'light' },
  speedChange: { enabled: true, speed: 1.05 },
  
  quality: 'high',
  keepAudio: true
}
```

### 2. 运行
```bash
npx node-ffmpeg-tools video-dedup
```

### 3. 查看帮助
```bash
npx node-ffmpeg-tools video-dedup --help
```

## 功能列表

### 基础去重功能
| 功能 | 说明 | 配置项 |
|------|------|--------|
| 🌟 随机噪点 | 添加随机噪点效果 | `sweepLight` |
| 🔐 MD5修改 | 修改文件MD5值 | `modifyMD5` |
| 📐 黑边框 | 添加上下左右黑边 | `letterbox` |
| 🔪 锐化 | 适当锐化画面 | `sharpen` |
| 🔇 降噪 | 视频降噪处理 | `denoise` |
| ⚡ 变速 | 1.0-1.2倍速调整 | `speedChange` |

### 高级去重功能
| 功能 | 说明 | 配置项 |
|------|------|--------|
| 🎨 色彩调整 | 随机微调色调/饱和度/亮度/对比度 | `colorAdjust` |
| 🔄 镜像翻转 | 水平或垂直翻转 | `flip` |
| 📏 缩放 | 微调视频尺寸 | `scale` |
| 🔃 旋转 | 微调视频角度 | `rotate` |
| 🎞️ 帧率调整 | 改变视频帧率 | `fpsAdjust` |
| 💫 模糊 | 轻微模糊效果 | `blur` |
| 📈 色彩曲线 | 应用色彩曲线预设 | `curves` |
| ⏰ 时间戳 | 添加不可见/可见时间戳 | `timestamp` |

### 性能优化
| 功能 | 说明 | 配置项 |
|------|------|--------|
| 🚀 GPU加速 | 自动检测硬件加速 | 自动 |
| 🧵 多线程 | CPU多线程编码 | 自动 |
| 📊 进度显示 | 实时处理进度 | 自动 |

**总计**: 14种去重手段 + 3种性能优化

## 配置参数详解

### 扫光效果 (sweepLight)
```javascript
sweepLight: {
  enabled: true,      // 是否启用
  opacity: 0.15,      // 透明度 0.05-0.3
  speed: 'medium',    // slow/medium/fast
  angle: null,        // null=随机，或0-360度
  width: 0.3,         // 宽度 0.1-0.5
  color: 'white'      // white/gold/blue/rainbow
}
```

### 黑边框 (letterbox)
```javascript
letterbox: {
  enabled: true,
  top: 40,           // 上边框像素
  bottom: 40,        // 下边框像素
  left: 0,           // 左边框像素
  right: 0           // 右边框像素
}
```

### 锐化 (sharpen)
```javascript
sharpen: {
  enabled: true,
  strength: 'medium'  // light/medium/strong
}
```

### 降噪 (denoise)
```javascript
denoise: {
  enabled: true,
  strength: 'light'   // light/medium/strong
}
```

### 变速 (speedChange)
```javascript
speedChange: {
  enabled: true,
  speed: 1.05        // 1.0-1.2
}
```

## 使用场景

### 场景1: 轻度去重
适合高质量视频，只需要轻微修改：
```javascript
sweepLight: { enabled: true, opacity: 0.1 },
modifyMD5: true,
letterbox: { enabled: false },
sharpen: { enabled: false },
denoise: { enabled: false },
speedChange: { enabled: false }
```

### 场景2: 标准去重
平衡效果和质量：
```javascript
sweepLight: { enabled: true, opacity: 0.15 },
modifyMD5: true,
letterbox: { enabled: true, top: 40, bottom: 40 },
sharpen: { enabled: true, strength: 'light' },
denoise: { enabled: true, strength: 'light' },
speedChange: { enabled: true, speed: 1.03 }
```

### 场景3: 强度去重
最大化去重效果：
```javascript
sweepLight: { enabled: true, opacity: 0.2 },
modifyMD5: true,
letterbox: { enabled: true, top: 60, bottom: 60 },
sharpen: { enabled: true, strength: 'medium' },
denoise: { enabled: true, strength: 'medium' },
speedChange: { enabled: true, speed: 1.08 }
```

## 输出示例

```
🎬 开始处理视频...
📥 输入: input/video.mp4
📤 输出: output/video-dedup/video_dedup_1234567890.mp4
⚙️  质量: high
🔊 音频: 保留

✨ 启用扫光效果: 透明度=0.15, 速度=medium
📐 启用黑边框: 上=40px, 下=40px
🔪 启用锐化: 强度=medium
🔇 启用降噪: 强度=light
⚡ 启用变速: 1.05x

✅ 视频处理完成！
🔐 正在修改MD5...
✅ MD5修改完成
📁 输出文件: output/video-dedup/video_dedup_1234567890.mp4
📊 文件大小: 45.67 MB

📋 去重效果摘要:
  ✓ 随机扫光
  ✓ MD5修改
  ✓ 黑边框
  ✓ 锐化
  ✓ 降噪
  ✓ 变速 (1.05x)
```

## 技术实现

- **噪点**: FFmpeg noise滤镜
- **MD5**: 文件末尾添加随机字节
- **黑边框**: FFmpeg pad滤镜
- **锐化**: FFmpeg unsharp滤镜
- **降噪**: FFmpeg hqdn3d滤镜
- **变速**: FFmpeg setpts + atempo滤镜
- **GPU加速**: VideoToolbox/CUDA/QSV硬件编码器
- **多线程**: libx264多线程编码（75% CPU核心）
- **进度显示**: 实时解析FFmpeg进度输出

## 注意事项

1. ✅ 所有功能可独立启用/禁用
2. ✅ 扫光角度为null时每次随机
3. ✅ 变速同时调整视频和音频
4. ⚠️ 高质量设置会增加文件大小
5. ⚠️ 多功能叠加会增加处理时间
6. ⚠️ 扫光透明度过高影响观看

## 常见问题

**Q: 如何只使用某几个功能？**  
A: 将不需要的功能的 `enabled` 设为 `false`

**Q: 扫光效果太明显？**  
A: 降低 `opacity` 到 0.1-0.15

**Q: 变速后声音不自然？**  
A: 降低 `speed` 到 1.03-1.05

**Q: 处理速度太慢？**  
A: 设置 `quality: 'medium'` 或禁用部分功能

## 更多信息

详细文档请查看: [VIDEO_DEDUP_GUIDE.md](./VIDEO_DEDUP_GUIDE.md)
