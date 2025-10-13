// 即梦配置文件
import { accountId, name } from "./jimeng-video-config.mjs";

export const jimengConfig = {
  accountId,
  persistLogin: true, // 是否启用登录状态持久化，默认为true
  name,
  downloadImg: true, // 不用发送问答，直接下载原图片
  url: "https://jimeng.jianying.com/ai-tool/home?type=image", // 打开即梦图片生成首页

  // 代理配置 - 如果IP被封，可以使用代理
  // proxy: "http://127.0.0.1:7890", // HTTP代理
  // proxy: "socks5://127.0.0.1:1080", // SOCKS5代理

  // 反检测配置（有头模式优化）
  antiDetection: {
    randomUserAgent: true, // 使用随机User-Agent
    hideWebdriver: true, // 隐藏webdriver标识
    simulateHuman: true, // 模拟人类行为
    requestDelay: [2000, 5000], // 请求间隔范围(毫秒) - 有头模式可以稍长
    retryOnFailure: 3, // 失败重试次数
    headlessMode: false, // 强制使用有头模式，无头模式容易被检测
    humanBehavior: {
      scrollBeforeAction: true, // 操作前先滚动
      randomMouseMove: true, // 随机鼠标移动
      naturalTyping: true, // 自然打字速度
      hoverDelay: [1500, 3000], // 悬停延迟范围
    },
  },

  // 下载模式配置
  downloadMode: {
    autoDownload: false, // 是否自动下载（false=暂停让用户手动下载）
    manualDownloadTimeout: 600, // 手动下载等待时间（10分钟）
    manualDownloadMessage:
      "✋ 请手动下载所有图片到 images 目录，完成后按 Enter 继续...", // 提示信息
  },
  login_selector: {
    login_button: `#SiderMenuLogin`,
    agree_policy: `div.zoomModal-enter-done .lv-btn-primary`,
  },
  useImgUrl: false, // 有头模式下推荐使用点击下载，更像真实用户行为

  // 图片无损放大配置
  imageUpscaling: {
    enabled: false, // 是否启用图片无损放大
    targetResolution: { width: 3840, height: 2160 }, // 目标分辨率 (4K)
    replaceOriginal: true, // 是否替换原图
    backupOriginal: true, // 是否备份原图
    minResolutionThreshold: 0.8, // 最小分辨率阈值（相对于目标分辨率）
    processingDelay: 1000, // 处理间隔时间（毫秒）
    preferredUpscaler: "realesrgan", // 首选放大工具: "realesrgan", "waifu2x", "sharp"
  },

  generate_button_selector: `#AIGeneratedRecord`, // 点击生成按钮
  aspect_ratio_trigger_selector: `div[role="combobox"] ~ button`, // 比例选择器触发按钮
  aspect_ratio_selector: `.lv-radio:last-of-type`, // 比例选择器
  img_generate_input_selector: () =>
    [...document.querySelectorAll("textarea")].pop(), // 选择页面最后一个textarea输入框
  reference_upload_column_selector: `.reference-upload-eclumn`, // 参考图片上传列
  reference_img_container:
    'div [style="--reference-count: 2; --reference-item-gap: 4px; --reference-item-offset: 3px;"]',
  reference_img_close:
    'div [style="--reference-count: 2; --reference-item-gap: 4px; --reference-item-offset: 3px;"] svg',
  img_generate_input_send_selector: `.lv-btn-primary`, // 发送按钮
  gernerate_img_result_selector: `div[style="--aspect-ratio: 0.5625;"]`, // 生成结果
  img_result_urls: () => {
    const allImgBox = Array.from(document.querySelectorAll("div[data-id]"));
    const urls = [];
    for (const i in allImgBox) {
      const one = allImgBox[i];
      const imgSrc = one.querySelector(
        'img[data-apm-action="ai-generated-image-record-card"]'
      ).src;
      if (imgSrc && imgSrc.startsWith("http")) {
        urls.unshift(imgSrc);
      }
    }
    return urls;
  },
};

export default jimengConfig;
