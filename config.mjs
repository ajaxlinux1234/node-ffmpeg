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
    url: "output/filter/merged_1760625337979_merged_cinematic-teal-orange.mp4",
    title: `沉默的荣耀\n从{{“体制内高官”}}\n到{{“地下战士”}}\n陈宝仓的{{信仰蜕变之路}}`,
    useBabyCry: false,
    titleDuration: 10, // 全局标题显示时长（秒），不设置则贯穿整个视频
    endTitle: "", // 结尾标题
    endTitleDuration: 10, // 结尾标题显示时长（秒）- 延长打字机音效时间
    endTitleAnimation: "typewriter", // 结尾标题动画效果：打字机效果
    endTitleSound: "typewriter", // 结尾标题声音效果：打字机声音
    disclaimerText: "AIGC生成 无真人肖像 只为致敬", // 底部免责声明文字（30px斜体，底部10%位置）
    // 快乐传递者何炅
    // 国士无双袁隆平
    titleAnimation: "sweep_slow", // 可选值: "flash", "fade", "scale", "slide", "none", "sweep_fast", "sweep_slow", "sweep_pulse", "sweep_rainbow", "sweep_wave", "sweep_laser", "sweep_glow", "sweep_neon", "sweep_electric", "sweep_diamond"
    sectionTitleAnimation: "fade", // 分镜字幕动画效果，可选值同titleAnimation

    // 视频质量配置
    qualityMode: "high", // 可选值: "high"(高质量,接近无损), "balanced"(平衡), "fast"(快速处理), "turbo"(极速处理)

    // 性能优化配置
    enableSpeedOptimization: true, // 启用速度优化：多线程+预设优化
    skipTempCleanup: false, // 跳过临时文件清理以节省时间
    sectionFirstTitleTime: 4,
    sectionTitle: [
      "1924年/23岁 \n 黄埔军校·淬炼 \n 在训练场上持枪敬练",
      "1928年/27岁 \n 北伐前线·征战 \n 在战壕中持望远镜观察",
      "1937年/36岁 \n 淞沪战场·御敌 \n 在前沿阵地指挥作战",
      "1943年/42岁 \n 昆明驻地·治军 \n 在军营检阅部队训练",
      "1945年/44岁 \n 受降仪式·见证 \n 庄重出席日军投降仪式",
      "1947年/46岁 \n 官邸书房·困惑 \n 深夜独坐审阅战报",
      "1948年/47岁 \n 书房灯下·觉醒 \n 专注研读进步书籍",
      "1949年/48岁 \n 香港会面·抉择 \n 与友人密谈时局",
      "1949年/48岁 \n 指挥部·部署 \n 向军官布置重要任务",
      "1949年/48岁 \n 起义现场·易帜 \n 宣布重要决定",
      "1950年/49岁 \n 北京会晤·新生 \n 与友人亲切交谈",
      "1951年/50岁 \n 军校讲堂·育人 \n 为学员讲授军事课程",
      "1952年/51岁 \n 书房执笔·著述 \n 伏案撰写理论著作",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/屠洪刚 - 精忠报国_start25s_clip.mp3",
    // 栀子花开_start25s_clip
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "https://v6-artist.vlabvod.com/ea5fdd533aa6eed11da96ee6dc08ba81/68fa371b/video/tos/cn/tos-cn-v-148450/oY4AAxoIhnaDzBbfgmDHPfEaFHSBng8yCUFOsQ/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=6005&bt=6005&cs=0&ds=12&ft=5QYTUxhhe6BMyqzWkekJD12Nzj&mime_type=video_mp4&qs=0&rc=ZGgzZWdlNGQ3NTpoOjg1NEBpM2dwbnM5cnNpNjczNDM7M0BeLV4uLmAyXzYxYDY2LTNjYSMyMnEwMmRrbGxhLS1kNDBzcw%3D%3D&btag=c0000e00018000&dy_q=1760623741&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=202510162209008C6A8F6F36D9B2283C3F",
      "https://v3-artist.vlabvod.com/ae0f8b8866c267d3ea7ec82fef1a280a/68fa3cef/video/tos/cn/tos-cn-v-148450/o0ScWdiEIAgofY8ftAiDxxTzzkI2GHSGBBQBQw/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=6038&bt=6038&cs=0&ds=12&ft=5QYTUxhhe6BMyqiR7ekJD12Nzj&mime_type=video_mp4&qs=0&rc=PDs2N2c7O2lpaWdmNTxlNUBpanB1ZWo5cmlqNjczNDM7M0AwYDYuYC1jNS8xM19eYTVfYSNtM2IwMmRzMWxhLS1kNDBzcw%3D%3D&btag=c0000e00010000&dy_q=1760625238&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=202510162233580408C304F00ADA317E3C",
    ],
    // 方式一：统一转场效果（原有方式，向后兼容）
    // switch: "无转场", // 所有视频之间使用相同的转场效果

    // 方式二：分别设置转场效果（新功能）
    transitions: [
      "无转场", // 视频1 → 视频2 的转场效果
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
    input: "output/merge-video/merged_1760625337979_merged.mp4",
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
      url: "input/clip-audio/我记得你眼里的依恋.mp3",
      start: 22,
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
};
