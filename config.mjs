const prompt =
  "中国人面孔，电影风格，不要出现汉字军，警察等特殊字眼, 标题, 画面提示,当前镜头到下一镜头之间的大师级转换画面或运动方式,分别在不同的段落";
const num = 10;
const name = "邓稼先";
export default {
  "down-rm-watermark": {
    url: "https://aigc-idea-platform.cdn.bcebos.com/miaoying_video/shadow_i2v_1280x704_20250925_160634_a024gnii_2X_32fps_generate_metadata.mp4?authorization=bce-auth-v1%2FALTAKpTC4weJ6py821WCyek9FC%2F2025-09-25T08%3A06%3A41Z%2F-1%2F%2F612a44bb17040c579d19ab812adda61a6163d21f5bb02231b32c335a6e958b5b",
    "bg-music": "bg-music.mp3",
  },
  "history-person": {
    url: "input/history-person/袁隆平.mp4",
    title: "国士无双袁隆平",
    // 快乐传递者何炅
    // 国士无双袁隆平
    titleAnimation: "sweep_slow", // 可选值: "flash", "fade", "scale", "slide", "none", "sweep_fast", "sweep_slow", "sweep_pulse", "sweep_rainbow", "sweep_wave", "sweep_laser", "sweep_glow", "sweep_neon", "sweep_electric", "sweep_diamond"
    sectionTitleAnimation: "fade", // 分镜字幕动画效果，可选值同titleAnimation
    // sectionTitle: [
    //   "公元前50000年/0岁\n燧人氏于原始部落降生",
    //   "公元前49970年/30岁\n青年燧人氏观察自然现象\n对火产生好奇",
    //   "公元前49950年/50岁\n发明钻木取火\n首次主动创造火种",
    //   "公元前49945年/55岁\n将取火技术传授给族人",
    //   "公元前49940年/60岁\n教民熟食\n提升部落健康水平",
    //   "公元前49920年/80岁\n利用火塘\n带领族人建造更宜居的半地穴式房屋",
    //   "公元前49900年/100岁\n利用火制作出第一批原始陶器",
    //   "公元前49880年/120岁\n发明结绳记事\n为信息传递奠定基础",
    //   "公元前49860年/140岁\n晚年燧人氏\n将智慧与领导权交给下一代",
    //   "公元前49850年/150岁\n传递希望的火种\n燧人氏去世",
    // ],
    // sectionTitle: [
    //   "1974年/0岁\n何炅出生于长沙",
    //   "1992年/18岁\n考入北京外国语大学",
    //   "1995年/21岁\n在综艺《聪明屋》\n饰演大拇哥",
    //   "1998年/24岁\n与李湘一起\n主持《快乐大本营》",
    //   "2004年/30岁\n演唱歌曲《栀子花开》",
    //   "2007年/33岁\n快乐大本营现场\n及时救场",
    //   "2015年/41岁\n导演电影",
    //   "2019年/45岁\n在向往的生活\n与嘉宾围坐聊天",
    //   "2020年/46岁\n线上云录制",
    //   "2024年/50岁\n穿着定制西服的何炅\n从容走过",
    // ],

    sectionTitle: [
      "1930年/0岁\n袁隆平出生于北平",
      "1936年/6岁\n汉口小学\n上学",
      "1939年/9岁\n战争期间\n跟母亲逃难",
      "1949年/19岁\n重庆校园内\n在图书馆苦读",
      "1953年/23岁\n大学试验田边\n专注观察稻穗",
      "1960年/30岁\n安江农校\n在黑板上绘制水稻图谱",
      "1961年/31岁\n安江农校试验田\n发现特殊稻株",
      "1966年/36岁\n海南稻田\n汗水浸透粗布衣裳\n水稻授粉",
      "1973年/43岁\n海南试验基地\n在田间指导助手",
      "1981年/51岁\n国际研讨会现场\n用流利英语演讲",
      "1995年/65岁\n实验室显微镜前\n认真观察",
      "1999年/69岁\n稻田中\n弯腰检查稻穗",
      "2004年/74岁\n颁奖典礼后台\n手握稻穗模型",
      "2011年/81岁\n迪拜沙漠农场\n穿着防晒服查看水稻",
      "2017年/87岁\n青岛海水稻基地\n手捧耐盐碱水稻开怀大笑",
      "2019年/89岁\n生日会场\n与年轻人分享生日蛋糕",
      "2021年/91岁\n金黄的稻浪在风中起伏\n向袁老致敬",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/屠洪刚 - 精忠报国_start25s_clip.mp3",
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
      send_msg_template: `${prompt}，{{name}}, 从出生到现在{{timeNum}}个关键时间点, 要特别注意人物服饰要符合历史事实,{{timeNum}}段视频生成提示词, 以及各个镜头画面之间的转换方式或运动方式, 视频镜头要是电影写实风格,比例9:16, 各段视频描述要与{{name}}的长相类似, 各段视频描述要写上人物年龄, 视频提示词不要显示国徽, 人民大会堂等政治信息, 严格生成{{timeNum}}段视频生成提示词，提示词为中文，运镜要是高级运镜，每句话前面都加上"中国人面孔，像{{name}}，生成图片要符合实际生活场景"`,
      send_msg_template_data: {
        // 把send_msg_template中的{{name}}和{{timeNum}}替换为实际值, 然后把send_msg_template内容输入到chat_selector中
        name,
        timeNum: num,
      },
      get_deepseek_result_time: num * 4.5, // 等待deepseek返回结果的时间, 单位为秒
      deepseek_result_txt_fn: () => {
        const num = 10;
        const navPrompt =
          "中国人面孔，电影风格，不要出现汉字军，警察等特殊字眼";
        // 实现 takeRight 函数，不依赖 lodash
        function takeRight(arr, n) {
          if (!Array.isArray(arr) || arr.length === 0) return [];
          return arr.slice(Math.max(0, arr.length - n));
        }

        // 尝试多种选择器来获取DeepSeek的回复内容
        const title = takeRight(
          [...document.querySelectorAll("strong span")].map(
            (one) => one.innerText
          ),
          num + 1
        );
        title.pop();
        const prompt = takeRight(
          [...document.querySelectorAll("span")]
            .map((one) => one.innerText)
            .filter(
              (one) => one.startsWith("画面提示") || one.startsWith("画面内容")
            ),
          num
        );

        const shot = takeRight(
          [...document.querySelectorAll("span")]
            .map((one) => one.innerText)
            .filter((one) => one.startsWith("运镜方式")),
          num
        );
        return title.map((one, index) => {
          return {
            title: one,
            prompt: `${one},${prompt[index]},${navPrompt}`,
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
