# 高质量模式详解

## 概述

高质量模式 (`highQuality: true`) 是 merge-options 的默认配置，旨在在 GPU 和内存允许的情况下最大化视频质量。

## 配置方式

在 `config.mjs` 中配置：

```javascript
"merge-options": {
  name: "项目名称",
  highQuality: true  // 默认值，可省略
}
```

## 质量优化参数对比

### NVIDIA GPU (NVENC)

| 参数 | 标准模式 | 高质量模式 |
|------|---------|-----------|
| 预设 | p4 | p7 (最慢，最高质量) |
| CQ 值 | 23 | 10-13 (接近无损) |
| 最大码率 | 8 Mbps | 30 Mbps |
| 缓冲区 | 16 MB | 60 MB |
| Lookahead | 未启用 | 32 帧 |
| B-frames | 默认 | 3 帧 + middle 参考 |
| AQ | 基础 | spatial + temporal |

### Intel QSV

| 参数 | 标准模式 | 高质量模式 |
|------|---------|-----------|
| 预设 | medium | veryslow |
| Quality | 23 | 10-13 |
| Lookahead | 未启用 | 40 帧深度 |

### AMD AMF

| 参数 | 标准模式 | 高质量模式 |
|------|---------|-----------|
| Quality | quality | quality |
| QP | 23 | 10-13 |
| Preanalysis | 未启用 | 启用 |

### CPU (libx264)

| 参数 | 标准模式 | 高质量模式 |
|------|---------|-----------|
| 预设 | medium | veryslow |
| CRF | 23 | 10-13 |
| Tune | 未设置 | film |
| Profile | 默认 | high |
| Level | 默认 | 4.2 |
| B-frames | 默认 | 3 |
| Reference frames | 默认 | 5 |
| Motion estimation | 默认 | umh (最精确) |
| Subpixel ME | 默认 | 10 (最高) |
| Trellis | 默认 | 2 (全局优化) |

## 音频质量

| 参数 | 标准模式 | 高质量模式 |
|------|---------|-----------|
| 编码器 | AAC | AAC |
| 比特率 | 192 kbps | 256 kbps |

## 色彩空间

高质量模式使用 BT.709 色彩空间标准：
- `colorspace bt709`
- `color_primaries bt709`
- `color_trc bt709`

这确保了更准确的色彩还原，特别适合高清视频。

## 性能影响

### 处理时间

- **NVENC (GPU)**: 高质量模式约慢 30-50%
- **QSV (GPU)**: 高质量模式约慢 40-60%
- **AMF (GPU)**: 高质量模式约慢 30-50%
- **CPU**: 高质量模式约慢 200-300%

### 内存使用

- **GPU 内存**: 增加约 50-100%
  - 标准模式: ~2-4 GB
  - 高质量模式: ~4-8 GB
- **系统内存**: 增加约 20-30%
  - 标准模式: ~2-3 GB
  - 高质量模式: ~3-4 GB

### 文件大小

高质量模式的文件大小通常会增加 20-40%，但画质显著提升。

## 适用场景

### 推荐使用高质量模式

✅ 最终发布的视频内容
✅ 需要高画质的专业作品
✅ 有独立显卡 (NVIDIA/AMD/Intel)
✅ 系统内存 ≥ 16GB
✅ 不急于快速处理

### 推荐使用标准模式

⚠️ 快速预览和测试
⚠️ 资源受限的环境
⚠️ 集成显卡或低端 GPU
⚠️ 系统内存 < 16GB
⚠️ 需要快速处理大量视频

## 质量对比示例

### CRF 值对比

```
CRF 10: 接近无损，文件很大
CRF 13: 极高质量，肉眼难以区分无损
CRF 18: 高质量 (高质量模式默认)
CRF 23: 良好质量 (标准模式默认)
CRF 28: 可接受质量
```

### 码率对比 (1080p 视频)

- **标准模式**: 4-8 Mbps
- **高质量模式**: 15-30 Mbps

## 故障排除

### GPU 内存不足

如果遇到 GPU 内存不足错误：

```javascript
"merge-options": {
  name: "项目名称",
  highQuality: false  // 切换到标准模式
}
```

### 处理速度太慢

如果处理时间过长：

1. 检查是否启用了 GPU 加速
2. 考虑使用标准模式
3. 升级硬件 (GPU/CPU)

### 质量不满意

如果标准模式质量不够：

1. 确保启用了高质量模式
2. 检查源视频质量
3. 考虑使用更低的 CRF 值 (需修改代码)

## 技术细节

### NVENC P7 预设

P7 是 NVENC 的最慢预设，提供最佳质量：
- 使用最复杂的运动估计算法
- 启用所有质量优化特性
- 接近 CPU 编码的质量

### Lookahead

Lookahead 允许编码器预先分析未来的帧：
- 更好的码率分配
- 更准确的场景检测
- 更优的 B-frame 放置

### Adaptive Quantization (AQ)

- **Spatial AQ**: 根据画面复杂度调整量化
- **Temporal AQ**: 根据时间变化调整量化
- 提升主观画质，特别是在复杂场景

### B-frames

B-frames (双向预测帧) 提高压缩效率：
- 参考前后帧进行预测
- 显著减小文件大小
- 轻微增加编码时间

## 最佳实践

1. **首次使用**: 先用标准模式测试流程
2. **正式制作**: 切换到高质量模式
3. **监控资源**: 观察 GPU/内存使用情况
4. **批量处理**: 考虑在夜间运行高质量模式
5. **备份设置**: 保存不同场景的配置文件

## 相关文档

- [MERGE_OPTIONS_GUIDE.md](./MERGE_OPTIONS_GUIDE.md) - merge-options 使用指南
- [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) - 性能优化指南
- [VIDEO_DEDUP_GUIDE.md](./VIDEO_DEDUP_GUIDE.md) - 视频去重指南
