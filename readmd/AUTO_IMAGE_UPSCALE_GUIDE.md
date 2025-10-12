# 自动图片放大功能使用指南

## 🎯 功能概述

在即梦视频生成之前，系统会自动检测图片尺寸，如果图片过小，将使用AI无损放大技术将其放大到适合视频生成的分辨率。

## 🔧 技术特点

### 智能检测
- **自动判断**: 检测图片是否小于目标分辨率
- **批量处理**: 一次性处理整个目录的所有图片
- **格式支持**: 支持 JPG、PNG、WebP、BMP、TIFF 等格式

### 无损放大技术
1. **Real-ESRGAN**: 最佳质量的AI放大（优先使用）
2. **waifu2x**: 备用AI放大方案
3. **Sharp传统放大**: 兜底方案，确保放大成功

### 安全保障
- **原图备份**: 自动备份原始图片为 `*_original.*`
- **智能替换**: 只有放大成功才替换原图
- **错误容错**: 单张图片失败不影响整体流程

## ⚙️ 配置说明

### 启用/禁用功能
在 `lib/auto-deepseek-jimeng/jimeng-video-config.mjs` 中：

```javascript
export default {
  "jimeng-video-generator": {
    // ... 其他配置
    
    // 🖼️ 图片自动放大配置
    autoUpscale: true, // 是否启用自动图片放大
    upscaleConfig: {
      targetResolution: { width: 1920, height: 1080 }, // 目标分辨率
      replaceOriginal: true, // 是否替换原图
      backupOriginal: true, // 是否备份原图
      outputSuffix: "_upscaled" // 放大文件后缀
    },
    
    // ... 其他配置
  }
}
```

### 配置参数详解

#### `autoUpscale`
- **类型**: Boolean
- **默认值**: `true`
- **说明**: 是否启用自动图片放大功能

#### `upscaleConfig.targetResolution`
- **类型**: Object `{ width: number, height: number }`
- **默认值**: `{ width: 1920, height: 1080 }`
- **说明**: 目标分辨率，小于此分辨率的图片将被放大

#### `upscaleConfig.replaceOriginal`
- **类型**: Boolean
- **默认值**: `true`
- **说明**: 是否用放大后的图片替换原图

#### `upscaleConfig.backupOriginal`
- **类型**: Boolean
- **默认值**: `true`
- **说明**: 是否备份原始图片

#### `upscaleConfig.outputSuffix`
- **类型**: String
- **默认值**: `"_upscaled"`
- **说明**: 放大图片的文件名后缀

## 🚀 使用流程

### 自动执行流程
1. **检测启动**: 运行 `npx node-ffmpeg-tools auto-deepseek-jimeng`
2. **图片扫描**: 系统自动扫描 `output/{name}/images/` 目录
3. **尺寸检测**: 检查每张图片的分辨率
4. **智能放大**: 对小于目标分辨率的图片进行AI放大
5. **文件管理**: 备份原图，替换为放大后的图片
6. **继续流程**: 使用放大后的图片进行视频生成

### 日志输出示例
```
🔍 检测图片尺寸，如需要将进行无损放大...
📁 开始批量处理目录: output/尾崎秀实/images
🔍 找到 13 个图片文件

📸 处理第 1/13 张图片: image_1.jpg
🖼️ 开始处理图片: image_1.jpg
📏 图片分辨率: 512x512
📈 计算放大倍数: 3.75x
🎯 尝试Real-ESRGAN放大...
✅ Real-ESRGAN放大成功
💾 已备份原图: image_1_original.jpg
✅ 图片放大完成: image_1.jpg (512x512 → 1920x1920)

📸 处理第 2/13 张图片: image_2.jpg
🖼️ 开始处理图片: image_2.jpg
📏 图片分辨率: 1920x1080
✅ image_2.jpg 分辨率已足够，跳过放大

...

✅ 成功放大 8 张图片
⏭️ 跳过 5 张图片（尺寸已足够）
📁 更新后找到 13 张图片
```

## 📁 文件结构

### 处理前
```
output/
└── 尾崎秀实/
    └── images/
        ├── image_1.jpg (512x512)
        ├── image_2.jpg (1920x1080)
        └── image_3.jpg (768x768)
```

### 处理后
```
output/
└── 尾崎秀实/
    └── images/
        ├── image_1.jpg (1920x1920) ← 已放大
        ├── image_1_original.jpg (512x512) ← 原图备份
        ├── image_2.jpg (1920x1080) ← 未改变
        ├── image_3.jpg (1920x1920) ← 已放大
        └── image_3_original.jpg (768x768) ← 原图备份
```

## 🎯 适用场景

### 推荐使用
- ✅ **AI生成图片**: 通常分辨率较低，需要放大
- ✅ **历史照片**: 老照片分辨率不足
- ✅ **网络图片**: 下载的图片可能分辨率不够
- ✅ **视频制作**: 需要高分辨率图片制作高质量视频

### 可选禁用
- ❌ **已有高分辨率图片**: 图片已经是高分辨率，无需放大
- ❌ **处理时间敏感**: 放大处理需要时间，急需快速生成视频
- ❌ **存储空间有限**: 放大后的图片会占用更多空间

## 🔧 高级配置

### 自定义目标分辨率
```javascript
upscaleConfig: {
  targetResolution: { width: 3840, height: 2160 }, // 4K分辨率
  // ... 其他配置
}
```

### 禁用原图备份（节省空间）
```javascript
upscaleConfig: {
  backupOriginal: false, // 不备份原图
  // ... 其他配置
}
```

### 不替换原图（保留两个版本）
```javascript
upscaleConfig: {
  replaceOriginal: false, // 不替换原图
  outputSuffix: "_4k", // 放大图片后缀
  // ... 其他配置
}
```

## 🚨 注意事项

### 性能影响
- **处理时间**: AI放大需要时间，图片越多耗时越长
- **系统资源**: 放大过程会占用CPU/GPU资源
- **存储空间**: 放大后的图片文件更大

### 质量说明
- **AI放大**: Real-ESRGAN和waifu2x提供最佳质量
- **传统放大**: Sharp作为兜底方案，质量一般
- **原图质量**: 原图质量越好，放大效果越佳

### 兼容性
- **格式支持**: 主流图片格式都支持
- **系统要求**: 需要安装相应的AI放大工具
- **错误处理**: 单张失败不影响整体流程

## 📞 故障排除

### 常见问题

**Q: 放大失败怎么办？**
A: 系统有三重保障，Real-ESRGAN → waifu2x → Sharp，确保至少有一种方法成功。

**Q: 可以恢复原图吗？**
A: 如果启用了 `backupOriginal`，原图会保存为 `*_original.*` 格式。

**Q: 放大很慢怎么办？**
A: 可以设置 `autoUpscale: false` 禁用自动放大，或减少图片数量。

**Q: 存储空间不够怎么办？**
A: 设置 `backupOriginal: false` 不备份原图，节省空间。

---

这个功能让你的视频制作流程更加智能化，确保所有图片都有足够的分辨率来制作高质量的视频！
