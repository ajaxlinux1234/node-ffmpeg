# DeepSeek 登录状态持久化指南

## 🎯 功能概述

DeepSeek 自动化模块现在支持登录状态持久化，让你在首次登录后，后续使用时无需重复输入用户名和密码。

## 🔧 配置说明

### 1. 启用登录状态持久化

在 `config.mjs` 中的 `auto-deepseek-jimeng.deepseek` 配置中添加：

```javascript
deepseek: {
  url: "https://chat.deepseek.com/",
  persistLogin: true, // 启用登录状态持久化（默认为 true）
  // ... 其他配置
}
```

### 2. 配置选项

- `persistLogin: true` - 启用登录状态持久化（推荐）
- `persistLogin: false` - 禁用登录状态持久化，每次都需要重新登录

## 📁 数据存储位置

浏览器用户数据保存在项目根目录下的：
```
browser-data/deepseek-profile/
```

这个目录包含：
- 登录状态信息
- Cookie 数据
- 浏览器缓存
- 用户偏好设置

## 🚀 使用流程

### 首次使用
1. 运行 `node bin/cli.mjs auto-deepseek-jimeng`
2. 浏览器会自动打开并尝试登录
3. 如果需要登录，会自动输入配置的用户名密码
4. 登录成功后，浏览器数据会被保存

### 后续使用
1. 再次运行 `node bin/cli.mjs auto-deepseek-jimeng`
2. 浏览器会加载之前保存的登录状态
3. 如果登录状态有效，会直接进入聊天界面
4. 无需重新输入用户名密码

## 🧹 清理登录数据

如果需要重新登录（比如换账号或登录状态异常），可以使用：

```bash
node bin/cli.mjs clear-browser-data
```

这会删除所有保存的浏览器数据，下次运行时会重新登录。

## 🔍 故障排除

### 1. 登录状态失效
**现象**: 即使启用了持久化，仍然需要重新登录
**原因**: 
- DeepSeek 服务端登录状态过期
- 浏览器数据损坏
- 网络环境变化

**解决方案**:
```bash
# 清理浏览器数据并重新登录
node bin/cli.mjs clear-browser-data
node bin/cli.mjs auto-deepseek-jimeng
```

### 2. 浏览器数据目录权限问题
**现象**: 无法创建或访问 browser-data 目录
**解决方案**:
- 确保项目目录有写入权限
- 以管理员身份运行（Windows）
- 手动创建 browser-data 目录

### 3. 多账号切换
**现象**: 需要使用不同的 DeepSeek 账号
**解决方案**:
```bash
# 清理当前登录数据
node bin/cli.mjs clear-browser-data

# 修改 config.mjs 中的用户名密码
# 然后重新运行
node bin/cli.mjs auto-deepseek-jimeng
```

## ⚙️ 高级配置

### 禁用持久化登录
如果你不希望保存登录状态（比如在共享电脑上），可以设置：

```javascript
deepseek: {
  persistLogin: false, // 禁用登录状态持久化
  // ... 其他配置
}
```

### 自定义数据目录
如果需要自定义浏览器数据存储位置，可以修改 `auto-deepseek-jimeng.mjs` 中的：

```javascript
const userDataDir = path.join(process.cwd(), "browser-data", "deepseek-profile");
```

## 🔒 安全注意事项

1. **敏感数据**: 浏览器数据目录包含登录信息，请妥善保管
2. **共享环境**: 在共享电脑上建议禁用持久化登录
3. **定期清理**: 建议定期清理浏览器数据以保持安全性
4. **备份配置**: 用户名密码仍需在配置文件中保留，以备重新登录使用

## 📊 性能优势

- **节省时间**: 跳过重复的登录流程
- **提高效率**: 直接进入聊天界面
- **减少错误**: 避免登录相关的网络问题
- **用户体验**: 更流畅的自动化体验

## 🎯 最佳实践

1. **首次设置**: 确保用户名密码正确配置
2. **定期维护**: 每月清理一次浏览器数据
3. **监控日志**: 注意登录状态相关的日志信息
4. **备份配置**: 保持配置文件的备份

通过这个功能，你可以大大提升 DeepSeek 自动化的使用体验！
