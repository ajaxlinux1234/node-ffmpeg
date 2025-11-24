import jimengConfig from "./lib/auto-deepseek-jimeng/jimeng-config.mjs";
import deepseekConfig from "./lib/auto-deepseek-jimeng/deepseek-config.mjs";
import baiduConfig from "./lib/auto-deepseek-jimeng/baidu-config.mjs";
import jimengVideoConfig, {
  name,
} from "./lib/auto-deepseek-jimeng/jimeng-video-config.mjs";

export default {
  // 全局配置
  cleanOutputHistory: false, // 是否在每次运行命令前清理output历史数据，默认为true
  "down-rm-watermark": {
    url: "https://aigc-idea-platform.cdn.bcebos.com/miaoying_video/shadow_i2v_1280x704_20250925_160634_a024gnii_2X_32fps_generate_metadata.mp4?authorization=bce-auth-v1%2FALTAKpTC4weJ6py821WCyek9FC%2F2025-09-25T08%3A06%3A41Z%2F-1%2F%2F612a44bb17040c579d19ab812adda61a6163d21f5bb02231b32c335a6e958b5b",
    "bg-music": "bg-music.mp3",
  },
  "history-person": {
    name,
    url: "output/merge-video/merged_1763988164999_merged.mp4",
    // title: `The Life of Josip Broz Tito\nthe Yugoslav Proletarian Revolutionary`,
    title: `美杜莎`,
    useBabyCry: false,
    voiceList: [
      {
        voice: '女孩笑声',
        duration: [3, 6]
      },
       {
        voice: '鸽子起飞声_start3s_clip',
        duration: [8, 9]
      },
      {
        voice: '科学实验',
        duration: [19, 20]
      },
       {
        voice: '海浪声',
        duration: [36, 40]
      },
       {
        voice: '拔剑声',
        duration: [54, 55]
      },
    ],
    titleDuration: 5, // 全局标题显示时长（秒），不设置则贯穿整个视频
    endTitle: "", // 结尾标题
    // endTitle: "",
    endTitleDuration: 4, // 结尾标题显示时长（秒）- 延长打字机音效时间
    endTitleAnimation: "typewriter", // 结尾标题动画效果：打字机效果
    endTitleSound: "typewriter", // 结尾标题声音效果：打字机声音
    disclaimerText: "", // 底部免责声明文字（30px斜体，底部10%位置）
    // 快乐传递者何炅
    // 国士无双袁隆平
    titleAnimation: "sweep_rainbow", // 可选值: "flash", "fade", "scale", "slide", "none", "sweep_fast", "sweep_slow", "sweep_pulse", "sweep_rainbow", "sweep_wave", "sweep_laser", "sweep_glow", "sweep_neon", "sweep_electric", "sweep_diamond"
    sectionTitleAnimation: "turbo", // 分镜字幕动画效果，可选值同titleAnimation

    // 视频质量配置
    qualityMode: "turbo", // 可选值: "high"(高质量,接近无损), "balanced"(平衡), "fast"(快速处理), "turbo"(极速处理)

    // 性能优化配置
    enableSpeedOptimization: true, // 启用速度优化：多线程+预设优化
    skipTempCleanup: false, // 跳过临时文件清理以节省时间
    sectionFirstTitleTime: 4,
    sectionTitle: [
      "公元前1250年\n美杜莎出生\n父亲是海神、母亲是海妖",
      "6岁\n是神的孩子\n却是凡人之身",
      "13岁\n成为雅典娜的侍女",
      "17岁\n因美貌而受到赞美",
      "18岁\n波塞冬被她的美貌深深吸引",
      "在雅典娜神庙中\n被波塞冬占有",
      "雅典娜目睹一切\n以玷污神殿为由对美杜莎下诅咒",
      "变成蛇发女妖\n直视她双眼的人会立刻变成石头",
      "19岁\n逃离到遥远的孤岛\n独自生活",
      "20岁\n岛上条件艰苦\n逐渐学会生存",
      "25岁\n失去往日的美丽和尊严\n保持对美好生活的渴望",
      "26岁\n众勇士登岛挑战\n皆化为岛中石像",
      "27岁\n珀尔修斯用雅典娜神盾阻挡石化目光\n被珀尔修斯猎杀",
      "雅典娜将美杜莎头颅\n镶嵌在神盾埃癸斯中央",
      "成为勇气和力量的象征\n在神话中永存",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/西方神话_start2s_clip.mp3",
    // Go West-Fancy
    // 西方神话_start2s_clip
    // 栀子花开_start25s_clip
    // 国际歌
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "https://v3-artist.vlabvod.com/c4896ee1577ca7e2772701bf588c19fb/692c5541/video/tos/cn/tos-cn-v-148450/oQMiaGBpIYzDh1kAHjhBfgpg1GJiQEYQWb10Ea/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=6022&bt=6022&cs=0&ds=12&ft=5QYTUxhhe6BMyq-KHcVJD12Nzj&mime_type=video_mp4&qs=0&rc=OGRlNDw1OWYzMzY3PDg3aUBpajo7OW05cjZrNzczNDM7M0A0NWNfLmEyX18xLWIuNV9iYSNoL2dgMmRjaWVhLS1kNDBzcw%3D%3D&btag=c0000e00018000&dy_q=1763908259&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=2025112322305814ED2472D02371AE8497",
      "https://v6-artist.vlabvod.com/27f5c5bad64f5eecadebafabb3190248/692c561d/video/tos/cn/tos-cn-v-148450/oAf0pNgsDhBktjGiWGi21IF3g9W2EQA4YlQhSJ/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=6028&bt=6028&cs=0&ds=12&ft=5QYTUxhhe6BMyqsVHcVJD12Nzj&mime_type=video_mp4&qs=0&rc=NDlkZzo2MzQ8Mzo4ZDU8O0BpajhuZ3I5cnRrNzczNDM7M0AzXmItX15jXy8xNDEzNWFhYSNyb2k2MmRzamVhLS1kNDBzcw%3D%3D&btag=c0000e00018000&dy_q=1763908479&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=20251123223439706FB0174DDBE01F2E4D",
      "https://v9-artist.vlabvod.com/851aac6364eb69ccedc31cb5bfe8608d/692d8ccd/video/tos/cn/tos-cn-v-148450/owEDTESkmjxdUfQjDBIfpRFUAHQC7Af3EMOsgo/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=6290&bt=6290&cs=0&ds=12&ft=5QYTUxhhe6BMyq4RduVJD12Nzj&mime_type=video_mp4&qs=0&rc=OTk3ZWU1aTlmOGZkMztoM0BpMzxxZnU5cnltNzczNDM7M0AwNi8xMGA2X2AxLl80MzQuYSM1czBrMmRzMWVhLS1kNC9zcw%3D%3D&btag=c0000e00008000&dy_q=1763988035&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=2025112420403533FED7F71DFC6600330F"
    ],
    // 方式一：统一转场效果（原有方式，向后兼容）
    switch: "无转场", // 所有视频之间使用相同的转场效果

    // 方式二：分别设置转场效果（新功能）
    // transitions: [
    //   "无转场", // 视频2 → 视频3 的转场效果
    // ],
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
    url: "music/1115.mp4", // 视频文件路径或URL
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
    // 测试单视频模式（向后兼容）
    // url: "input/ai-remove-watermark/手机洒上水了.mp4",
    // mask: {
    //   position: "top-right",
    //   width_percent: 36,
    //   height_percent: 5,
    //   margin: 10,
    // },

    // 批量处理模式示例（注释掉）
    videos: [
      {
        url: "output/merge-video/merged_1762248553760_merged.mp4",
        mask: {
          position: "top-right",
          width_percent: 36,
          height_percent: 5,
          margin: 10,
        },
        // title: "{{手机进水}}处理教程",
        // titleAnimation: "sweep_glow",
      },
      // {
      //   url: "input/ai-remove-watermark/手机洒上水了.mp4", // 复用同一个文件测试
      //   mask: {
      //     position: "bottom-left",
      //     width_percent: 20,
      //     height_percent: 10,
      //     margin: 20,
      //   },
      //   // 没有单独标题，会使用全局标题
      // },
    ],
    //
    // // 全局标题配置
    // globalTitle: "AI智能{{去水印}}工具",
    // globalTitleAnimation: "sweep_fast",

    // 单视频模式示例（注释掉）
    // url: "input/ai-remove-watermark/手机洒上水了.mp4",
    // mask: {
    //   position: "top-right",
    //   width_percent: 36,
    //   height_percent: 5,
    //   margin: 10,
    // },
    // title: "{{手机进水}}处理教程",
    // titleAnimation: "sweep_glow",

    // 批量处理模式示例（注释掉，需要时取消注释）
    // videos: [
    //   {
    //     url: "input/ai-remove-watermark/手机洒上水了.mp4",
    //     mask: {
    //       position: "top-right",
    //       width_percent: 36,
    //       height_percent: 5,
    //       margin: 10,
    //     },
    //     title: "{{手机进水}}处理教程", // 单独的视频标题
    //     titleAnimation: "sweep_glow", // 视频专用动画
    //   },
    //   {
    //     url: "input/ai-remove-watermark/另一个视频.mp4",
    //     mask: {
    //       position: "bottom-right",
    //       width_percent: 25,
    //       height_percent: 8,
    //       margin: 15,
    //     },
    //     // 没有单独标题，会使用全局标题
    //   },
    // ],
    //
    // // 全局标题配置 - 应用于所有没有单独标题的视频
    // globalTitle: "AI智能{{去水印}}工具",
    // globalTitleAnimation: "sweep_fast", // 全局动画效果
  },
  filter: {
    input:
      "output/history-person/merged_1762443658329_merged_720x1280_processed_blurmask.mp4",
    // output: "output/filter/custom_output.mp4", // 可选，不指定则自动生成
    preset: "historical-portrait", // 历史人物专用滤镜 - 温暖复古的金棕色调
    // customFilter: "eq=contrast=1.2:saturation=1.3", // 自定义滤镜字符串，与preset二选一
    quality: "high", // high, medium, low
    keepAudio: true, // 是否保留音频
  },
  "convert-3d": {
    input:
      "output/filter/merged_1760367082871_merged_cinematic-teal-orange.mp4",
    // output: "output/convert-3d/custom_3d.mp4", // 可选，不指定则自动生成
    mode: "anaglyph-red-cyan", // 3D模式，使用 --list 查看所有可用模式
    // 可选模式: anaglyph-red-cyan, anaglyph-green-magenta, side-by-side, top-bottom
    depth: 0.3, // 深度强度 0.0-1.0，值越大3D效果越明显
    quality: "high", // high, medium, low
    keepAudio: true, // 是否保留音频
  },
  "clip-audio": [
    {
      url: "sounds/鸽子起飞声.mp3",
      start: 3,
    },
  ],
  "clip-video": {
    videos: [
      {
        url: "input/merge-video/1.mp4", // 本地视频路径
        timeRange: [0, 2], // 保留1秒到3秒的内容
      },
    ],
  },
  "auto-deepseek-jimeng": {
    imgGenerateType: "jimeng", // jimeng | baidu
    deepseek: deepseekConfig,
    jimeng: jimengConfig,
    baidu: baiduConfig,
    // 注释掉视频生成配置，只执行图片生成
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

  // 批量图片裁剪配置（9:16竖屏格式，适合社交媒体）
  "batch-crop-images": {
    inputDir: "input/images", // 输入目录，包含要裁剪的图片
    outputDir: "output/cropped", // 输出目录，保存裁剪后的图片
    targetAspectRatio: "9:16", // 目标宽高比，适合抖音、快手等竖屏平台
    cropMode: "center", // 裁剪模式：center(居中)、smart(智能)、entropy(熵裁剪)
    quality: 90, // 输出质量 1-100，90表示高质量
    outputFormat: "auto", // 输出格式：auto(保持原格式)、jpg、png、webp
    recursive: true, // 是否递归处理子目录
    skipIfExists: true, // 如果输出文件已存在则跳过
    formats: ["jpg", "jpeg", "png", "webp"], // 支持的图片格式
  },

  // 视频帧提取和AI提示词生成配置
  "get-promot-image-by-video": {
    videoPath: "input/get-promot-image-by-video/20251123-美杜莎.mp4", // 输入视频路径
    videoName: "20251123-美杜莎", // 视频名称，用于创建输出目录
    seconds: [1, 5, 10, 14, 20, 25, 32, 35, 40, 45, 49, 55, 59, 65, 70], // 提取视频帧的时间点（秒）
    // 豆包AI配置
    get_title_path: "https://www.doubao.com/chat/28205387237474562", // 图片标题内容获取
    get_promot_path: "https://www.doubao.com/chat/19187408061685250", // 豆包提示词反推页面
    image_remove_words_path: "https://www.doubao.com/chat/28058628032259330", // 豆包图像去水印文字页面
    get_title: false,
    get_promot: false,
    get_remove_words: false,
    get_title_selector_fn: () => {
      const historyNum = 15;
      return Array.from(document.querySelectorAll(".auto-hide-last-sibling-br"))
        .slice(-historyNum)
        .map((one) =>
          one.innerText
            .replaceAll(/\s+/g, "")
            .replaceAll("|", "\n")
            .replaceAll("\n无", "")
            .replaceAll("/0岁", "")
        );
    },
    image_remove_words_fns: [
      () =>
        Array.from(document.querySelectorAll("button")).find((one) =>
          one.innerText.includes("技能")
        ),
      () =>
        Array.from(document.querySelectorAll("button")).find((one) =>
          one.innerText.includes("技能")
        ),
    ],
    // 可选配置
    shot: "运镜方式：镜头跟随图中主要人物，图中场景缓慢自然变成下一场景伴随着图中人物从当前场景缓慢变成下一个场景的人物，场景变成下一场景，同时人物变换为下一场景的主要人物，动态转换流畅自然", // 默认镜头描述
    waitTime: 60000, // 登录等待时间（毫秒）
    sendWaitTime: 20000, // 发送后等待AI回复时间（毫秒）
    generateWaitTime: 30000, // 图片生成等待时间（毫秒）
    stepTimeout: 60, // 每步骤用户确认超时时间（秒）
    removeTextPrompt:
      "去除这张图片中的所有位置上所有颜色的文字，去除左边半透明水印", // 去文字提示词
    // getTitlePrompt: `按照"人物名称/国籍/年份|事情1|事情2"的格式识别输出图片中间的文本内容，并输出文本内容`,
    // getTitlePrompt: `按照"年份/年龄|事情1|事情2"的格式识别输出图片中间的文本内容`,
    getTitlePrompt: `按照"年份/年龄|事情1|事情2"的格式识别输出图片中间的文本内容`,
    getPromotPrompt: `图片生成提示词反推，不要画面文字`,

    // 自定义选择器函数（可选）
    img_upload_selector_fn: () =>
      document.querySelector('div[data-testid="upload_file_button"]') ||
      document.querySelector('button[data-testid="upload_file_button"]'),
    file_upload: () =>
      document.querySelector(
        'div[data-testid="upload_file_panel_upload_item"]'
      ),
    input_selector_fn: () => document.querySelector("textarea"),
    get_promot_fn: () => {
      const historyNum = 15; // 对应seconds数组长度
      return Array.from(document.querySelectorAll(".auto-hide-last-sibling-br"))
        .slice(-historyNum)
        .map((one) => {
          const match = /"prompt":\s*"([^"]*)"/g.exec(one.innerText);
          return match ? match[1] : "";
        });
    },
  },

  // 声音克隆和文本转语音配置 (使用免费开源模型)
  "voice-clone": {
    // 模式选择: "clone"(声音克隆), "tts"(批量TTS), "single"(单个TTS)
    mode: "tts", // 测试真正的声音克隆功能

    // 引擎选择: "auto"(自动), "true_clone"(真正克隆), "advanced"(智能选择), "edge"(Edge TTS)
    engine: "edge", // 使用真正的声音克隆

    // 声音克隆模式配置
    // referenceAudio: "music/20251112-孙中山_extracted_1762957677092.mp3", // 参考音频文件
    // targetTexts: [
    //   "这是第一段要克隆的语音内容，测试声音克隆效果。",
    //   "这是第二段要克隆的语音内容，验证音色一致性。",
    //   "这是第三段要克隆的语音内容，展示克隆技术。",
    // ],

    // 批量TTS模式配置 (mode: "tts" 时使用)
    texts: [
      "欢迎使用高质量的Edge TTS文本转语音功能。",
      "这是微软最新的神经网络语音合成技术。",
      "支持中文晓晓语音和400多种其他语音。",
    ],

    // 单个TTS模式配置 (mode: "single" 时使用)
    // text: "这是一段单独的文本转语音内容，测试单个TTS功能。",
    // outputFile: "output/voice-clone/single_output.wav",
    // speakerWav: "input/voice-clone/reference_voice.wav", // 可选：用于声音克隆

    // 通用配置
    language: "zh", // 语言: "zh"(中文), "en"(英文), "multilingual"(多语言)
    // model: null, // TTS模型，null则自动选择。可用模型请运行: npx node-ffmpeg-tools voice-clone --list-models
    outputDir: "output/voice-clone", // 输出目录

    // 高级配置
    // model: "tts_models/zh-CN/baker/tacotron2-DDC-GST", // 指定特定模型
    // model: "tts_models/en/ljspeech/tacotron2-DDC", // 英文模型
    // model: "tts_models/multilingual/multi-dataset/xtts_v2", // 多语言模型(支持声音克隆)
  },
};
