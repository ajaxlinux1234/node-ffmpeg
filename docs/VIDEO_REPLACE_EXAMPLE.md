# videoReplaceUrls 功能说明

## 功能描述

`videoReplaceUrls` 允许你在合并视频后，用新视频替换**合并后视频**中指定时间范围的片段。

## 重要概念

**时间范围是指合并后视频的时间轴，而不是单个视频的索引！**

例如：
- 视频1：40秒
- 视频2：10秒
- 合并后总时长：50秒

`timeRange: [0, 10]` 表示替换合并后视频的 0-10 秒（即视频1的前10秒）
`timeRange: [40, 50]` 表示替换合并后视频的 40-50 秒（即视频2的全部）

## 使用场景

- 需要替换合并后视频中某个时间段的内容
- 想要用高质量视频替换合并视频中的某些片段
- 需要精确控制最终视频的每个时间段

## 配置格式

在 `processed_data.json` 中添加 `videoReplaceUrls` 数组：

```json
{
  "name": "项目名称",
  "urls": [
    "https://example.com/video1.mp4",
    "https://example.com/video2.mp4",
    "https://example.com/video3.mp4"
  ],
  "videoReplaceUrls": [
    {
      "index": 1,
      "url": "https://example.com/replacement-video.mp4",
      "timeRange": [10, 20]
    }
  ],
  "title": "视频标题",
  "segments": [...]
}
```

## 参数说明

### videoReplaceUrls 数组项

- **url** (必需): 替换视频的 URL
- **timeRange** (必需): 数组 `[开始时间, 结束时间]`，单位为秒
  - **重要**：这是合并后视频的时间范围，不是单个视频的索引
  - 开始时间：从合并后视频的第几秒开始替换
  - 结束时间：替换到合并后视频的第几秒

## 示例

### 示例 1：替换合并后视频的前10秒

假设：
- video1.mp4: 40秒
- video2.mp4: 10秒
- 合并后总时长: 50秒

```json
{
  "urls": [
    "https://example.com/video1.mp4",
    "https://example.com/video2.mp4"
  ],
  "videoReplaceUrls": [
    {
      "url": "https://example.com/replacement.mp4",
      "timeRange": [0, 10]
    }
  ]
}
```

**效果**：
- 0-10秒：使用 replacement.mp4 的内容
- 10-50秒：保持原合并视频的内容（video1的后30秒 + video2的10秒）

### 示例 2：替换合并后视频的中间部分

```json
{
  "urls": [
    "https://example.com/video1.mp4",
    "https://example.com/video2.mp4"
  ],
  "videoReplaceUrls": [
    {
      "url": "https://example.com/replacement.mp4",
      "timeRange": [15, 35]
    }
  ]
}
```

**效果**：
- 0-15秒：保持原合并视频（video1的前15秒）
- 15-35秒：使用 replacement.mp4 的内容（20秒）
- 35-50秒：保持原合并视频（video1的后5秒 + video2的10秒）

### 示例 3：替换多个时间段

```json
{
  "urls": [
    "https://example.com/video1.mp4",
    "https://example.com/video2.mp4"
  ],
  "videoReplaceUrls": [
    {
      "url": "https://example.com/intro.mp4",
      "timeRange": [0, 5]
    },
    {
      "url": "https://example.com/outro.mp4",
      "timeRange": [45, 50]
    }
  ]
}
```

**效果**：
- 0-5秒：使用 intro.mp4
- 5-45秒：保持原合并视频
- 45-50秒：使用 outro.mp4

## 工作流程

1. `merge-options` 读取 `processed_data.json`
2. 检测到 `videoReplaceUrls` 参数
3. 将替换信息编码到 URL 中（格式：`CLIP:{start}-{end}:{url}`）
4. 更新 `config.mjs` 的 `merge-video.urls`
5. `merge-video` 执行时：
   - 下载替换视频
   - 使用 FFmpeg 裁剪指定时间范围
   - 用裁剪后的视频替换原视频
   - 合并所有视频

## 注意事项

1. **时间范围**：`timeRange` 是指合并后视频的时间轴，不是单个视频的索引
2. **timeRange 格式**：必须是两个数字的数组 `[start, end]`
3. **时间单位**：秒（支持小数，如 `[10.5, 20.3]`）
4. **替换视频时长**：替换视频应该足够长以覆盖指定的时间范围
5. **多次替换**：可以替换多个时间段，系统会自动按时间顺序处理
6. **重叠检测**：如果时间范围重叠，后面的替换会覆盖前面的

## 错误处理

如果配置错误，系统会：
- 显示警告信息
- 跳过错误的替换项
- 继续处理其他正确的替换项
- 保持原始视频不变

## 命令示例

```bash
# 使用包含 videoReplaceUrls 的配置
npx node-ffmpeg-tools merge-options --name "项目名称" --num 11
```

系统会自动检测并处理 `videoReplaceUrls` 配置。
