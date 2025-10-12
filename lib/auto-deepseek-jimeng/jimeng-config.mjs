// 即梦配置文件
import { accountId, name } from "./jimeng-video-config.mjs";

export const jimengConfig = {
  accountId,
  persistLogin: true, // 是否启用登录状态持久化，默认为true
  name,
  downloadImg: false,
  url: "https://jimeng.jianying.com/ai-tool/home?type=image", // 打开即梦图片生成首页
  login_selector: {
    login_button: `#SiderMenuLogin`,
    agree_policy: `div.zoomModal-enter-done .lv-btn-primary`,
  },
  useImgUrl: false, // 直接下载页面url, 不模拟来手动下载
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
