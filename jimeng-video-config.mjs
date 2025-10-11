// 即梦视频生成器配置文件
const accountId = 1;

export default {
  "jimeng-video-generator": {
    accountId, // 使用账号2
    generate_section: 1, // 由于即梦智能多镜一次最多上传10张图片, 所以需要分多次上传, 此参数表示是要上传的第几次
    generate_section_num: 7, // 分批上传一次section要上传多少张
    url: "https://jimeng.jianying.com/ai-tool/home?type=video", // 1.打开即梦视频生成首页
    video_generate_select_trigger_selector: ".lv-typography", // 首尾帧选择器范围
    video_generate_select_trigger_text: "首尾帧", // 点击包含"首尾帧"的元素
    video_generate_select_item_text: "智能多帧", // 点击包含"智能多帧"的元素, 切换成智能多帧模式
    video_generate_select_item_selector: ".lv-typography", // 智能多帧选择器范围
    video_generate_upload_text: "第1帧", // 点击包含"第1帧"的元素
    video_generate_shot_text_btn_selector: 'input[type="file"]',
    video_generate_shot_input_selector: ".lv-popover-inner-content textarea", // 选择textarea输入框, 按照正序输入processed_data.json中的segments中的shot.输入完成后点击第二个包含"5s"的div元素, 输入第二个shot
    video_generate_shot_input_confirm_text: "确认", // 在每次输入shot后点击包含"确认"的div元素, 接着点击第二个class为.reference-upload-eclumn的div元素, 输入第二个shot, 然后点击包含"确认"的div元素
    video_generate_shot_input_confirm_select:
      ".lv-popover-inner-content .lv-btn-shape-square", // 在每次输入shot后点击包含"确认"的div元素, 接着点击第二个class为.reference-upload-eclumn的div元素, 输入第二个shot, 然后点击包含"确认"的div元素
    video_generate_shot_selector: ".lv-typography", // 5s元素选择器范围
  },
};
