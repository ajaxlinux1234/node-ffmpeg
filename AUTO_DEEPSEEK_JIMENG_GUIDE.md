# Auto DeepSeek Jimeng 使用指南

## 功能概述

`auto-deepseek-jimeng` 是一个自动化工具，使用无头浏览器与 DeepSeek AI 进行对话，自动生成视频制作的提示词。

## 主要功能

1. **自动登录**: 如果检测到未登录状态，自动使用配置的账号密码登录 DeepSeek
2. **智能对话**: 根据配置的模板自动发送消息给 DeepSeek
3. **结果提取**: 自动提取 DeepSeek 的回复内容
4. **内容解析**: 智能解析提取的内容，分离标题、镜头描述和提示词
5. **文件保存**: 将结果保存为多种格式便于后续使用

## 配置说明

在 `config.mjs` 中添加 `auto-deepseek-jimeng` 配置：

```javascript
"auto-deepseek-jimeng": {
  deepseek: {
    // DeepSeek 网站 URL
    url: "https://chat.deepseek.com/",
    
    // 登录相关选择器（如果需要登录）
    login_selector: {
      username: `input[placeholder="请输入手机号/邮箱地址"]`,
      password: `input[placeholder="请输入密码"]`,
      login_button: `div[role="button"]`,
    },
    
    // 登录凭据
    login_data: {
      username: "your_username",
      password: "your_password",
    },
    
    // 聊天界面选择器
    chat_selector: `textarea[placeholder="给 DeepSeek 发送消息 "]`,
    send_chat_selector: `'input[type="file"] + div'`,
    
    // 消息模板
    send_msg_template: `{{name}}, 从出生到现在{{timeNum}}个关键时间点, 要特别注意人物服饰要符合历史事实,{{timeNum}}段视频生成提示词, 以及各个镜头画面之间的转换方式或运动方式, 视频镜头要是电影写实风格,比例9:16, 各段视频描述要与袁隆平的长相类似, 各段视频描述要写上人物年龄, 视频提示词不要显示国徽, 人民大会堂等政治信息, 严格生成{{timeNum}}段视频生成提示词`,
    
    // 模板数据
    send_msg_template_data: {
      name: "袁隆平",
      timeNum: 18,
    },
    
    // 等待回复时间（秒）
    get_deepseek_result_time: 60,
    
    // 结果提取函数
    deepseek_result_txt_fn: () => {
      return [...document.querySelectorAll('div[class="ds-markdown"] p')]
        .map((one) => one.innerText)
        .filter((_, index) => index !== 0 && index !== 19);
    },
  },
},
```

## 使用方法

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 config.mjs

根据上面的配置说明，在 `config.mjs` 中添加完整的 `auto-deepseek-jimeng` 配置。

### 3. 运行命令

```bash
node bin/cli.mjs auto-deepseek-jimeng
```

## 输出结果

执行完成后，会在 `output/{name}/` 目录下生成以下文件：

### 1. `raw_results.json`
原始的 DeepSeek 回复内容数组

### 2. `processed_data.json`
处理后的结构化数据，包含：
```json
{
  "segments": [
    {
      "index": 1,
      "title": "提取的标题",
      "shot": "镜头描述",
      "prompt": "视频生成提示词",
      "originalText": "原始文本"
    }
  ],
  "rawResults": ["原始回复数组"]
}
```

### 3. `segments.txt`
便于阅读的文本格式，包含所有段落的详细信息

## 配置项详解

### 必需配置

- `url`: DeepSeek 网站地址
- `chat_selector`: 聊天输入框的 CSS 选择器
- `send_msg_template`: 发送给 DeepSeek 的消息模板
- `send_msg_template_data`: 模板变量的实际值

### 可选配置

- `login_selector`: 登录相关的选择器（如果需要自动登录）
- `login_data`: 登录凭据
- `send_chat_selector`: 发送按钮选择器
- `get_deepseek_result_time`: 等待回复的时间（默认60秒）
- `deepseek_result_txt_fn`: 自定义结果提取函数

## 智能特性

### 1. 自动登录检测
- 自动检测是否需要登录
- 如果需要登录，使用配置的凭据自动登录
- 登录成功后继续执行对话流程

### 2. 智能发送按钮检测
如果配置的发送按钮选择器不工作，会自动尝试以下常见选择器：
- `button[type="submit"]`
- `[data-testid="send-button"]`
- `button:has-text("发送")`
- `button:has-text("Send")`
- `.send-button`
- `[aria-label*="发送"]`
- `[aria-label*="Send"]`

### 3. 智能结果提取
如果配置的结果提取函数失败，会自动尝试通用的选择器：
- `div[class*="markdown"] p`
- `.message-content p`
- `.response-content p`
- `.chat-message p`
- `[data-testid*="message"] p`
- `.prose p`

### 4. 内容智能解析
自动从 DeepSeek 回复中提取：
- **标题**: 使用多种模式匹配标题信息
- **镜头描述**: 识别镜头、画面、场景等关键词
- **提示词**: 提取完整的视频生成提示词

## 故障排除

### 1. 登录失败
- 检查用户名密码是否正确
- 检查登录选择器是否匹配当前页面结构
- 可能需要手动处理验证码

### 2. 消息发送失败
- 检查聊天输入框选择器是否正确
- 检查发送按钮选择器是否正确
- 网络延迟可能需要增加等待时间

### 3. 结果提取失败
- 检查结果提取函数是否正确
- DeepSeek 页面结构可能发生变化
- 可以尝试修改通用选择器

### 4. 内容解析不准确
- DeepSeek 回复格式可能与预期不同
- 可以查看 `raw_results.json` 了解原始内容
- 根据实际格式调整解析逻辑

## 注意事项

1. **浏览器兼容性**: 使用 Puppeteer 控制 Chromium 浏览器
2. **网络稳定性**: 确保网络连接稳定，避免超时
3. **页面变化**: DeepSeek 网站结构可能更新，需要相应调整选择器
4. **账号安全**: 请妥善保管登录凭据，建议使用环境变量
5. **使用频率**: 避免过于频繁的自动化请求，遵守网站使用条款

## 示例输出

执行成功后的控制台输出：
```
🚀 启动 auto-deepseek-jimeng 功能...
📖 正在打开 DeepSeek 网站...
🔍 检查登录状态...
✅ 已登录，跳过登录流程
⏳ 等待聊天界面加载...
📝 准备发送消息: 袁隆平, 从出生到现在18个关键时间点...
📤 消息已发送
⏱️ 等待 60 秒获取 DeepSeek 回复...
📥 正在提取 DeepSeek 回复内容...
✅ 使用选择器 "div[class*="markdown"] p" 成功提取到 18 条结果
📊 处理完成，共 18 段内容
📄 文件已保存:
   - output/袁隆平/raw_results.json
   - output/袁隆平/processed_data.json
   - output/袁隆平/segments.txt
✅ auto-deepseek-jimeng 执行完成！
📁 结果已保存到: output/袁隆平/
```
