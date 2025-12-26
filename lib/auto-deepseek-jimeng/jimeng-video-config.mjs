// 即梦视频生成器配置文件
// export const accountId = "人物传记史";
// export const accountId = "张佳佳";
export const accountId = "御姐";
export const name =
  "西北红军和革命根据地的创建者, 无产阶级革命家, 刘志丹的一生";
// #黄令仪 #龙芯之母 #国之脊梁
const lang = "zh";
const textMap = {
  zh: {
    url: "https://jimeng.jianying.com/ai-tool/home?type=video",
    video_generate_select_trigger_text: "首尾帧",
    video_generate_select_item_text: "智能多帧",
    video_generate_upload_text: "第1帧",
    video_generate_shot_input_confirm_text: "确认",
  },
  "zh-tw": {
    url: "https://dreamina.capcut.com/ai-tool/home?type=video",
    video_generate_select_trigger_text: "第一個和最後一個影格",
    video_generate_select_item_text: "多影格",
    video_generate_upload_text: "影格 1",
    video_generate_shot_input_confirm_text: "確認",
  },
};

const {
  url,
  video_generate_select_trigger_text,
  video_generate_select_item_text,
  video_generate_upload_text,
  video_generate_shot_input_confirm_text,
} = textMap[lang];

export default {
  "jimeng-video-generator": {
    name, // 项目名称，用于查找 processed_data.json 文件
    accountId, // 使用账号2
    persistLogin: true, // 是否启用登录状态持久化，默认为true
    generate_section: 1, // 由于即梦智能多镜一次最多上传10张图片, 所以需要分多次上传, 此参数表示是要上传的第几次
    generate_section_num: 9, // 分批上传一次section要上传多少张
    useShot: true, // 是否使用运镜描述，false表示不填运镜词

    // 🖼️ 图片自动放大配置
    autoUpscale: false, // 是否启用自动图片放大
    upscaleConfig: {
      targetResolution: { width: 1080, height: 1920 }, // 目标分辨率（视频生成推荐）
      replaceOriginal: true, // 是否替换原图
      backupOriginal: true, // 是否备份原图
      outputSuffix: "_upscaled", // 放大文件后缀
    },
    url,
    video_generate_select_trigger_text,
    video_generate_select_item_text,
    video_generate_upload_text,
    video_generate_shot_input_confirm_text, // 在每次输入shot后点击包含"确认"的div元素, 接着点击第二个class为.reference-upload-eclumn的div元素, 输入第二个shot, 然后点击包含"确认"的div元素
    video_generate_select_trigger_selector: ".lv-typography", // 首尾帧选择器范围
    video_generate_select_item_selector: ".lv-typography", // 智能多帧选择器范围
    video_generate_shot_text_btn_selector: 'input[type="file"]',
    video_generate_shot_input_selector: ".lv-popover-inner-content textarea", // 选择textarea输入框, 按照正序输入processed_data.json中的segments中的shot.输入完成后点击第二个包含"5s"的div元素, 输入第二个shot
    video_generate_shot_input_confirm_select:
      ".lv-popover-inner-content .lv-btn-shape-square", // 在每次输入shot后点击包含"确认"的div元素, 接着点击第二个class为.reference-upload-eclumn的div元素, 输入第二个shot, 然后点击包含"确认"的div元素
    video_generate_shot_selector: ".lv-typography", // 5s元素选择器范围
  },
};
