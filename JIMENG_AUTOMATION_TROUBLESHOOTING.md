# 即梦自动化故障排除指南

## 🔍 常见问题诊断

### 1. Cookie、LocalStorage和SessionStorage设置问题

#### 问题现象
- 刷新页面后仍然显示登录按钮
- Cookie设置成功但登录状态无效
- LocalStorage和SessionStorage项目数量正确但登录失败

#### 可能原因
1. **Cookie域名不匹配**: 配置的Cookie可能来自不同的子域名
2. **Cookie过期**: 提供的Cookie可能已经过期
3. **缺少关键Cookie**: 某些关键的认证Cookie可能缺失
4. **安全策略**: 浏览器安全策略阻止跨域Cookie设置

#### 解决方案

##### 方案1: 检查Cookie来源域名
确保Cookie来自正确的域名：
```javascript
// 在浏览器开发者工具中检查Cookie
document.cookie.split(';').forEach(cookie => {
  console.log(cookie.trim());
});

// 检查当前域名
console.log('当前域名:', window.location.hostname);
```

##### 方案2: 更新Cookie和Storage获取方法
1. 打开即梦网站并手动登录
2. 按F12打开开发者工具
3. 在Console中运行：
```javascript
// 获取所有Cookie
copy(document.cookie);

// 获取LocalStorage
copy(JSON.stringify(localStorage));

// 获取SessionStorage
copy(JSON.stringify(sessionStorage));
```

##### 方案3: 检查Cookie有效性
```javascript
// 检查特定的认证Cookie
const authCookies = ['uifid', 'passport_csrf_token', '_tea_web_id'];
authCookies.forEach(name => {
  const value = document.cookie.split(';').find(c => c.trim().startsWith(name + '='));
  console.log(name + ':', value ? '存在' : '缺失');
});
```

### 2. 页面元素选择器问题

#### 问题现象
- 无法找到生成按钮
- textarea输入框选择失败
- 发送按钮点击无效

#### 解决方案

##### 更新选择器配置
在config.mjs中尝试不同的选择器：

```javascript
jimeng: {
  // 生成按钮的备选选择器
  generate_button_selector: "#AIGeneratedRecord", // 主选择器
  generate_button_alternatives: [
    "[data-testid='generate-button']",
    ".generate-btn",
    "button[class*='generate']",
    "div[role='button']:contains('生成')"
  ],
  
  // 输入框的备选选择器
  img_generate_input_alternatives: [
    "textarea:last-child",
    "textarea[placeholder*='描述']",
    ".input-area textarea",
    "[contenteditable='true']"
  ],
  
  // 发送按钮的备选选择器
  img_generate_input_send_alternatives: [
    ".lv-btn-primary",
    "button[type='submit']",
    ".send-btn",
    "button:contains('发送')"
  ]
}
```

### 3. 网络和时序问题

#### 问题现象
- 页面加载不完整
- 元素还未出现就尝试操作
- 网络请求超时

#### 解决方案

##### 增加等待时间
```javascript
// 在关键步骤后增加等待
await page.waitForTimeout(3000); // 等待3秒

// 等待网络空闲
await page.goto(url, { waitUntil: "networkidle2" });

// 等待特定元素出现
await page.waitForSelector(selector, { timeout: 15000 });
```

##### 检查网络状态
```javascript
// 监听网络请求
page.on('response', response => {
  if (response.status() >= 400) {
    console.log('网络错误:', response.url(), response.status());
  }
});
```

### 4. 浏览器环境问题

#### 问题现象
- Chrome浏览器启动失败
- 页面渲染异常
- JavaScript执行错误

#### 解决方案

##### 更新浏览器启动参数
```javascript
const launchConfig = {
  headless: false,
  defaultViewport: null,
  args: [
    "--start-maximized",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-web-security",
    "--disable-features=VizDisplayCompositor",
    "--disable-blink-features=AutomationControlled", // 防止检测自动化
    "--no-sandbox", // 在某些环境下需要
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage" // 解决共享内存问题
  ],
};
```

## 🛠️ 调试技巧

### 1. 启用详细日志
修改代码添加更多调试信息：

```javascript
// 在关键步骤添加截图
await page.screenshot({ path: 'debug-step1.png', fullPage: true });

// 输出页面HTML结构
const html = await page.content();
console.log('页面HTML:', html.substring(0, 1000));

// 检查页面错误
page.on('pageerror', error => {
  console.log('页面错误:', error.message);
});
```

### 2. 手动验证步骤
1. 运行到出错的步骤前暂停
2. 手动在浏览器中执行相同操作
3. 检查页面状态和元素
4. 调整代码逻辑

### 3. 分步测试
将复杂流程拆分为小步骤：

```javascript
// 测试Cookie设置
async function testCookieSetup() {
  // 只测试Cookie设置部分
}

// 测试元素选择
async function testElementSelection() {
  // 只测试页面元素选择
}

// 测试文本输入
async function testTextInput() {
  // 只测试文本输入功能
}
```

## 🔧 配置优化建议

### 1. Cookie配置优化
```javascript
cookie_localstorage: {
  cookies: [
    // 确保包含这些关键Cookie
    "uifid=...", // 用户标识
    "passport_csrf_token=...", // CSRF令牌
    "_tea_web_id=...", // 会话ID
    "user_spaces_idc=...", // 用户空间配置
    // ... 其他Cookie
  ],
  localStorage: {
    // 确保包含登录状态相关的LocalStorage
    "__lvweb_user_status": "...",
    "LV_LOGIN_STATUS": "?success=true",
    // ... 其他LocalStorage项
  },
  sessionStorage: {
    // 确保包含会话相关的SessionStorage
    "__tea_session_id_2018": "...",
    "__tea_session_id_513695": "...",
    "device_id": "...",
    // ... 其他SessionStorage项
  }
}
```

### 2. 选择器配置优化
使用更稳定的选择器：

```javascript
// 优先使用ID选择器
generate_button_selector: "#AIGeneratedRecord",

// 备选使用属性选择器
img_generate_input_selector: "textarea[data-testid='prompt-input']",

// 最后使用类选择器
img_generate_input_send_selector: ".lv-btn-primary"
```

### 3. 时序配置优化
```javascript
// 增加关键步骤的等待时间
wait_times: {
  page_load: 5000,        // 页面加载等待时间
  element_appear: 10000,  // 元素出现等待时间
  input_delay: 100,       // 输入延迟
  send_interval: 2000     // 发送间隔
}
```

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. **错误日志**: 完整的控制台输出
2. **页面截图**: 出错时的页面状态
3. **配置信息**: 使用的Cookie和选择器配置
4. **环境信息**: 操作系统、Chrome版本等
5. **复现步骤**: 详细的操作步骤

通过这些信息可以更准确地诊断和解决问题。
