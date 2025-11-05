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
    url: "https://v6-artist.vlabvod.com/b6b01ea764d4f8a2ea03027785f336b7/69101e82/video/tos/cn/tos-cn-v-148450/oQEyavCQEiQhwII42b9QdGYQBFwwAxjSguIXi/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5953&bt=5953&cs=0&ds=12&ft=5QYTUxhhe6BMyqC4MrVJD12Nzj&mime_type=video_mp4&qs=0&rc=ZDc2NTs4aTk3M2VpOjk0M0BpM2s0O2w5cmpoNzczNDM7M0AzYi42XmEtNTYxLS02XmNeYSMuYy01MmRrNDBhLS1kNDBzcw%3D%3D&btag=c0000e00018000&dy_q=1762059226&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=20251102125346789C0DBF314516CC2924",
    title: `他从侵华日军变成\n中国政府追认的{{日本籍抗日烈士}}\n国际共产战士{{宫川英男}}的一生`,
    useBabyCry: false,
    voiceList: [
      // {
      //   duration: [0, 2],
      //   voice: "蝉叫",
      // },
      // {
      //   duration: [5.5, 7],
      //   voice: "女人抽泣哭声",
      // },
      // {
      //   duration: [8.5, 10],
      //   voice: "敲锣声",
      // },
      // {
      //   duration: [13.5, 15],
      //   voice: "整理东西",
      // },
      // {
      //   duration: [18.5, 20],
      //   voice: "手推车",
      // },
      // {
      //   duration: [24, 25.5],
      //   voice: "下雨声",
      // },
      // {
      //   duration: [28.5, 30],
      //   voice: "街上群众叫卖声",
      // },
      // {
      //   duration: [33.5, 35],
      //   voice: "东西落地下",
      // },
      // {
      //   duration: [38.5, 40],
      //   voice: "吃东西声",
      // },
      // {
      //   duration: [43.5, 44.5],
      //   voice: "求求你",
      // },
      // {
      //   duration: [48.5, 50],
      //   voice: "冬季走在冰面上",
      // },
      // {
      //   duration: [53.5, 55.5],
      //   voice: "男人哭泣",
      // },
      // {
      //   duration: [58.5, 60],
      //   voice: "轻拍衣服",
      // },
    ],
    titleDuration: 10, // 全局标题显示时长（秒），不设置则贯穿整个视频
    endTitle: "{{向优秀的国际共产战士\n宫川英男致敬}}", // 结尾标题
    endTitleDuration: 10, // 结尾标题显示时长（秒）- 延长打字机音效时间
    endTitleAnimation: "typewriter", // 结尾标题动画效果：打字机效果
    endTitleSound: "typewriter", // 结尾标题声音效果：打字机声音
    disclaimerText: "AIGC生成 无真人肖像 只为致敬", // 底部免责声明文字（30px斜体，底部10%位置）
    // 快乐传递者何炅
    // 国士无双袁隆平
    titleAnimation: "sweep_slow", // 可选值: "flash", "fade", "scale", "slide", "none", "sweep_fast", "sweep_slow", "sweep_pulse", "sweep_rainbow", "sweep_wave", "sweep_laser", "sweep_glow", "sweep_neon", "sweep_electric", "sweep_diamond"
    sectionTitleAnimation: "turbo", // 分镜字幕动画效果，可选值同titleAnimation

    // 视频质量配置
    qualityMode: "high", // 可选值: "high"(高质量,接近无损), "balanced"(平衡), "fast"(快速处理), "turbo"(极速处理)

    // 性能优化配置
    enableSpeedOptimization: true, // 启用速度优化：多线程+预设优化
    skipTempCleanup: false, // 跳过临时文件清理以节省时间
    sectionFirstTitleTime: 4,
    sectionTitle: [
      "1918年/0岁 \n 日本山梨县贫农家庭 \n 宫川英男出生",
      "1939年/21岁 \n 日本征兵体检站 \n 被征兵入伍",
      "1941年/23岁 \n 双乳山战场 \n 被八路军俘虏时挣扎嘶吼",
      "1941年/23岁 \n 八路军驻地 \n 学习《论持久战》日译本",
      "1942年/24岁 \n 延安窑洞 \n 手握钢板刻写反战传单",
      "1943年/25岁 \n 津浦铁路线 \n 向日军碉堡投送慰问袋",
      "1944年/26岁 \n 长清县集市 \n 看到通缉令上自己的肖像",
      "1945年/27岁 \n 官庄村麦场 \n 向战友展示新编宣传册",
      "1945年/27岁 \n 万德西官庄 \n 在日军包围中焚烧文件",
      "1945年/27岁 \n 麦秸垛藏身处 \n 举枪冲出掩护战友突围",
      "1945年/27岁 \n 万德车站外 \n 中国战友冒雨抢回宫川英男遗体掩埋",
      "1980年/时空回响 \n 长清烈士陵园 \n 后人纪念宫川英男",
      "2009年/精神延续 \n 山梨县故乡 \n 宫川英男墓土撒入故土河流",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/如愿_start30s_clip.mp3",
    // 栀子花开_start25s_clip
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "https://v9-artist.vlabvod.com/3d08830e58213b9da2186cdea9bda7e9/69144d41/video/tos/cn/tos-cn-v-148450/oYLOAFDQMESdFwgTOEfCD8e0otfoEiOMkEBnZI/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5977&bt=5977&cs=0&ds=12&ft=5QYTUxhhe6BMyqJxHmVJD12Nzj&mime_type=video_mp4&qs=0&rc=NzY8OTQ8OGg3Z2czOTM2ZkBpanlzNHA5cnlrNzczNDM7M0AxMjUzLTQ2XmMxYl5eXmNfYSNnLWxzMmRrMTJhLS1kNC9zcw%3D%3D&btag=c0000e00018000&dy_q=1762333337&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=202511051702174D6EE5F18579575F3BD6",
      "https://v19-dreamina.capcutcdn-us.com/fe5b5639caf7005ff934606fcdee411f/690b6a34/video/tos/useast5/tos-useast5-ve-14178-tx/osSBCiUNUx7DNtrBQO7JbvfW2IDFLFEpgIJEec/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12184&bt=6092&cs=0&ft=GADp5Inz7Th80I6PXq8Zmo&mime_type=video_mp4&qs=0&rc=ZzY0PDwzPGU5ZjVlNGZnPEBpajtxZG85cmVrNzYzZzU6NEAyX2EtMmJiX2IxYmA1MjMuYSMxcGdvMmRzXzJhLS1kMy9zcw%3D%3D&vvpl=1&l=20251105091544631276FC7376611939F5&btag=e000b8000",
    ],
    // 方式一：统一转场效果（原有方式，向后兼容）
    // switch: "无转场", // 所有视频之间使用相同的转场效果

    // 方式二：分别设置转场效果（新功能）
    transitions: [
      "无转场", // 视频2 → 视频3 的转场效果
    ],
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
    input: "output/merge-video/merged_1761147619437_merged.mp4",
    // output: "output/filter/custom_output.mp4", // 可选，不指定则自动生成
    preset: "cinematic-teal-orange", // 预设滤镜名称，使用 --list 查看所有可用滤镜
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
      url: "input/clip-audio/如愿.mp3",
      start: 30,
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
};
