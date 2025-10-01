const transform =
  "当前镜头到下一镜头之间要结合视频描述词生成一种一定要明确是哪种运镜,不一定是电影运镜只要是高级运镜都可以,例如一镜到底的大师级转换画面或运动方式";
const name = "邓稼先";
const prompt = `中国人面孔，像${name}, 电影风格，不要出现汉字军，警察等特殊字眼, 物品服饰场景等要符合那个年代的场景, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一, 标题, 画面提示,${transform},分别在不同的段落, 还有按照"年份/几岁|什么场景|做什么事"的格式生成一份分镜提示词也新起一个段落, 第十段是"1980年/56岁|家中书房|抱病坚持核武器小型化研究"`;
const historyNum = 16;
export default {
  "down-rm-watermark": {
    url: "https://aigc-idea-platform.cdn.bcebos.com/miaoying_video/shadow_i2v_1280x704_20250925_160634_a024gnii_2X_32fps_generate_metadata.mp4?authorization=bce-auth-v1%2FALTAKpTC4weJ6py821WCyek9FC%2F2025-09-25T08%3A06%3A41Z%2F-1%2F%2F612a44bb17040c579d19ab812adda61a6163d21f5bb02231b32c335a6e958b5b",
    "bg-music": "bg-music.mp3",
  },
  "history-person": {
    name,
    url: "https://v6-artist.vlabvod.com/873b6af3bac638528ef7e4b86f275f1b/68e52737/video/tos/cn/tos-cn-v-148450/oQaOBtHGfIkevBL7HJ1r3fhjIAEmDCDGRQ6DhF/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5961&bt=5961&cs=0&ds=12&ft=5QYTUxhhe6BMyqUrY-kJD12Nzj&mime_type=video_mp4&qs=0&rc=ZThkODRnZzM5ZGdkaWc4ZkBpM3FueW05cmt4NjczNDM7M0BgNl8tMl82NmExL181YDYtYSNmNGMtMmRzaWFhLS1kNDBzcw%3D%3D&btag=c0000e00020000&dy_q=1759243402&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=20250930224322A9C7EE0EC51C64F8CAB7",
    title: `民族脊梁${name}`,
    // 快乐传递者何炅
    // 国士无双袁隆平
    titleAnimation: "sweep_slow", // 可选值: "flash", "fade", "scale", "slide", "none", "sweep_fast", "sweep_slow", "sweep_pulse", "sweep_rainbow", "sweep_wave", "sweep_laser", "sweep_glow", "sweep_neon", "sweep_electric", "sweep_diamond"
    sectionTitleAnimation: "sweep_glow", // 分镜字幕动画效果，可选值同titleAnimation
    sectionTitle: [
      "1924年/0岁\n怀宁祖宅卧房\n出生安睡",,
      "1931年/7岁\n私塾学堂\n启蒙识字",,
      "1937年/13岁\n中学校园\n天文观测",,
      "1941年/17岁\n大学图书馆\n深夜研读",,
      "1945年/21岁\n联大实验室\n仪器操作",,
      "1948年/24岁\n远洋客轮\n负笈西洋",,
      "1952年/28岁\n普渡大学\n课题研究",,
      "1955年/31岁\n研究所\n数据分析",,
      "1958年/34岁\n科研基地\n理论推导",,
      "1980年/56岁\n家中书房\n抱病坚持核武器小型化研究",,
      "1962年/38岁\n实验场地\n现场计算",,
      "1966年/42岁\n研究所\n方案研讨",,
      "1970年/46岁\n大学讲堂\n教书育人",,
      "1974年/50岁\n实验室\n指导后辈",,
      "1978年/54岁\n书房\n著书立说",,
      "1982年/58岁\n医院病房\n坚持工作",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/韩磊 - 向天再借五百年_start22s_clip.mp3",
    // 栀子花开_start25s_clip
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "https://v9-artist.vlabvod.com/ac0373e9326286f2cb269017a3ca0352/68e36176/video/tos/cn/tos-cn-v-148450/oMWLIhsTRBJbJPgaxRi3Ag0QnDaQyAtbEgfMai/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5964&bt=5964&cs=0&ds=12&ft=5QYTUxhhe6BMyqx9j-kJD12Nzj&mime_type=video_mp4&qs=0&rc=Ojc3ZDs1PDllZzlpZzs1NUBpM2w0bXE5cjs1NjczNDM7M0BfNjBhNDU2NV4xXmEyNjM2YSNqaXA2MmRzX2FhLS1kNC9zcw%3D%3D&btag=c0000e00020000&dy_q=1759127241&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=20250929142721B8E2821AAAB76F4CBBDE",
      "https://v9-artist.vlabvod.com/f1d3ff87036bab6500fe40ec69aaa8b0/68e3623f/video/tos/cn/tos-cn-v-148450/oMy0DEAsRgEmOhBGTCtLre8IRiGBE6k4PAeey4/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5996&bt=5996&cs=0&ds=12&ft=5QYTUxhhe6BMyqDuj-kJD12Nzj&mime_type=video_mp4&qs=0&rc=MzZlZTU1ZWg6ZzxnZzw4O0BpM2Y1bWs5cjQ1NjczNDM7M0AzYGI1M2ItXmMxMS8vMzNhYSNkcGVkMmRzY2FhLS1kNC9zcw%3D%3D&btag=c0000e00018000&dy_q=1759127452&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=2025092914305206734F9D23ECFE58F38D",
    ],
    switch: "推拉", // 支持：叠化、淡入淡出、推拉、擦除、无转场
  },
  "ai-remove-watermark": {
    url: "output/history-person/1758868423130_10b9525ce467.mp4",
    debug: true,
    mask: {
      autodetect: "full-text",
      inpaint_radius: 14,
      dilate_px: 16,
      extra_expand_px: 6,
      extra_regions: [{ x: 6, y: 6, w: 220, h: 120 }],
    },
  },
  "clip-audio": [
    {
      url: "input/clip-audio/韩磊 - 向天再借五百年.mp3",
      start: 22,
    },
    {
      url: "input/clip-audio/栀子花开.mp3",
      start: 25,
    },
    {
      url: "input/clip-audio/屠洪刚 - 精忠报国.mp3",
      start: 25,
    },
  ],
  "auto-deepseek-jimeng": {
    deepseek: {
      url: "https://chat.deepseek.com/", // 要无头浏览器打开的deepseek网站
      persistLogin: true, // 是否保持登录状态（使用浏览器用户数据目录）
      login_selector: {
        // 进入deepseek登录页面后，如果发现能选择到下列元素，表示未登录，就选择账号密码元素
        username: `input[placeholder="请输入手机号/邮箱地址"]`,
        password: `input[placeholder="请输入密码"]`,
        login_button: `div[role="button"]`,
        username_password_tab: `div.ds-tab + div`,
      },
      login_data: {
        // 选择完账号密码元素后，输入账号密码, 然后点击登录按钮
        username: "13683514587",
        password: "zhongguo1234..A",
      },
      side_selector: `a`,
      chat_selector: `textarea[placeholder="给 DeepSeek 发送消息 "]`, // 登录完成后进入聊天页面，首先选择发送消息的输入框选择器
      send_chat_selector: `'input[type="file"] + div'`, // 录入完消息后，发送消息的按钮选择器
      send_msg_template: `${prompt}，{{name}}, 从出生到现在{{timeNum}}个关键时间点, 要特别注意人物服饰要符合历史事实,{{timeNum}}段视频生成提示词, 以及各个镜头画面之间的转换方式或运动方式, 视频镜头要是电影写实风格,比例9:16, 各段视频描述要与{{name}}的长相类似, 各段视频描述要写上人物年龄, 视频提示词不要显示国徽, 人民大会堂等政治信息, 严格生成{{timeNum}}段视频生成提示词，提示词为中文，每句话前面都加上"中国人面孔，像{{name}}，生成图片要符合实际生活场景"`,
      send_msg_template_data: {
        // 把send_msg_template中的{{name}}和{{timeNum}}替换为实际值, 然后把send_msg_template内容输入到chat_selector中
        name,
        timeNum: historyNum,
      },
      get_deepseek_result_time: historyNum * 4.5, // 等待deepseek返回结果的时间, 单位为秒
      deepseek_result_txt_fn: () => {
        const historyNum = 16;
        const navPrompt =
          "中国人面孔，像邓稼先, 电影风格，不要出现汉字军，警察等特殊字眼, 物品服饰场景等要符合那个年代的场景, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一";

        // 实现 takeRight 函数，不依赖 lodash
        function takeRight(arr, n) {
          if (!Array.isArray(arr) || arr.length === 0) return [];
          return arr.slice(Math.max(0, arr.length - n));
        }

        const originTitle = Array.from(
          Array.from(document.querySelectorAll("ol"))
            .pop()
            .querySelectorAll("span")
        ).map((one) => one.innerText);

        const title = originTitle.map((one) => one.replaceAll("|", "\n"));

        const globalPrompt = Array.from(
          Array.from(document.querySelectorAll("ul"))
            .pop()
            .querySelectorAll("span")
        )
          .map((one) => one.innerText)
          .join();

        const prompt = takeRight(
          [...document.querySelectorAll("span")]
            .map((one) => one.innerText)
            .filter(
              (one) => one.startsWith("画面提示") || one.startsWith("画面内容")
            ),
          historyNum
        );

        const shot = takeRight(
          [...document.querySelectorAll("span")]
            .map((one) => one.innerText)
            .filter((one) => one.startsWith("运镜方式")),
          historyNum
        );
        return title.map((one, index) => {
          return {
            title: one,
            prompt: `${originTitle[index]},${prompt[index]},${navPrompt}, ${globalPrompt}`,
            shot: shot[index],
          };
        });
      },
    },
    jimeng: {
      name,
      url: "https://jimeng.jianying.com/ai-tool/home?type=image", // 打开即梦图片生成首页
      login_selector: {
        login_button: `#SiderMenuLogin`,
        agree_policy: `div.zoomModal-enter-done .lv-btn-primary`,
      },
      generate_button_selector: `#AIGeneratedRecord`, // 点击生成按钮
      img_generate_input_selector: `textarea:last-child`, // 选择页面最后一个textarea输入框
      img_generate_input_send_selector: `.lv-btn-primary`, // 发送按钮
      gernerate_img_result_selector: `div[style="--aspect-ratio: 0.5625;"]`, // 生成结果
    },
    "jimeng-video-generator": {
      url: "https://jimeng.jianying.com/ai-tool/home?type=video", // 1.打开即梦视频生成首页
      generate_button_selector: `#AIGeneratedRecord`, // 点击生成按钮
      video_generate_select_trigger_selector: ".lv-typography", // 首尾帧选择器范围
      video_generate_select_trigger_text: "首尾帧", // 点击包含"首尾帧"的元素
      video_generate_select_item_text: "智能多帧", // 点击包含"智能多帧"的元素, 切换成智能多帧模式
      video_generate_select_item_selector: ".lv-typography", // 智能多帧选择器范围
      video_generate_upload_text: "第1帧", // 点击包含"第1帧"的元素
      video_generate_shot_text_btn_selector: 'input[type="file"]', // 点击第一个的class为.reference-upload-eclumn的div元素
      video_generate_shot_input_selector: ".lv-popover-inner-content textarea", // 选择textarea输入框, 按照正序输入processed_data.json中的segments中的shot.输入完成后点击第二个包含"5s"的div元素, 输入第二个shot
      video_generate_shot_input_confirm_text: "确认", // 在每次输入shot后点击包含"确认"的div元素, 接着点击第二个class为.reference-upload-eclumn的div元素, 输入第二个shot, 然后点击包含"确认"的div元素
      video_generate_shot_input_confirm_select:
        ".lv-popover-inner-content .lv-btn-shape-square", // 在每次输入shot后点击包含"确认"的div元素, 接着点击第二个class为.reference-upload-eclumn的div元素, 输入第二个shot, 然后点击包含"确认"的div元素
      video_generate_shot_selector: ".lv-typography", // 5s元素选择器范围
    },
  },
};
