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
    url: "output/merge-video/merged_1764486277263_replaced.mp4",
    title: `文学巨匠鲁迅的一生`,
    titleLineBreak: "|", // history-person 标题使用 | 作为换行符
    useBabyCry: false,

    // 方式一：手动配置 voiceList（原有方式）
    // voiceList: [
    //   {
    //     voice: '女孩笑声',
    //     duration: [3, 6]
    //   },
    //   {
    //     voice: '鸽子起飞声_start3s_clip',
    //     duration: [8, 10]
    //   },
    // ],

    // 方式二：自动使用 lines 目录下的配音文件（新功能）
    useLines: false, // 启用后会自动读取 output/{name}/lines/ 目录下的 0.mp3, 1.mp3, 2.mp3...
    // 并按照 0-5秒、5-10秒、10-15秒... 的顺序自动分配配音
    // 注意：启用 useLines 后，voiceList 配置会被覆盖

    // 定格帧效果配置
    freezeFrame: 0, // 每5秒的最后一帧定格0.2秒，不设置或设为0则禁用
    // 例如：0.2 表示在 5s, 10s, 15s... 等时间点定格0.2秒

    // 定格帧动画效果
    freezeFrameAnimation: "none", // 定格帧动画类型
    // 可选值：
    // - "none": 无动画
    // - "zoom_in": 从小到大放大（推荐）
    // - "zoom_out": 从大到小缩小
    // - "fade_in": 淡入
    // - "slide_up": 从下往上滑入
    // - "slide_down": 从上往下滑入
    // - "rotate": 旋转
    // - "pulse": 脉冲（放大缩小循环）
    // - "shake": 震动
    // - "blur_in": 从模糊到清晰

    titleDuration: 10, // 全局标题显示时长（秒），不设置则贯穿整个视频
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
    qualityMode: "high", // 可选值: "high"(高质量,接近无损), "balanced"(平衡), "fast"(快速处理), "turbo"(极速处理)

    // 性能优化配置
    enableSpeedOptimization: true, // 启用速度优化：多线程+预设优化
    skipTempCleanup: false, // 跳过临时文件清理以节省时间
    sectionFirstTitleTime: 4,
    sectionTitle: [
      "1881年\n出生儒生家庭",
      "1894年/13岁\n父亲病重家道中落\n变卖家产为生",
      "1898年/18岁\n考入江南水师学堂\n接触西方科学思想",
      "1902年/22岁\n前往日本仙台学医\n立志“救治国人身体”",
      "1906年/25岁\n受日俄战争刺激\n决定弃医从文唤醒国民精神",
      "1917年/37岁\n以“鲁迅”为笔名\n发表小说《狂人日记》",
      "1921年/39岁\n出版《阿Q正传》\n深刻批判国民劣根性",
      "1926年/45岁\n与师大学生许广平相恋\n成为鲁迅的文学创作伙伴",
      "1930年/49岁\n担任左翼作家联盟常委\n开始培养青年作家",
      "1936年/55岁\n身体状况日渐下降\n出版最后作品《故事新编》",
      "1936年/55岁\n因病逝世\n逝世于上海",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/民国_start5s_clip.mp3",
    // Go West-Fancy
    // 西方神话_start2s_clip
    // 栀子花开_start25s_clip
    // 国际歌
    // 民国_start5s_clip
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "https://v16-cc.capcut.com/68a00f3a4a136dfbead73b55362a56fd/6935196b/video/tos/alisg/tos-alisg-ve-14178-sg/o0PJI2eUO7xcwSNrQDBwE4x3gQisBpNeKgBQZi/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12040&bt=6020&cs=0&ft=GAAO2Inz7ThB~gVPXq8Zmo&mime_type=video_mp4&qs=0&rc=aGg2ZzxmZDg7ZjczNzpoZEBpM2o5NnU5cmt3NzYzODU6NEAuMS8tLjYvXmExNC1gYC41YSM0LWJeMmQ0cWlhLS1kMy1zcw%3D%3D&vvpl=1&l=20251130140610E1C91419EEC7A9D4CBB5&btag=e000b8000",
      "https://v16-cc.capcut.com/123a8c9c82f8635a74491d5b1e88b018/69351e30/video/tos/alisg/tos-alisg-ve-14178-sg/oshrhQcIMMTIQEpIPCLSb4AGAwghLDy5e8Vsee/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12186&bt=6093&cs=0&ft=GAAO2Inz7ThO6dVPXq8Zmo&mime_type=video_mp4&qs=0&rc=OjZpPDRlZGUzNGY1PGQ1Z0BpMzRrNHk5cjd4NzYzODU6NEAxNTRfYi0zXy8xMF8vLS0wYSNscWQxMmQ0NGlhLS1kMy1zcw%3D%3D&vvpl=1&l=20251130142641F1A2E4765E5D4CCC4066&btag=e000b8000",
      "https://v16-cc.capcut.com/1b461af8172d2f8bac42d780cb636628/69351698/video/tos/alisg/tos-alisg-ve-14178-sg/ogHf2FfH3AimdD2SEt3Gfmss0oEYrkDAAQFrIe/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12562&bt=6281&cs=0&ft=GAAO2Inz7ThHggVPXq8Zmo&mime_type=video_mp4&qs=0&rc=O2U2Ojo3N2RpNWc0M2lnZkBpamxscXU5cnl3NzYzODU6NEBiL2M1Yi8yXy4xLS0uYzIzYSNqMWk2MmRza2lhLS1kMy1zcw%3D%3D&vvpl=1&l=202511301354224C7429914767AE0E9FE6&btag=e000b0000",
    ],
    videoReplaceUrls: [
      {
        index: 1,
        timeRange: [5, 10],
        url: "https://v16-cc.capcut.com/0032a141d50551cd49e86f1fc04a5bfc/693523f3/video/tos/alisg/tos-alisg-ve-14178-sg/o8fwXTlbDgCEHKAr5eDJgSItVQIlN0TyeFOsRm/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=13182&bt=6591&cs=0&ft=GAAO2Inz7ThnqdVPXq8Zmo&mime_type=video_mp4&qs=0&rc=OTg0NjtlN2ZkZjs5Omc6Z0BpajczdnY5cnN4NzYzODU6NEA2MWMwYTA1Xi4xLV5iNDZgYSNnXm9uMmRjZmlhLS1kMy1zcw%3D%3D&vvpl=1&l=20251130145126C2D7C8648BFEA8D76E9C&btag=e000b0000",
      },
      {
        index: 2,
        timeRange: [10, 15],
        url: "https://v16-cc.capcut.com/17b3d7085ef8a3103ff8fe665fa66d0d/6935267b/video/tos/alisg/tos-alisg-ve-14178-sg/ogH85FIIQGAkZnrem1LAX7B8kffcFY3fGF6mg0/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12898&bt=6449&cs=0&ft=GAAO2Inz7ThJFdVPXq8Zmo&mime_type=video_mp4&qs=0&rc=MzU7Ojw6aTw2NTc6NDg2NUBpM3Zzdnc5cnV4NzYzODU6NEBgXi9eYTIxXl8xYi9eMjBfYSNtcG00MmQ0a2lhLS1kMy1zcw%3D%3D&vvpl=1&l=20251130150214D565515273E483C336EA&btag=e000b0000",
      },
      {
        index: 3,
        timeRange: [30, 40],
        url: "https://v16-cc.capcut.com/8b95c80e98f07ef33ebe0ddda842a3c5/69351f0d/video/tos/alisg/tos-alisg-ve-14178-sg/owsZP4IAgHbFoEe5oCTWfVfBlRDCDCHEYQISOr/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12380&bt=6190&cs=0&ft=GAAO2Inz7ThrMdVPXq8Zmo&mime_type=video_mp4&qs=0&rc=Zzs7aTg6NGQ3aGZoPDQ1NEBpM3A4M3k5cnh4NzYzODU6NEBiNTBfNTEyNjQxNi4zYzZiYSNoZF80MmQ0NWlhLS1kMy1zcw%3D%3D&vvpl=1&l=20251130143027EF48D6FC0FE89ABFA7DB&btag=e000b0000",
      },
    ],
    switch: "无转场",
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
      url: "music/民国.mp3",
      start: 5,
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

  // 自动化视频处理流程配置
  "merge-options": {
    name, // 对应 output/{name}/processed_data.json
    highQuality: true, // 启用高质量模式（在GPU/内存允许下最大化质量）
  },

  // 视频帧提取和AI提示词生成配置
  "get-promot-image-by-video": {
    videoPath: "input/get-promot-image-by-video/20251128-亚历山大二世.mp4", // 输入视频路径
    videoName: "20251128-亚历山大二世", // 视频名称，用于创建输出目录
    seconds: [0, 7, 14, 21, 28, 35, 42.5, 49, 56, 64.5, 70.5], // 提取视频帧的时间点（秒）
    useAutoSeconds: true,
    // 豆包AI配置
    get_title_path: "https://www.doubao.com/chat/28205387237474562", // 图片标题内容获取
    get_promot_path: "https://www.doubao.com/chat/19187408061685250", // 豆包提示词反推页面
    image_remove_words_path: "https://www.doubao.com/chat/28058628032259330", // 豆包图像去水印文字页面
    get_title: false,
    get_promot: false,
    get_remove_words: false,
    get_title_selector_fn: () => {
      const historyNum = 11;
      return Array.from(document.querySelectorAll(".auto-hide-last-sibling-br"))
        .slice(-historyNum)
        .map((one) =>
          one.innerText
            .replaceAll(/\s+/g, "")
            .replaceAll("|", "\n")
            .replaceAll("\n无", "")
            .replaceAll("/0岁", ""),
        );
    },
    image_remove_words_fns: [
      () =>
        Array.from(document.querySelectorAll("button")).find((one) =>
          one.innerText.includes("技能"),
        ),
      () =>
        Array.from(document.querySelectorAll("button")).find((one) =>
          one.innerText.includes("技能"),
        ),
    ],
    // 可选配置
    shot: "运镜方式：镜头跟随图中主要人物，图中场景缓慢自然变成下一场景伴随着图中人物从当前场景缓慢变成下一个场景的人物，人物不要走动，人物只进行形态和样貌上的变化，场景变成下一场景，同时人物变换为下一场景的主要人物，动态转换流畅自然", // 默认镜头描述
    waitTime: 60000, // 登录等待时间（毫秒）
    pageLoadWaitTime: 3000, // 页面加载后等待时间（毫秒）
    uploadWaitTime: 5000, // 上传图片后等待时间（毫秒）
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
        'div[data-testid="upload_file_panel_upload_item"]',
      ),
    input_selector_fn: () => document.querySelector("textarea"),
    get_promot_fn: () => {
      const historyNum = 11; // 对应seconds数组长度
      return Array.from(document.querySelectorAll(".auto-hide-last-sibling-br"))
        .slice(-historyNum)
        .map((one) => {
          const match = /"prompt":\s*"([^"]*)"/g.exec(one.innerText);
          return match ? match[1] : "";
        });
    },
  },

  // 视频去重配置
  "video-dedup": {
    input: "outputUtils/刘强东.mp4", // 输入视频路径
    // output: "output/video-dedup/custom_output.mp4", // 输出路径（可选，不指定则自动生成）

    // 性能配置
    // enableGPU: true,  // 自动检测并启用GPU加速（默认true）
    // threads: 0,       // CPU线程数，0为自动（使用75%的CPU核心）

    // 噪点配置 - 添加随机噪点效果
    sweepLight: {
      enabled: true, // 是否启用
      opacity: 0.15, // 噪点强度 0.05-0.3，建议0.1-0.2
      speed: "medium", // 保留参数（兼容性）
      angle: null, // 保留参数（兼容性）
      width: 0.3, // 保留参数（兼容性）
      color: "white", // 保留参数（兼容性）
    },

    // MD5修改 - 修改视频文件MD5值
    modifyMD5: true, // 是否修改MD5

    // 模糊遮罩边框配置 - 添加模糊边框效果
    letterbox: {
      enabled: true, // 是否启用
      top: 40, // 上边框高度（像素）
      bottom: 40, // 下边框高度（像素）
      left: 0, // 左边框宽度（像素）
      right: 0, // 右边框宽度（像素）
      blurStrength: 15, // 模糊强度 5-30
    },

    // 锐化配置 - 适当锐化视频
    sharpen: {
      enabled: true, // 是否启用
      strength: "medium", // 强度: light, medium, strong
    },

    // 降噪配置 - 对视频进行降噪
    denoise: {
      enabled: true, // 是否启用
      strength: "light", // 强度: light, medium, strong
    },

    // 变速配置 - 可配置的加快变速处理
    speedChange: {
      enabled: true, // 是否启用
      speed: 1.001, // 速度倍数 1.0-1.2（1.05表示加快5%）
    },

    // 色彩调整配置 - 随机微调色调/饱和度/亮度/对比度
    colorAdjust: {
      enabled: false, // 是否启用
      hue: 0, // 色调偏移 -30到30度，0为随机
      saturation: 1.0, // 饱和度 0.8-1.2，1.0为随机
      brightness: 0, // 亮度 -0.1到0.1，0为随机
      contrast: 1.0, // 对比度 0.9-1.1，1.0为随机
    },

    // 镜像翻转配置 - 水平或垂直翻转视频
    flip: {
      enabled: false, // 是否启用
      horizontal: false, // 水平翻转
      vertical: false, // 垂直翻转
    },

    // 缩放配置 - 微调视频尺寸
    scale: {
      enabled: true, // 是否启用
      scale: 1.01, // 缩放比例 0.95-1.05，1.0为随机
    },

    // 旋转配置 - 微调视频角度
    rotate: {
      enabled: false, // 是否启用
      angle: 0, // 旋转角度 -5到5度，0为随机
    },

    // 帧率调整配置 - 改变视频帧率
    fpsAdjust: {
      enabled: false, // 是否启用
      fps: 0, // 目标帧率，0为不改变（如30, 25, 24等）
    },

    // 模糊配置 - 轻微模糊效果
    blur: {
      enabled: true, // 是否启用
      strength: "light", // 强度: light, medium, strong
    },

    // 色彩曲线配置 - 应用色彩曲线预设
    curves: {
      enabled: true, // 是否启用
      preset: "darker", // 预设: vintage, darker, lighter, none
    },

    // 微调亮度配置 - 添加极轻微的随机亮度调整
    timestamp: {
      enabled: true, // 是否启用
      position: "bottom-right", // 保留参数（兼容性）
      format: "invisible", // 不可见模式
    },

    // 色度偏移配置 - 微调色彩空间
    chromaShift: {
      enabled: true, // 是否启用
      strength: "light", // 强度: light, medium, strong
    },

    // 帧抖动配置 - 微调帧时间戳
    frameJitter: {
      enabled: true, // 是否启用
      amount: 0.001, // 抖动量 0.001-0.01
    },

    // 像素偏移配置 - 微调像素位置
    pixelShift: {
      enabled: true, // 是否启用
      x: 1, // X轴偏移 0-3像素
      y: 1, // Y轴偏移 0-3像素
    },

    // 颗粒感配置 - 胶片颗粒效果
    grain: {
      enabled: true, // 是否启用
      strength: "light", // 强度: light, medium, strong
      type: "film", // 类型: film, digital
    },

    // 色彩抖动配置 - 随机色彩微调
    colorDither: {
      enabled: true, // 是否启用
      strength: 0.02, // 抖动强度 0.01-0.05
    },

    // 边缘增强配置 - 增强画面边缘
    edgeEnhance: {
      enabled: true, // 是否启用
      strength: "light", // 强度: light, medium, strong
    },

    // 随机裁剪配置 - 微调画面边缘
    randomCrop: {
      enabled: true, // 是否启用
      maxCrop: 5, // 最大裁剪像素 1-10
    },

    quality: "low", // 视频质量: high, medium, low
    keepAudio: true, // 是否保留音频
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
