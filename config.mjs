const transform =
  "当前镜头到下一镜头之间要结合视频描述词生成一种一定要一镜到底, 运镜的转换是当前人物在当前场景到下一个场景的合理转换,要是大师级转换";
const name = "钱学森";
const prompt = `中国人面孔，像${name}, 电影风格，人物出生的镜头换下, 不要跟上下文中的重复, 不要讲去世, 各个镜头采用一镜到底, 不要出现汉字军，警察党旗,核潜艇, 遗像等特殊字眼, 搜索资料,要是完全符合即梦生图和视频的提示词, 出现情况要是当时的实际情况, 物品服饰场景等要符合那个年代的场景, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一, 标题, 画面提示,${transform},分别在不同的段落, 还有按照"年份/几岁|什么场景|做什么事"的格式生成一份分镜提示词也新起一个段落, 画面提示跟运镜方式都要新起个段落`;
const historyNum = 13;
const accountId = 2;
export default {
  "down-rm-watermark": {
    url: "https://aigc-idea-platform.cdn.bcebos.com/miaoying_video/shadow_i2v_1280x704_20250925_160634_a024gnii_2X_32fps_generate_metadata.mp4?authorization=bce-auth-v1%2FALTAKpTC4weJ6py821WCyek9FC%2F2025-09-25T08%3A06%3A41Z%2F-1%2F%2F612a44bb17040c579d19ab812adda61a6163d21f5bb02231b32c335a6e958b5b",
    "bg-music": "bg-music.mp3",
  },
  "history-person": {
    name,
    url: "output/merge-video/merged_1759394694154_merged.mp4",
    title: `航天之父${name}\n{{圆了中国人民的}}\n{{航天梦}}`,
    // 快乐传递者何炅
    // 国士无双袁隆平
    titleAnimation: "sweep_fast", // 可选值: "flash", "fade", "scale", "slide", "none", "sweep_fast", "sweep_slow", "sweep_pulse", "sweep_rainbow", "sweep_wave", "sweep_laser", "sweep_glow", "sweep_neon", "sweep_electric", "sweep_diamond"
    sectionTitleAnimation: "sweep_glow", // 分镜字幕动画效果，可选值同titleAnimation

    // 视频质量配置
    qualityMode: "high", // 可选值: "high"(高质量,接近无损), "balanced"(平衡), "fast"(快速处理)
    sectionTitle: [
      "1911年/0岁\n杭州祖宅\n出生时刻",
      "1923年/12岁\n北师大附中\n课堂听讲",
      "1929年/18岁\n交通大学\n图书馆研读",
      "1935年/24岁\n麻省理工\n实验室研究",
      "1936年/25岁\n加州理工\n师从冯·卡门",
      "1939年/28岁\n火箭小组\n实验攻关",
      "1945年/34岁\n德国考察\n技术交流",
      "1949年/38岁\n喷气推进实验室\n课题指导",
      "1955年/44岁\n归国邮轮\n眺望东方",
      "1956年/45岁\n中科院\n制定规划",
      "1960年/49岁\n研究所\n理论推导",
      "1966年/55岁\n科研基地\n现场指导",
      "1970年/59岁\n发射场\n观摩首星",
      "1978年/67岁\n大学讲堂\n培育后学",
      "1986年/75岁\n书房\n著书立说",
      "1991年/80岁\n家中\n坚持研究",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/屠洪刚 - 精忠报国_start25s_clip.mp3",
    // 栀子花开_start25s_clip
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "https://v6-artist.vlabvod.com/baa62b7b07a223a062afd586544073bd/68e7750a/video/tos/cn/tos-cn-v-148450/oUSgdFHMH3XdDEbrBfkBRbHigCE4AvfIEoWjQI/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=6002&bt=6002&cs=0&ds=12&ft=5QYTUxhhe6BMyqBNnYkJD12Nzj&mime_type=video_mp4&qs=0&rc=NDNpODo5OmU0N2g6ZzQ4ZEBpMzU5dms5cm1rNjczNDM7M0A1X2NfMzJhXjYxLmNiLTNeYSMvNGYyMmQ0MGJhLS1kNC9zcw%3D%3D&btag=c0000e00018000&dy_q=1759394412&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=20251002164012ACD597A2478A58FF5BC4",
      "https://v26-artist.vlabvod.com/f18ff2f562866e915b5f127258a06167/68e77420/video/tos/cn/tos-cn-v-148450/okf3ulwhbAAiWmbIQE2BxWJNEhyQX0tOBDgciz/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=6011&bt=6011&cs=0&ds=12&ft=5QYTUxhhe6BMyqqenYkJD12Nzj&mime_type=video_mp4&qs=0&rc=aGVlM2RmNDNlMztoaDw7NkBpajd1bWs5cnJlNjczNDM7M0A2MGA2My8vNWIxYC4zNWFgYSNhYGZkMmRjZmJhLS1kNC9zcw%3D%3D&btag=c0000e00018000&dy_q=1759394178&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=2025100216361882FE7E28394F5123C56D",
    ],
    switch: "无转场", // 支持：叠化、淡入淡出、推拉、擦除、无转场
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
  filter: {
    input: "output/merge-video/merged_1759325333220_merged.mp4",
    // output: "output/filter/custom_output.mp4", // 可选，不指定则自动生成
    preset: "cinematic-teal-orange", // 预设滤镜名称，使用 --list 查看所有可用滤镜
    // customFilter: "eq=contrast=1.2:saturation=1.3", // 自定义滤镜字符串，与preset二选一
    quality: "high", // high, medium, low
    keepAudio: true, // 是否保留音频
  },
  "convert-3d": {
    input:
      "output/filter/merged_1759325333220_merged_cinematic-teal-orange.mp4",
    // output: "output/convert-3d/custom_3d.mp4", // 可选，不指定则自动生成
    mode: "anaglyph-red-cyan", // 3D模式，使用 --list 查看所有可用模式
    // 可选模式: anaglyph-red-cyan, anaglyph-green-magenta, side-by-side, top-bottom
    depth: 0.3, // 深度强度 0.0-1.0，值越大3D效果越明显
    quality: "high", // high, medium, low
    keepAudio: true, // 是否保留音频
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
      get_deepseek_result_time: historyNum * 10, // 等待deepseek返回结果的时间, 单位为秒
      deepseek_result_txt_fn: () => {
        const historyNum = 13;
        const name = "中国氢弹之父于敏";
        const navPrompt = `比例9:16，中国人面孔，像${name}, 电影风格，不要出现汉字军，警察遗像不要出现病房医院等特殊字眼, 任何地方都不要出现地图, 人物的衣服不要破洞, 物品服饰场景等要符合那个年代的场景, 衣服不要破洞, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一, 生成的图中不要包含任何地图相关的物品,也不要包含条约相关的, 任何位置都不要出现地图`;

        // 实现 takeRight 函数，不依赖 lodash
        function takeRight(arr, n) {
          if (!Array.isArray(arr) || arr.length === 0) return [];
          return arr.slice(Math.max(0, arr.length - n));
        }

        const originTitle =
          takeRight(
            Array.from(document.querySelectorAll("span"))
              .map((one) => one.innerText)
              .filter((one) => /^\d/.test(one) && one.includes("|")),
            historyNum
          ) ||
          takeRight(
            Array.from(document.querySelectorAll("span"))
              .map((one) => one.innerText)
              .filter((one) => one.includes("|") && /^\d/.test(one)),
            historyNum
          );

        const title = originTitle.map((one) =>
          one.replaceAll("|", "\n").replaceAll("\t", "\n").replaceAll('"', "'")
        );

        const globalPrompt = Array.from(
          Array.from(document.querySelectorAll("ul"))
            .pop()
            .querySelectorAll("span")
        )
          .map((one) =>
            one.innerText
              .replaceAll(/-,?/g, "")
              .replaceAll("\n", "")
              .replaceAll(/\d,?/g, "")
          )
          .join();

        const prompt = takeRight(
          [...document.querySelectorAll("span")]
            .map((one) => one.innerText)
            .filter(
              (one) =>
                one.startsWith("画面提示") ||
                one.startsWith("画面内容") ||
                one.startsWith("中国人面孔")
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
      accountId,
      name,
      url: "https://jimeng.jianying.com/ai-tool/home?type=image", // 打开即梦图片生成首页
      login_selector: {
        login_button: `#SiderMenuLogin`,
        agree_policy: `div.zoomModal-enter-done .lv-btn-primary`,
      },
      generate_button_selector: `#AIGeneratedRecord`, // 点击生成按钮
      aspect_ratio_trigger_selector: `div[role="combobox"] ~ button`, // 比例选择器触发按钮
      aspect_ratio_selector: `.lv-radio:last-of-type`, // 比例选择器
      img_generate_input_selector: `textarea:last-child`, // 选择页面最后一个textarea输入框
      img_generate_input_send_selector: `.lv-btn-primary`, // 发送按钮
      gernerate_img_result_selector: `div[style="--aspect-ratio: 0.5625;"]`, // 生成结果
    },
    "jimeng-video-generator": {
      accountId, // 使用账号2
      generate_section: 2, // 由于即梦智能多镜一次最多上传10张图片, 所以需要分多次上传, 此参数表示是要上传的第几次
      generate_section_num: 8, // 分批上传一次section要上传多少张
      url: "https://jimeng.jianying.com/ai-tool/home?type=video", // 1.打开即梦视频生成首页
      generate_button_selector: `#AIGeneratedRecord`, // 点击生按钮
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
