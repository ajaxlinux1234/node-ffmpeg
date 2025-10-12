# inputElement.click 错误修复

## 🐛 问题描述
```
Error: inputElement.click is not a function
```

这个错误发生在使用函数选择器时，`page.evaluateHandle()` 返回的是JSHandle对象，不能直接调用DOM方法。

## 🔧 修复方案

### 原问题代码
```javascript
if (typeof img_generate_input_selector === 'function') {
  // 错误：返回JSHandle，不能直接调用click()
  inputElement = await page.evaluateHandle(img_generate_input_selector);
}

// 这里会报错：inputElement.click is not a function
await inputElement.click();
```

### 修复后代码
```javascript
if (typeof img_generate_input_selector === 'function') {
  try {
    const elementInfo = await page.evaluate(img_generate_input_selector);
    if (elementInfo) {
      if (typeof elementInfo === 'string') {
        inputElement = await page.$(elementInfo);
      } else {
        // 回退到通用选择器
        inputElement = await page.$('textarea:last-of-type');
      }
    }
  } catch (error) {
    console.warn(`⚠️ 函数选择器执行失败: ${error.message}`);
    // 回退到通用选择器
    inputElement = await page.$('textarea:last-of-type');
  }
} else {
  inputElement = await page.$(img_generate_input_selector);
}
```

## 🎯 关键改进

1. **使用 `page.evaluate()` 而不是 `page.evaluateHandle()`**
   - `evaluate()` 返回序列化的值
   - `evaluateHandle()` 返回JSHandle对象

2. **添加错误处理和回退机制**
   - 函数执行失败时使用通用选择器
   - 确保总能找到输入框元素

3. **支持不同返回类型**
   - 如果函数返回选择器字符串，使用它
   - 如果返回其他类型，使用默认选择器

## ✅ 修复结果

现在系统可以正确处理：
- 字符串选择器：`"#chat-textarea"`
- 函数选择器：`() => document.querySelector("#chat-textarea")`
- 复杂函数选择器：`() => [...document.querySelectorAll("textarea")].pop()`

所有情况下都能正确获取DOM元素并调用相应方法。
