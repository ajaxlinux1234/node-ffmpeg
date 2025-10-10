import jimengVideoConfig from "./jimeng-video-config.mjs";

const transform =
  "当前镜头到下一镜头之间要结合视频描述词生成一种一定要一镜到底, 运镜的转换是当前人物在当前场景到下一个场景的合理转换,要是大师级转换, 从一个镜头到另一个镜头的转换细节是: 主人物自然从一个场景到另一个场景, 一定要自然, 而且都要是主人物, 运镜转换描述一定是主人物从一个场景到下一个场景, 例如邓稼先从婴儿状态(出生场景)走去学校(另一场景)上学, 人物特写运镜, 所有运镜转化的中心都是只描述主人物从一个场景到另一个场景的过渡, 并且主人物的表情要自然贴合当时的场景";
const name = "爱国育人永流芳，物理天才李政道的一生";
const prompt = `中国人面孔, 电影风格，生成图片一定要是人物正脸照, 生成的图片任何地方都不要出现地图, 人物出生的镜头换下, 不要跟上下文中的重复, 不要讲去世, 各个镜头采用一镜到底, 不要出现汉字军，军国主义, 警察党旗,核潜艇, 遗像等特殊字眼, 不要出现直播间, 搜索资料,要是完全符合即梦生图和视频的提示词, 出现情况要是当时的实际情况, 物品服饰场景等要符合那个年代的场景, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一, 标题, 画面提示,${transform},分别在不同的段落, 还有按照"年份/几岁|什么场景|做什么事"的格式生成一份分镜提示词也新起一个段落, 画面提示跟运镜方式都要新起个段落, 画面提示词不要涉及国家领导人, 画面提示词中不涉及人物名称, 男性用一位男性,另一位男人,女性用一位女性,另一位女性来代替`;
const historyNum = 13;
const accountId = 2;
export default {
  // 全局配置
  cleanOutputHistory: false, // 是否在每次运行命令前清理output历史数据，默认为true
  "down-rm-watermark": {
    url: "https://aigc-idea-platform.cdn.bcebos.com/miaoying_video/shadow_i2v_1280x704_20250925_160634_a024gnii_2X_32fps_generate_metadata.mp4?authorization=bce-auth-v1%2FALTAKpTC4weJ6py821WCyek9FC%2F2025-09-25T08%3A06%3A41Z%2F-1%2F%2F612a44bb17040c579d19ab812adda61a6163d21f5bb02231b32c335a6e958b5b",
    "bg-music": "bg-music.mp3",
  },
  "history-person": {
    name,
    url: "output/merge-video/merged_1759593750482_merged.mp4",
    title: `爱国育人永流芳\n物理天才\n李政道的一生`,
    useBabyCry: true,
    titleDuration: 15, // 全局标题显示时长（秒），不设置则贯穿整个视频
    endTitle: "", // 结尾标题
    endTitleDuration: 10, // 结尾标题显示时长（秒）- 延长打字机音效时间
    endTitleAnimation: "typewriter", // 结尾标题动画效果：打字机效果
    endTitleSound: "typewriter", // 结尾标题声音效果：打字机声音
    disclaimerText: "AIGC生成 无真人肖像 只为致敬", // 底部免责声明文字（30px斜体，底部10%位置）
    // 快乐传递者何炅
    // 国士无双袁隆平
    titleAnimation: "sweep_slow", // 可选值: "flash", "fade", "scale", "slide", "none", "sweep_fast", "sweep_slow", "sweep_pulse", "sweep_rainbow", "sweep_wave", "sweep_laser", "sweep_glow", "sweep_neon", "sweep_electric", "sweep_diamond"
    sectionTitleAnimation: "sweep_slow", // 分镜字幕动画效果，可选值同titleAnimation

    // 视频质量配置
    qualityMode: "high", // 可选值: "high"(高质量,接近无损), "balanced"(平衡), "fast"(快速处理), "turbo"(极速处理)

    // 性能优化配置
    enableSpeedOptimization: true, // 启用速度优化：多线程+预设优化
    skipTempCleanup: false, // 跳过临时文件清理以节省时间
    sectionTitle: [
      "1926年/0岁 \n 江南宅院·新生 \n 婴儿安睡于传统摇篮",
      "1943年/17岁 \n 抗战时期·苦读 \n 油灯下研读物理著作",
      "1946年/20岁 \n 大学教室·钻研 \n 黑板前演算理论物理",
      "1950年/24岁 \n 芝加哥实验室·探索 \n 记录粒子对撞数据",
      "1956年/30岁 \n 研究办公室·思辨 \n 与同事探讨物理定律",
      "1957年/31岁 \n 颁奖大厅·荣光 \n 接受科学最高荣誉",
      "1972年/46岁 \n 学术讲堂·交流 \n 向听众讲解物理前沿",
      "1979年/53岁 \n 中美教室·育人 \n 指导青年学子深造",
      "1985年/59岁 \n 科研院所·规划 \n 研讨科学装置设计",
      "1998年/72岁 \n 苏州园林·传承 \n 与学子探讨艺术与科学",
      "2006年/80岁 \n 大学讲台·启迪 \n 阐释宇宙奥秘",
      "2014年/88岁 \n 书斋灯下·笔耕 \n 撰写科学建言手稿",
      "2023年/97岁 \n 海湾晨光·凝望 \n 眺望远方沉思",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/屠洪刚 - 精忠报国_start25s_clip.mp3",
    // 栀子花开_start25s_clip
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "https://v9-artist.vlabvod.com/f31daa339c18257dd78ec51c16621dc3/68ea7ea3/video/tos/cn/tos-cn-v-148450/oUDgrCeI9BhejBgMPIEfG4IJ63QzLrcYGfnQhC/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5975&bt=5975&cs=0&ds=12&ft=5QYTUxhhe6BMyqc4W~kJD12Nzj&mime_type=video_mp4&qs=0&rc=NGY0aDc5Nmk6ZDdpOTc1NkBpM29xeHk5cnJuNjczNDM7M0AwMjAtMDA1X2MxNDNeY2IvYSNsbHJnMmQ0NGRhLS1kNDBzcw%3D%3D&btag=c0000e00018000&dy_q=1759593467&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=20251004235747EA23AC7F881685048E8A",
      "https://v3-artist.vlabvod.com/ee7afffffc436472a7ede1cb6f20c9e8/68ea7f27/video/tos/cn/tos-cn-v-148450/o4ZhDofmRIGOO4BYRCwLLvkIE9GQp9keFAegIu/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=6092&bt=6092&cs=0&ds=12&ft=5QYTUxhhe6BMyqA0W~kJD12Nzj&mime_type=video_mp4&qs=0&rc=aDw1ZTpnMzM1aDs1M2g6NEBpamZ3OXA5cjNuNjczNDM7M0A2YGBjLmEzX2AxYzMzYjQvYSNzcnEyMmRrNmRhLS1kNDBzcw%3D%3D&btag=c0000e00010000&dy_q=1759593619&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=20251005000019D9455952BE9DE3230C97",
    ],
    switch: "无转场", // 历史人物专用转场效果
    // 可选转场效果：
    // 基础效果：叠化、淡入淡出、推拉、擦除、无转场
    // 历史人物专用：时光流转、岁月如歌、历史回眸、命运转折、精神传承、时代变迁、心路历程、光影交错
    //
    // 转场效果应用场景：
    // • 时光流转 - 适用于跨越多年的人生阶段转换，如从童年到青年、从求学到工作等重要人生节点
    // • 岁月如歌 - 适用于温馨的成长历程，如家庭生活、求学经历、师生情谊等温暖时光的衔接
    // • 历史回眸 - 适用于重大历史事件的庄重呈现，如重要发现、历史性时刻、国家大事等严肃场景
    // • 命运转折 - 适用于人物命运的重大转折，如人生选择、事业转向、历史机遇等戏剧性时刻
    // • 精神传承 - 适用于表现人物精神品质的传承，如师承关系、价值观传递、精神财富延续
    // • 时代变迁 - 适用于不同历史时期的宏大叙事，如社会变革、时代背景转换、历史进程推进
    // • 心路历程 - 适用于人物内心世界的细腻变化，如思想觉悟、情感波动、心理成长过程
    // • 光影交错 - 适用于现实与回忆的交织呈现，如追忆往昔、对比今昔、时空穿越效果
  },
  "extract-audio": {
    url: "outputSource/伊田助男.mp4", // 视频文件路径或URL
    format: "mp3", // 输出音频格式: mp3, wav, aac, flac, ogg, m4a
    quality: "high", // 音频质量: high, medium, low
    // 可选参数：
    // startTime: 10,     // 开始时间(秒)
    // duration: 30,      // 提取时长(秒)
    // channels: 2,       // 声道数 (1=单声道, 2=立体声)
    // sampleRate: 44100, // 采样率 (44100, 48000等)
  },
  "merge-audio-video": {
    videoUrl: "outputSource/伊田最终版.mp4", // 视频文件路径或URL
    audioUrl: "output/extract-audio/伊田助男_extracted_1759548361253.mp3", // 音频文件路径或URL
    position: "end", // 音频位置模式: overlay, replace, start, end
    volume: 1.0, // 音频音量 (0.0-2.0)
    // 可选参数：
    // audioDelay: 0,    // 音频延迟(秒)
    // videoDelay: 0,    // 视频延迟(秒)
    // trimAudio: false, // 裁剪音频到视频长度
    // trimVideo: false, // 裁剪视频到音频长度
    // fadeDuration: 2.0 // 淡入淡出时长(秒)
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
      getConfig: false,
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
      send_msg_template: `${prompt}，{{name}}, 从出生到现在{{timeNum}}个关键时间点, 要特别注意人物服饰要符合历史事实,{{timeNum}}段视频生成提示词, 以及各个镜头画面之间的转换方式或运动方式, 视频镜头要是电影写实风格,比例9:16, 各段视频描述要与{{name}}的长相类似, 各段视频描述要写上人物年龄, 视频提示词不要显示国徽, 人民大会堂等政治信息, 严格生成{{timeNum}}段视频生成提示词，提示词为中文，每句话前面都加上"生成图片要符合实际生活场景"`,
      send_msg_template_data: {
        // 把send_msg_template中的{{name}}和{{timeNum}}替换为实际值, 然后把send_msg_template内容输入到chat_selector中
        name,
        timeNum: historyNum,
      },
      get_deepseek_result_time: historyNum * 10, // 等待deepseek返回结果的时间, 单位为秒
      deepseek_result_txt_fn: () => {
        const historyNum = 13;
        const name = "爱国育人永流芳，物理天才李政道的一生";
        const navPrompt = `比例9:16，中国人面孔，像${name}, 电影风格，不要出现汉字军, 生成图片一定要是人物正脸照,警察遗像不要出现病房医院等特殊字眼, 任何地方都不要出现地图, 人物的衣服不要破洞, 物品服饰场景等要符合那个年代的场景, 衣服不要破洞, 人物形象国籍形象要统一, 人物发型要跟当时实际的发型统一, 人物使用物品的场景也要符合实际:比如天文望远镜要往天上看, 物品款式要证是当时年代的物品, 不要是现代或者未来的款式, 人物性别要统一, 生成的图中不要包含任何地图相关的物品,也不要包含条约相关的, 任何位置都不要出现地图`;

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
          Array.from(document.querySelectorAll("ol"))
            .pop()
            .querySelectorAll("span")
        )
          .map((one) =>
            one.innerText
              .replaceAll(/-,?/g, "")
              .replaceAll("\n", "")
              .replaceAll(/\d,?/g, "")
          )
          .join(" ");

        const prompt =
          takeRight(
            [...document.querySelectorAll("li")]
              .map((one) => one.innerText)
              .filter(
                (one) =>
                  one.startsWith("画面提示") ||
                  one.startsWith("画面内容") ||
                  one.startsWith("中国人面孔")
              ),
            historyNum
          ) ||
          takeRight(
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

        const shot =
          takeRight(
            [...document.querySelectorAll("li")]
              .map((one) => one.innerText)
              .filter((one) => one.startsWith("运镜方式")),
            historyNum
          ) ||
          takeRight(
            [...document.querySelectorAll("span")]
              .map((one) => one.innerText)
              .filter((one) => one.startsWith("运镜方式")),
            historyNum
          );
        return title.map((one, index) => {
          return {
            title: one,
            // prompt: `${originTitle[index]},${prompt[index]} ${navPrompt}, ${globalPrompt}, 参考图片跟生成的人物图片50%相似度, 一定不要太相似否则会侵权`,
            prompt: `${originTitle[index]},${prompt[index]}`,
            shot: `图片中的人物通过以下方式转化到下一个场景:${index === 0 ? "图中的宝宝哭泣" : ""}${shot[index]}`,
          };
        });
      },
    },
    jimeng: {
      accountId,
      name,
      downloadImg: true,
      url: "https://jimeng.jianying.com/ai-tool/home?type=image", // 打开即梦图片生成首页
      login_selector: {
        login_button: `#SiderMenuLogin`,
        agree_policy: `div.zoomModal-enter-done .lv-btn-primary`,
      },
      generate_button_selector: `#AIGeneratedRecord`, // 点击生成按钮
      aspect_ratio_trigger_selector: `div[role="combobox"] ~ button`, // 比例选择器触发按钮
      aspect_ratio_selector: `.lv-radio:last-of-type`, // 比例选择器
      img_generate_input_selector: `textarea:last-child`, // 选择页面最后一个textarea输入框
      reference_upload_column_selector: `.reference-upload-eclumn`, // 参考图片上传列
      reference_img_container:
        'div [style="--reference-count: 2; --reference-item-gap: 4px; --reference-item-offset: 3px;"]',
      reference_img_close:
        'div [style="--reference-count: 2; --reference-item-gap: 4px; --reference-item-offset: 3px;"] svg',
      img_generate_input_send_selector: `.lv-btn-primary`, // 发送按钮
      gernerate_img_result_selector: `div[style="--aspect-ratio: 0.5625;"]`, // 生成结果
    },
    // 从外部配置文件导入 jimeng-video-generator 配置
    "jimeng-video-generator": jimengVideoConfig["jimeng-video-generator"],
  },

  // 图片优化配置
  "optimize-image": {
    inputDir: "outputSource/邓稼先", // 输入目录
    outputDir: "output/optimized", // 输出目录
    quality: 60, // 压缩质量 (1-100)，90为高质量压缩
    formats: ["jpg", "jpeg", "png", "webp", "bmp", "tiff"], // 支持的格式
    recursive: true, // 是否递归处理子目录
    keepOriginal: true, // 是否保留原文件（如果压缩后更大）
    outputFormat: "auto", // 输出格式: "auto"(保持原格式), "jpg", "png", "webp"
    maxWidth: 1920, // 最大宽度，超过则缩放
    maxHeight: 1080, // 最大高度，超过则缩放
    aggressive: true, // 激进模式：更低质量但更小文件
  },
};
