# 视频滤镜使用指南

## 📸 功能介绍

`filter` 命令提供了丰富的视频滤镜效果，包括电影级色彩调整、复古风格、艺术效果等，让你的视频瞬间提升质感。

## 🚀 快速开始

### 1. 列出所有可用滤镜

```bash
npx node-ffmpeg-tools filter --list
```

### 2. 使用预设滤镜

```bash
# 命令行方式
npx node-ffmpeg-tools filter -i input.mp4 -p cinematic-warm

# 配置文件方式
npx node-ffmpeg-tools filter
```

### 3. 使用自定义滤镜

```bash
npx node-ffmpeg-tools filter -i input.mp4 -c "eq=contrast=1.2:saturation=1.3"
```

## 🎨 预设滤镜列表

### 电影风格

| 滤镜名称 | 效果描述 | 适用场景 |
|---------|---------|---------|
| `cinematic-warm` | 温暖的电影感 | 怀旧、温馨场景 |
| `cinematic-cool` | 冷峻的电影感 | 科幻、悬疑场景 |
| `cinematic-teal-orange` | 青橙色调 | 好莱坞大片风格 |
| `noir` | 黑色电影 | 高对比度黑白 |

### 复古风格

| 滤镜名称 | 效果描述 | 适用场景 |
|---------|---------|---------|
| `vintage-film` | 复古胶片 | 老式胶片效果 |
| `80s-vhs` | 80年代VHS | 录像带效果 |
| `sepia` | 棕褐色 | 老照片效果 |

### 艺术风格

| 滤镜名称 | 效果描述 | 适用场景 |
|---------|---------|---------|
| `dramatic` | 戏剧化 | 高对比度场景 |
| `soft-glow` | 柔光 | 柔和光晕效果 |
| `high-contrast` | 高对比度 | 强烈明暗对比 |
| `vibrant` | 鲜艳 | 色彩饱和增强 |

### 色彩调整

| 滤镜名称 | 效果描述 | 适用场景 |
|---------|---------|---------|
| `warm` | 暖色调 | 增加温暖感 |
| `cool` | 冷色调 | 增加冷峻感 |
| `desaturate` | 降低饱和度 | 柔和低饱和 |

### 黑白效果

| 滤镜名称 | 效果描述 | 适用场景 |
|---------|---------|---------|
| `black-white` | 经典黑白 | 黑白效果 |
| `high-contrast-bw` | 高对比黑白 | 强烈黑白 |

### 特殊效果

| 滤镜名称 | 效果描述 | 适用场景 |
|---------|---------|---------|
| `dream` | 梦幻 | 柔焦梦幻 |
| `bleach-bypass` | 漂白效果 | 银盐漂白 |
| `cross-process` | 交叉冲印 | 色彩偏移 |
| `vignette` | 暗角 | 添加暗角 |

### 自然风格

| 滤镜名称 | 效果描述 | 适用场景 |
|---------|---------|---------|
| `natural` | 自然 | 真实色彩 |
| `vivid-nature` | 鲜艳自然 | 增强自然色 |

### 夜景效果

| 滤镜名称 | 效果描述 | 适用场景 |
|---------|---------|---------|
| `night-vision` | 夜视 | 夜视仪效果 |
| `moonlight` | 月光 | 月光蓝色调 |

## ⚙️ 配置选项

### 命令行参数

```bash
npx node-ffmpeg-tools filter [选项]

选项:
  -i, --input <file>        输入视频文件路径 (必需)
  -o, --output <file>       输出视频文件路径 (可选，自动生成)
  -p, --preset <name>       预设滤镜名称
  -c, --custom <filter>     自定义FFmpeg滤镜字符串
  -q, --quality <level>     输出质量: high, medium, low (默认: high)
  --keep-audio <bool>       是否保留音频 (默认: true)
  -l, --list                列出所有可用滤镜
```

### 配置文件 (config.mjs)

```javascript
export default {
  filter: {
    input: "input/video.mp4",
    output: "output/filter/video_filtered.mp4", // 可选
    preset: "cinematic-warm",
    // customFilter: "eq=contrast=1.2", // 与preset二选一
    quality: "high", // high, medium, low
    keepAudio: true
  }
}
```

## 📝 使用示例

### 示例 1: 电影暖色调

```bash
npx node-ffmpeg-tools filter \
  -i input/video.mp4 \
  -p cinematic-warm \
  -q high
```

### 示例 2: 复古胶片效果

```bash
npx node-ffmpeg-tools filter \
  -i input/video.mp4 \
  -p vintage-film \
  -o output/vintage_video.mp4
```

### 示例 3: 自定义滤镜

```bash
npx node-ffmpeg-tools filter \
  -i input/video.mp4 \
  -c "eq=contrast=1.3:saturation=1.2,colorbalance=rs=0.1"
```

### 示例 4: 批量处理（使用配置文件）

```javascript
// config.mjs
export default {
  filter: {
    input: "output/merge-video/merged.mp4",
    preset: "cinematic-teal-orange",
    quality: "high"
  }
}
```

```bash
npx node-ffmpeg-tools filter
```

## 🎯 质量设置说明

| 质量级别 | CRF值 | 编码速度 | 文件大小 | 适用场景 |
|---------|-------|---------|---------|---------|
| `high` | 18 | 慢 | 大 | 最终输出、专业作品 |
| `medium` | 23 | 中等 | 中等 | 一般用途、网络分享 |
| `low` | 28 | 快 | 小 | 预览、测试 |

## 💡 高级技巧

### 1. 组合多个滤镜

使用自定义滤镜字符串组合多个效果：

```bash
npx node-ffmpeg-tools filter \
  -i input.mp4 \
  -c "eq=contrast=1.2:saturation=1.3,vignette=PI/4,curves=vintage"
```

### 2. 创建自己的预设

修改 `lib/filter.mjs` 中的 `FILTER_PRESETS` 对象添加自定义预设：

```javascript
'my-custom-filter': {
  name: '我的自定义滤镜',
  description: '描述效果',
  filter: 'eq=contrast=1.2:saturation=1.3'
}
```

### 3. 批量处理多个视频

创建一个脚本：

```bash
#!/bin/bash
for video in input/*.mp4; do
  npx node-ffmpeg-tools filter -i "$video" -p cinematic-warm
done
```

## 🔧 常见问题

### Q: 如何选择合适的滤镜？

A: 
- **人物视频**: `cinematic-warm`, `soft-glow`, `natural`
- **风景视频**: `vivid-nature`, `cinematic-teal-orange`
- **怀旧风格**: `vintage-film`, `sepia`, `80s-vhs`
- **艺术创作**: `dramatic`, `dream`, `cross-process`

### Q: 处理速度慢怎么办？

A: 
1. 使用较低的质量设置 (`-q medium` 或 `-q low`)
2. 先用低质量预览效果，确定后再用高质量输出
3. 考虑使用硬件加速（需要FFmpeg支持）

### Q: 如何保持原视频质量？

A: 使用 `-q high` 参数，这会使用CRF 18和慢速编码，接近无损质量。

### Q: 可以移除音频吗？

A: 使用 `--keep-audio false` 参数或在配置文件中设置 `keepAudio: false`。

## 📚 相关资源

- [FFmpeg滤镜文档](https://ffmpeg.org/ffmpeg-filters.html)
- [色彩分级基础](https://www.premiumbeat.com/blog/color-grading-101/)
- [电影色调参考](https://www.studiobinder.com/blog/what-is-color-grading/)

## 🤝 贡献

欢迎提交新的滤镜预设！请在 GitHub 上创建 Pull Request。
