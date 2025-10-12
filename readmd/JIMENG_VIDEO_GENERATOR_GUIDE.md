# 即梦视频生成器使用指南

## 概述
即梦视频生成器是一个自动化工具，可以批量上传图片到即梦平台并生成视频。支持智能多帧模式，可选择是否添加运镜描述。

## 功能特性

### 🎯 主要功能
1. **批量图片上传**: 自动上传多张图片到即梦平台
2. **智能多帧模式**: 自动切换到智能多帧模式
3. **运镜描述控制**: 通过 `useShot` 参数控制是否添加运镜描述
4. **分批处理**: 支持分批上传大量图片
5. **多账号支持**: 支持使用不同的即梦账号

### 🔧 useShot 参数说明
- **`useShot: true`** (默认): 会自动填入运镜描述，使用 processed_data.json 中的 shot 字段
- **`useShot: false`**: 跳过运镜描述输入，只上传图片不填运镜词

## 配置文件说明

### 基础配置
```javascript
export default {
  "jimeng-video-generator": {
    name: "钱学森", // 项目名称，用于查找 processed_data.json 文件
    accountId: 2, // 使用的即梦账号ID
    generate_section: 1, // 当前处理的批次（第几批）
    generate_section_num: 9, // 每批上传的图片数量
    useShot: false, // 是否使用运镜描述，false表示不填运镜词
    url: "https://jimeng.jianying.com/ai-tool/home?type=video",
    
    // 页面元素选择器配置
    video_generate_select_trigger_selector: ".lv-typography",
    video_generate_select_trigger_text: "首尾帧",
    video_generate_select_item_text: "智能多帧",
    video_generate_select_item_selector: ".lv-typography",
    video_generate_upload_text: "第1帧",
    video_generate_shot_text_btn_selector: 'input[type="file"]',
    video_generate_shot_input_selector: ".lv-popover-inner-content textarea",
    video_generate_shot_input_confirm_text: "确认",
    video_generate_shot_input_confirm_select: ".lv-popover-inner-content .lv-btn-shape-square",
    video_generate_shot_selector: ".lv-typography",
  },
};
```

## 使用方法

### 1. 准备工作
确保已经运行过 `auto-deepseek-jimeng` 命令，生成了包含图片和数据的输出目录：
```
output/
└── 钱学森/
    ├── processed_data.json    # DeepSeek 处理数据
    ├── raw_results.json       # DeepSeek 原始数据
    ├── segments.txt           # 文本格式数据
    └── images/                # 即梦生成的图片
        ├── image_1.jpg
        ├── image_2.jpg
        └── ...
```

### 2. 运行命令
```bash
# 使用配置文件中的设置
npx node-ffmpeg-tools jimeng-video-generator

# 或者使用 node 直接运行
node bin/cli.mjs jimeng-video-generator
```

### 3. 使用场景

#### 场景1: 只上传图片，不填运镜描述
```javascript
// jimeng-video-config.mjs
export default {
  "jimeng-video-generator": {
    name: "钱学森",
    useShot: false, // 设置为 false
    // ... 其他配置
  },
};
```

#### 场景2: 上传图片并自动填入运镜描述
```javascript
// jimeng-video-config.mjs
export default {
  "jimeng-video-generator": {
    name: "钱学森",
    useShot: true, // 设置为 true 或省略（默认值）
    // ... 其他配置
  },
};
```

### 4. 分批处理示例
如果有很多图片需要分批上传：

```javascript
// 第一批：上传前9张图片
{
  generate_section: 1,
  generate_section_num: 9,
  useShot: false, // 第一批不填运镜描述
}

// 第二批：上传第10-18张图片
{
  generate_section: 2,
  generate_section_num: 9,
  useShot: true, // 第二批填入运镜描述
}
```

## 工作流程

### 自动化流程
1. **检查数据**: 验证 processed_data.json 文件是否存在
2. **启动浏览器**: 使用指定账号的用户数据目录
3. **打开即梦**: 自动导航到即梦视频生成页面
4. **登录检查**: 检查登录状态，如需要则等待手动登录
5. **设置比例**: 自动设置视频比例为 9:16
6. **切换模式**: 从"首尾帧"切换到"智能多帧"模式
7. **上传图片**: 批量上传指定数量的图片
8. **运镜描述**: 根据 `useShot` 参数决定是否填入运镜描述
9. **等待操作**: 等待用户手动点击生成按钮

### useShot 控制逻辑
```javascript
if (useShot) {
  console.log("📝 开始输入运镜描述...");
  // 执行运镜描述输入流程
  // 1. 点击运镜按钮
  // 2. 输入运镜描述
  // 3. 点击确认
} else {
  console.log("⚠️ useShot 为 false，跳过运镜描述输入");
  // 直接跳过运镜描述输入
}
```

## 注意事项

### 🚨 重要提醒
1. **首次使用**: 需要手动登录即梦账号
2. **图片准备**: 确保 images 目录中有足够的图片文件
3. **数据文件**: 必须先运行 `auto-deepseek-jimeng` 生成数据
4. **浏览器状态**: 程序会保存浏览器登录状态，下次使用时自动复用

### 💡 使用技巧
1. **测试模式**: 首次使用建议设置较小的 `generate_section_num`
2. **分批处理**: 大量图片建议分批处理，避免超时
3. **运镜控制**: 根据需要灵活设置 `useShot` 参数
4. **账号管理**: 不同项目可以使用不同的 `accountId`

## 错误处理

### 常见问题
1. **找不到 processed_data.json**: 先运行 `auto-deepseek-jimeng` 命令
2. **登录失败**: 手动登录后重试
3. **图片上传失败**: 检查网络连接和图片文件
4. **元素选择器失效**: 更新配置文件中的选择器

### 调试模式
程序会输出详细的日志信息，包括：
- 文件检查状态
- 浏览器操作步骤
- 元素查找结果
- 上传进度
- 运镜描述处理状态

## 更新日志

### v1.0.0
- ✅ 实现基础的图片批量上传功能
- ✅ 添加智能多帧模式支持
- ✅ 实现运镜描述自动填入
- ✅ 新增 `useShot` 参数控制运镜描述
- ✅ 支持分批处理大量图片
- ✅ 添加多账号支持
- ✅ 实现浏览器状态持久化

这个工具大大简化了即梦视频生成的工作流程，特别是 `useShot` 参数让用户可以灵活控制是否添加运镜描述，满足不同的使用需求。
