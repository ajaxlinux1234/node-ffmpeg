# 视频去重功能更新日志

## 版本: v0.2.0
**发布日期**: 2024-11-26

### 🎉 新增功能

#### 视频去重命令 (video-dedup)

新增了强大的视频去重子命令，支持多种去重技术的组合使用。

### ✨ 核心特性

1. **随机低透明度扫光** 🌟
   - 动态扫光效果，每次运行随机生成
   - 可配置透明度、速度、角度、颜色
   - 不影响视频主体内容

2. **MD5修改** 🔐
   - 自动修改视频文件MD5值
   - 避免平台重复检测
   - 不影响视频播放

3. **黑边框** 📐
   - 添加上下或左右黑边框
   - 改变视频尺寸特征
   - 支持自定义边框大小

4. **锐化** 🔪
   - 适当锐化视频画面
   - 三档强度可选 (light/medium/strong)
   - 提升视频清晰度

5. **降噪** 🔇
   - 对视频进行降噪处理
   - 三档强度可选 (light/medium/strong)
   - 改善视频质量

6. **变速处理** ⚡
   - 可配置的加快变速 (1.0-1.2倍)
   - 同时调整视频和音频
   - 保持音调自然

### 📁 新增文件

```
lib/video-dedup.mjs              # 核心功能实现
docs/VIDEO_DEDUP_GUIDE.md        # 详细使用指南
docs/VIDEO_DEDUP_README.md       # 快速开始文档
test-video-dedup.mjs             # 测试脚本
CHANGELOG_VIDEO_DEDUP.md         # 本文件
```

### 🔧 修改文件

```
bin/cli.mjs                      # 添加video-dedup命令
config.mjs                       # 添加video-dedup配置示例
```

### 📝 使用方法

#### 1. 配置 (config.mjs)
```javascript
"video-dedup": {
  input: "input/video.mp4",
  
  sweepLight: { enabled: true, opacity: 0.15, speed: 'medium' },
  modifyMD5: true,
  letterbox: { enabled: true, top: 40, bottom: 40 },
  sharpen: { enabled: true, strength: 'medium' },
  denoise: { enabled: true, strength: 'light' },
  speedChange: { enabled: true, speed: 1.05 },
  
  quality: 'high',
  keepAudio: true
}
```

#### 2. 运行命令
```bash
# 查看帮助
npx node-ffmpeg-tools video-dedup --help

# 运行去重
npx node-ffmpeg-tools video-dedup

# 快速测试
node test-video-dedup.mjs
```

### 🎯 使用场景

| 场景 | 配置建议 | 说明 |
|------|----------|------|
| 轻度去重 | 扫光 + MD5 | 保持原视频质量 |
| 标准去重 | 扫光 + MD5 + 黑边 + 轻度锐化/降噪 | 平衡效果和质量 |
| 强度去重 | 全部启用 + 中等强度 | 最大化去重效果 |

### 🔍 技术实现

- **FFmpeg滤镜**: geq, pad, unsharp, hqdn3d, setpts, atempo
- **编码器**: libx264 (H.264)
- **音频编码**: AAC (变速时) / copy (不变速时)
- **质量控制**: CRF 18/23/28 (high/medium/low)

### ⚙️ 配置选项

#### 全局选项
- `input`: 输入视频路径 (必需)
- `output`: 输出视频路径 (可选，自动生成)
- `quality`: 视频质量 (high/medium/low)
- `keepAudio`: 是否保留音频 (true/false)

#### 扫光选项
- `enabled`: 是否启用
- `opacity`: 透明度 (0.05-0.3)
- `speed`: 速度 (slow/medium/fast)
- `angle`: 角度 (null=随机, 0-360)
- `width`: 宽度 (0.1-0.5)
- `color`: 颜色 (white/gold/blue/rainbow)

#### 其他选项
详见 [VIDEO_DEDUP_GUIDE.md](docs/VIDEO_DEDUP_GUIDE.md)

### 📊 性能指标

| 配置 | 处理速度 | 文件大小变化 | 质量影响 |
|------|----------|--------------|----------|
| 轻度去重 | 快 | +5-10% | 几乎无 |
| 标准去重 | 中等 | +10-20% | 轻微 |
| 强度去重 | 较慢 | +20-30% | 中等 |

### ⚠️ 注意事项

1. 所有去重效果可以同时启用，也可以单独配置
2. 扫光效果每次运行都会随机生成（如果angle为null）
3. MD5修改在视频处理完成后自动执行
4. 变速会同时调整视频和音频速度
5. 建议使用 high 质量以保持视频清晰度
6. 多功能叠加会增加处理时间

### 🐛 已知问题

无

### 🔮 未来计划

- [ ] 支持批量处理多个视频
- [ ] 添加更多扫光效果样式
- [ ] 支持自定义滤镜组合
- [ ] 添加预览功能
- [ ] 性能优化

### 📚 文档

- [详细使用指南](docs/VIDEO_DEDUP_GUIDE.md)
- [快速开始](docs/VIDEO_DEDUP_README.md)

### 🙏 致谢

感谢 FFmpeg 项目提供的强大视频处理能力。

---

**完整命令列表**:
```bash
npx node-ffmpeg-tools video-dedup --help  # 查看帮助
npx node-ffmpeg-tools video-dedup         # 运行去重
node test-video-dedup.mjs                 # 快速测试
```
