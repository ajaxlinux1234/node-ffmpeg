# 视频去重方法大全

## 📋 完整去重手段列表

本工具提供 **14种** 不同的视频去重技术，可以单独使用或组合使用，实现最大程度的视频去重效果。

---

## 🎯 基础去重功能（推荐日常使用）

### 1. 随机噪点 ✨
**功能**: 为视频添加随机噪点效果

**配置**:
```javascript
sweepLight: {
  enabled: true,
  opacity: 0.15  // 噪点强度 0.05-0.3
}
```

**效果**:
- 每次运行生成不同的噪点模式
- 改变视频的像素级特征
- 不明显影响观看体验
- 去重效果: ⭐⭐⭐

---

### 2. MD5修改 🔐
**功能**: 修改视频文件MD5值

**配置**:
```javascript
modifyMD5: true
```

**效果**:
- 在文件末尾添加随机字节
- 完全改变文件哈希值
- 不影响视频播放
- 去重效果: ⭐⭐⭐⭐⭐

---

### 3. 黑边框 📐
**功能**: 添加上下或左右黑边框

**配置**:
```javascript
letterbox: {
  enabled: true,
  top: 40,      // 上边框高度
  bottom: 40,   // 下边框高度
  left: 0,      // 左边框宽度
  right: 0      // 右边框宽度
}
```

**效果**:
- 改变视频分辨率
- 改变画面构图
- 明显的视觉变化
- 去重效果: ⭐⭐⭐⭐

---

### 4. 锐化 🔪
**功能**: 适当锐化视频画面

**配置**:
```javascript
sharpen: {
  enabled: true,
  strength: 'medium'  // light, medium, strong
}
```

**效果**:
- 提升视频清晰度
- 改变边缘特征
- 轻微改善画质
- 去重效果: ⭐⭐

---

### 5. 降噪 🔇
**功能**: 对视频进行降噪处理

**配置**:
```javascript
denoise: {
  enabled: true,
  strength: 'light'  // light, medium, strong
}
```

**效果**:
- 减少视频噪点
- 改善视频质量
- 改变纹理特征
- 去重效果: ⭐⭐

---

### 6. 变速处理 ⚡
**功能**: 加快或减慢视频播放速度

**配置**:
```javascript
speedChange: {
  enabled: true,
  speed: 1.05  // 1.0-1.2倍速
}
```

**效果**:
- 改变视频时长
- 同时调整音频速度
- 改变时间特征
- 去重效果: ⭐⭐⭐⭐

---

## 🚀 高级去重功能（最大化去重效果）

### 7. 色彩调整 🎨
**功能**: 随机微调色调、饱和度、亮度、对比度

**配置**:
```javascript
colorAdjust: {
  enabled: true,
  hue: 0,          // 色调偏移，0为随机
  saturation: 1.0, // 饱和度，1.0为随机
  brightness: 0,   // 亮度，0为随机
  contrast: 1.0    // 对比度，1.0为随机
}
```

**效果**:
- 每次运行生成不同色彩
- 改变视频色彩指纹
- 不明显改变视觉效果
- 去重效果: ⭐⭐⭐⭐

---

### 8. 镜像翻转 🔄
**功能**: 水平或垂直翻转视频

**配置**:
```javascript
flip: {
  enabled: true,
  horizontal: true,  // 水平翻转
  vertical: false    // 垂直翻转
}
```

**效果**:
- 完全改变视频方向
- 左右或上下镜像
- 明显的视觉变化
- 去重效果: ⭐⭐⭐⭐⭐

**注意**: 翻转会改变文字和标识的方向

---

### 9. 缩放 📏
**功能**: 微调视频尺寸

**配置**:
```javascript
scale: {
  enabled: true,
  scale: 1.0  // 0.95-1.05，1.0为随机
}
```

**效果**:
- 改变视频分辨率
- 随机缩放比例
- 几乎不影响观看
- 去重效果: ⭐⭐⭐

---

### 10. 旋转 🔃
**功能**: 微调视频角度

**配置**:
```javascript
rotate: {
  enabled: true,
  angle: 0  // -5到5度，0为随机
}
```

**效果**:
- 改变画面方向
- 轻微旋转不易察觉
- 改变几何特征
- 去重效果: ⭐⭐⭐

---

### 11. 帧率调整 🎞️
**功能**: 改变视频帧率

**配置**:
```javascript
fpsAdjust: {
  enabled: true,
  fps: 25  // 目标帧率（如24, 25, 30）
}
```

**效果**:
- 改变播放流畅度
- 改变时间特征
- 可能影响观看体验
- 去重效果: ⭐⭐⭐⭐

---

### 12. 模糊 💫
**功能**: 轻微模糊效果

**配置**:
```javascript
blur: {
  enabled: true,
  strength: 'light'  // light, medium, strong
}
```

**效果**:
- 改变画面清晰度
- 柔化边缘特征
- 建议使用light强度
- 去重效果: ⭐⭐

**注意**: 过度模糊会影响观看体验

---

### 13. 色彩曲线 📈
**功能**: 应用色彩曲线预设

**配置**:
```javascript
curves: {
  enabled: true,
  preset: 'vintage'  // vintage, darker, lighter
}
```

**效果**:
- 改变整体色调风格
- 复古、变暗或变亮效果
- 明显改变视觉效果
- 去重效果: ⭐⭐⭐⭐

---

### 14. 微调亮度 ⏰
**功能**: 添加极轻微的随机亮度调整

**配置**:
```javascript
timestamp: {
  enabled: true,
  position: 'bottom-right',  // 保留参数（兼容性）
  format: 'invisible'        // 不可见模式
}
```

**效果**:
- 每次运行生成不同的随机亮度值
- 人眼无法察觉的微调（0.001-0.002）
- 改变视频的数字指纹
- 去重效果: ⭐⭐⭐

**注意**: 此功能使用极轻微的亮度调整替代时间戳，避免FFmpeg编译依赖问题

---

## 🎯 推荐配置方案

### 方案1: 轻度去重（保持原视频质量）
```javascript
{
  sweepLight: { enabled: true, opacity: 0.1 },
  modifyMD5: true,
  letterbox: { enabled: false },
  sharpen: { enabled: false },
  denoise: { enabled: false },
  speedChange: { enabled: false },
  // 其他高级功能全部禁用
}
```
**去重效果**: ⭐⭐⭐  
**视觉影响**: 几乎无  
**适用场景**: 高质量视频，轻微去重

---

### 方案2: 标准去重（平衡效果和质量）
```javascript
{
  sweepLight: { enabled: true, opacity: 0.15 },
  modifyMD5: true,
  letterbox: { enabled: true, top: 40, bottom: 40 },
  sharpen: { enabled: true, strength: 'light' },
  denoise: { enabled: true, strength: 'light' },
  speedChange: { enabled: true, speed: 1.03 },
  colorAdjust: { enabled: true },
  // 其他高级功能禁用
}
```
**去重效果**: ⭐⭐⭐⭐  
**视觉影响**: 轻微  
**适用场景**: 日常批量处理

---

### 方案3: 强度去重（最大化去重效果）
```javascript
{
  sweepLight: { enabled: true, opacity: 0.2 },
  modifyMD5: true,
  letterbox: { enabled: true, top: 60, bottom: 60 },
  sharpen: { enabled: true, strength: 'medium' },
  denoise: { enabled: true, strength: 'medium' },
  speedChange: { enabled: true, speed: 1.08 },
  colorAdjust: { enabled: true },
  scale: { enabled: true, scale: 0.98 },
  rotate: { enabled: true, angle: 1 },
  blur: { enabled: true, strength: 'light' },
  curves: { enabled: true, preset: 'vintage' },
  timestamp: { enabled: true, format: 'invisible' },
}
```
**去重效果**: ⭐⭐⭐⭐⭐  
**视觉影响**: 中等  
**适用场景**: 需要最大化去重

---

### 方案4: 极限去重（包含翻转）
```javascript
{
  // 包含方案3的所有配置，额外添加：
  flip: { enabled: true, horizontal: true },
  fpsAdjust: { enabled: true, fps: 25 },
}
```
**去重效果**: ⭐⭐⭐⭐⭐+  
**视觉影响**: 明显（翻转会改变方向）  
**适用场景**: 极端情况，可接受视觉变化

---

## 📊 去重效果对比

| 方案 | 启用功能数 | 去重效果 | 视觉影响 | 处理时间 | 文件大小变化 |
|------|-----------|---------|---------|---------|-------------|
| 轻度 | 2个 | ⭐⭐⭐ | 几乎无 | 快 | +5% |
| 标准 | 6个 | ⭐⭐⭐⭐ | 轻微 | 中等 | +15% |
| 强度 | 11个 | ⭐⭐⭐⭐⭐ | 中等 | 较慢 | +25% |
| 极限 | 13个 | ⭐⭐⭐⭐⭐+ | 明显 | 慢 | +30% |

---

## 💡 使用建议

### 1. 根据需求选择
- **日常使用**: 标准去重方案
- **重要视频**: 强度去重方案
- **极端情况**: 极限去重方案

### 2. 注意事项
- 翻转会改变文字和标识方向
- 过度模糊影响观看体验
- 帧率调整可能影响流畅度
- 多功能叠加会增加处理时间

### 3. 测试建议
- 先用标准方案测试
- 根据效果调整配置
- 观察视觉影响
- 平衡去重效果和质量

---

## 🔧 技术实现

所有去重功能基于FFmpeg滤镜实现：

| 功能 | FFmpeg滤镜 |
|------|-----------|
| 噪点 | noise |
| 黑边框 | pad |
| 锐化 | unsharp |
| 降噪 | hqdn3d |
| 变速 | setpts + atempo |
| 色彩调整 | hue + eq |
| 翻转 | hflip / vflip |
| 缩放 | scale |
| 旋转 | rotate |
| 帧率 | fps |
| 模糊 | gblur |
| 曲线 | curves |
| 时间戳 | drawtext |

---

**提示**: 所有功能都可以在 `config.mjs` 中配置，支持单独启用或组合使用。
