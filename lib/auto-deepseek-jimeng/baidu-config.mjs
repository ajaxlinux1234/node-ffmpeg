// 百度配置文件
import { accountId, name } from "./jimeng-video-config.mjs";

export const baiduConfig = {
  accountId,
  persistLogin: true, // 是否启用登录状态持久化，默认为true
  name,
  downloadImg: true, // 启用图片下载功能
  useImgUrl: true, // 使用URL直接下载模式，跳过悬停点击操作
  url: "https://chat.baidu.com/search", // 打开百度AI生图页面

  // 登录相关选择器 - 手动登录模式，无需Cookie注入
  login_selector: {
    login_button: ".login-btn", // 登录按钮选择器
  },

  // 生成按钮选择器
  generate_button_selector: "#chat-input-extension span", // 点击生成按钮

  // 输入框选择器 - 使用函数格式以支持动态选择
  img_generate_input_selector: "#ai-input-editor", // 选择百度AI生图的输入框

  // 输入前缀文本 - 每个提示词前自动添加此文本，用于统一生图质量和格式
  inputPrefixText: "AI生图 超清画质 电影写实风格 比例9:16",
  inputSuffixText: "", // 每个提示词后自动添加此文本，用于统一生图质量和格式

  // 发送按钮选择器
  img_generate_input_send_selector: "#chat-submit-button-ai", // 发送按钮

  // 百度特有的生成结果选择器
  gernerate_img_result_selector: ".ai-entry-block", // 百度生成结果容器

  // 图片结果URL获取函数 - 批量获取所有生成的图片URL
  img_result_urls: () => {
    const imageBlocks = Array.from(
      document.querySelectorAll(".ai-entry-block")
    );
    const urls = [];

    imageBlocks.forEach((block) => {
      const img = block.querySelector("img");
      if (img && img.src && img.src.startsWith("http")) {
        urls.unshift(img.src);
      }
    });

    console.log(`🔗 百度AI生图获取到 ${urls.length} 个图片URL`);
    return urls;
  },

  // 百度特有的等待配置
  waitForGeneration: 30000, // 等待图片生成完成的时间（毫秒）
  scrollWaitTime: 3000, // 滚动等待时间（毫秒）

  // 百度特有的下载配置
  downloadRetryCount: 3, // 下载重试次数
  downloadTimeout: 30000, // 下载超时时间（毫秒）

  // 以下功能暂不需要，已注释
  // aspect_ratio_trigger_selector: `div[role="combobox"] ~ button`, // 比例选择器触发按钮
  // aspect_ratio_selector: `.lv-radio:last-of-type`, // 比例选择器
  // reference_upload_column_selector: `.reference-upload-eclumn`, // 参考图片上传列
  // reference_img_container: 'div [style="--reference-count: 2; --reference-item-gap: 4px; --reference-item-offset: 3px;"]',
  // reference_img_close: 'div [style="--reference-count: 2; --reference-item-gap: 4px; --reference-item-offset: 3px;"] svg',
  // gernerate_img_result_selectorFn: () => Array.from(document.querySelectorAll(".ai-entry-block")).map((one) => one.querySelector("img").src), // 生成结果
};

export default baiduConfig;
