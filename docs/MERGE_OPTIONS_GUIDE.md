# merge-options 自动化视频处理流程

## 功能概述

`merge-options` 是一个自动化的视频处理流程命令，它将多个步骤整合在一起，实现从视频合并到最终输出的完整流程。

## 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│  步骤 1: 读取 processed_data.json                            │
│  └─ 从 output/{name}/processed_data.json 读取配置           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  步骤 2: 更新 merge-video 配置                               │
│  └─ 将 urls 字段更新到 config.mjs 的 merge-video 配置中     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  步骤 3: 运行 merge-video 命令                               │
│  └─ 执行 npx node-ffmpeg-tools merge-video                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  步骤 4: 更新 history-person 配置并运行                      │
│  ├─ 将合并后的视频路径更新到 history-person.url             │
│  ├─ 将 title 更新到 history-person.title                    │
│  └─ 执行 npx node-ffmpeg-tools history-person               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  步骤 5: 移动最终视频                                        │
│  └─ 将最终视频移动到 outputUtils/{name}.mp4                 │
└─────────────────────────────────────────────────────────────┘
```

## 配置说明

### 在 config.mjs 中添加配置

```javascript
export default {
  // ... 其他配置 ...

  "merge-options": {
    name: "20251128-亚历山大二世", // 对应 output/{name}/processed_data.json
    highQuality: true, // 默认true，在GPU/内存允许下最大化视频质量
  },

  // ... 其他配置 ...
};
```

### 高质量模式说明

`highQuality` 参数控制视频编码质量（默认为 `true`）：

**启用高质量模式 (highQuality: true):**
- 使用更低的 CRF 值 (10-18)，提供接近无损的画质
- 使用更慢的编码预设 (veryslow/p7)，优化压缩效率
- 启用高级编码参数：
  - NVENC: lookahead, b-frames, spatial/temporal AQ
  - CPU: tune film, high profile, advanced motion estimation
- 更高的音频比特率 (256k)
- 更好的色彩空间处理 (bt709)
- 需要更多 GPU 内存和处理时间

**禁用高质量模式 (highQuality: false):**
- 使用标准 CRF 值 (23)，平衡质量和文件大小
- 使用中等编码预设 (medium/p4)，更快的处理速度
- 标准音频比特率 (192k)
- 适合快速处理或资源受限的环境

### processed_data.json 文件格式

该文件应该位于 `output/{name}/processed_data.json`，格式如下：

```json
{
  "name": "20251128-亚历山大二世",
  "timeNum": 11,
  "urls": [
    "https://example.com/video1.mp4",
    "https://example.com/video2.mp4"
  ],
  "title": "俄罗斯帝国沙皇\\n俄国农奴制改革者\\n亚历山大二世的一生",
  "segments": [
    {
      "title": "1818年\\n出生于俄国皇室\\n开启其人生历程",
      "prompt": "...",
      "shot": "..."
    }
    // ... 更多片段 ...
  ]
}
```

## 使用方法

### 1. 准备工作

确保以下文件存在：
- `output/{name}/processed_data.json` - 包含视频 URLs 和标题信息
- `config.mjs` - 包含 merge-options 配置

### 2. 运行命令

```bash
# 使用配置文件中的 name
npx node-ffmpeg-tools merge-options

# 使用命令行指定的 name（优先级更高）
npx node-ffmpeg-tools merge-options --name "20251128-李光耀"

# 同时指定 name 和更新 historyNum
npx node-ffmpeg-tools merge-options --name "20251128-李光耀" --num 11

# 显示帮助信息
npx node-ffmpeg-tools merge-options --help
```

### 3. 命令行参数优先级

当同时存在配置文件和命令行参数时：
- `--name` 参数的优先级**高于**配置文件中的 `name`
- 这样可以在不修改配置文件的情况下处理不同的项目

### 3. 查看输出

最终视频将保存在：
```
outputUtils/{name}.mp4
```

## 进度显示

命令执行过程中会显示详细的进度信息：

```
============================================================
📊 总体进度: [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 20%
📝 步骤 1/5: 读取 processed_data.json 配置文件
============================================================

============================================================
🚀 执行视频合并
============================================================
[merge-video 的输出...]
✅ 执行视频合并 - 完成

============================================================
📊 总体进度: [████████████████████████░░░░░░░░░░░░] 60%
📝 步骤 3/5: 合并视频 (merge-video)
============================================================
```

## 自动更新的配置

### merge-video 配置

命令会自动更新 `config.mjs` 中的 `merge-video.urls`：

```javascript
"merge-video": {
  urls: [
    "https://example.com/video1.mp4",
    "https://example.com/video2.mp4"
  ],
  // ... 其他配置保持不变 ...
}
```

### history-person 配置

命令会自动更新 `config.mjs` 中的 `history-person.url` 和 `history-person.title`：

```javascript
"history-person": {
  url: "output/merge-video/merged_1234567890_merged.mp4",
  title: `俄罗斯帝国沙皇\n俄国农奴制改革者\n亚历山大二世的一生`,
  // ... 其他配置保持不变 ...
}
```

## 错误处理

### 常见错误及解决方法

1. **找不到 processed_data.json**
   ```
   错误: 无法读取 processed_data.json
   解决: 确保文件存在于 output/{name}/processed_data.json
   ```

2. **配置中缺少 name 字段**
   ```
   错误: 配置中缺少 name 字段
   解决: 在 config.mjs 的 merge-options 中添加 name 字段
   ```

3. **未找到合并后的视频**
   ```
   错误: 未找到 merge-video 输出的视频文件
   解决: 检查 merge-video 命令是否成功执行
   ```

4. **未找到最终视频**
   ```
   错误: 未找到 history-person 输出的最终视频
   解决: 检查 history-person 命令是否成功执行
   ```

## 扩展性

该命令设计时考虑了良好的扩展性，可以轻松集成其他子命令：

### 添加新的处理步骤

在 `lib/merge-options.mjs` 中的 `runMergeOptions` 函数中添加新步骤：

```javascript
// 步骤 6: 添加新的处理步骤
currentStep++;
showProgress(currentStep, totalSteps, "执行新的处理步骤");

await executeCommand("new-command", "执行新命令");
```

### 自定义配置更新逻辑

修改 `updateConfigFile` 函数的调用，添加自定义的配置更新逻辑：

```javascript
await updateConfigFile(configPath, (content) => {
  // 自定义配置更新逻辑
  const regex = /("new-config":\s*\{[\s\S]*?field:\s*")[^"]*(")/;
  content = content.replace(regex, `$1${newValue}$2`);
  return content;
});
```

## 注意事项

1. **配置文件备份**: 命令会自动修改 `config.mjs`，建议在运行前备份
2. **文件覆盖**: 如果 `outputUtils/{name}.mp4` 已存在，会被自动覆盖
3. **中间文件**: 中间生成的文件会保留在各自的输出目录中
4. **执行时间**: 整个流程可能需要较长时间，取决于视频大小和数量
5. **高质量模式**: 默认启用，需要更多 GPU 内存和处理时间
   - 如遇到内存不足或处理过慢，可设置 `highQuality: false`
   - 高质量模式会显著提升画质，但处理时间可能增加 2-3 倍
   - 建议在有独立显卡的机器上使用高质量模式

## 示例

### 完整示例

```bash
# 1. 准备 processed_data.json
cat output/20251128-亚历山大二世/processed_data.json
{
  "name": "20251128-亚历山大二世",
  "urls": ["https://...", "https://..."],
  "title": "亚历山大二世的一生"
}

# 2. 配置 config.mjs
# "merge-options": {
#   name: "20251128-亚历山大二世"
# }

# 3. 运行命令
npx node-ffmpeg-tools merge-options

# 4. 查看输出
ls outputUtils/20251128-亚历山大二世.mp4
```

## 相关命令

- `merge-video` - 合并多个视频
- `history-person` - 生成历史人物视频
- `get-promot-image-by-video` - 提取视频帧并生成提示词

## 技术细节

### 文件查找逻辑

- **merge-video 输出**: 查找 `output/merge-video/merged_*.mp4`，选择最新的文件
- **history-person 输出**: 查找 `output/history-person/*_processed.mp4`，选择最新的文件

### 配置更新策略

使用正则表达式匹配和替换配置内容，保持其他配置不变。

### 进度计算

总共 5 个步骤，每完成一个步骤更新进度条。
