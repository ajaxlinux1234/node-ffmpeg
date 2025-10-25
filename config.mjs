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
    url: "https://v9-artist.vlabvod.com/a4675ec106ae617b2029c915f7e220f6/6904dcf0/video/tos/cn/tos-cn-v-148450/ooh7YNAEIdGk9GrL02Cd3RoRidfBDOQJI7jeew/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5968&bt=5968&cs=0&ds=12&ft=5QYTUxhhe6BMyqSRblkJD12Nzj&mime_type=video_mp4&qs=0&rc=OGc6OmdlNGZnZjk6OWhnNEBpM3h1dXI5cmV0NjczNDM7M0BfYC0yMzFgXzQxNi0wXi42YSNgZGhrMmRrMXFhLS1kNDBzcw%3D%3D&btag=c0000e00018000&dy_q=1761321544&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=202510242359048874B31E4799BF75EAB2",
    title: `特朗普母亲\n玛丽·安妮·麦克劳德的\n{{逆袭人生}}`,
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
      "1920年/0岁\n上海弄堂\n母亲怀抱婴儿",
      "1927年/7岁\n鸿祥布店\n学徒启蒙",
      "1937年/17岁\n上海总店\n临危受命",
      "1950年/30岁\n香港中环\n突破禁运",
      "1954年/34岁\n太平毛纺\n香港创业",
      "1964年/44岁\n永新企业\n全球拓展",
      "1978年/58岁\n珠海荒地\n补偿贸易",
      "1985年/65岁\n港龙客机\n航空破冰",
      "1995年/75岁\n浙大校园\n捐资兴教",
      "1997年/77岁\n宁波光学\n科技报国",
      "1998年/78岁\n天文台\n星辰命名",
      "2018年/98岁\n香港书房\n世纪回望",
      "2021年/101岁\n家中卧室\n永恒落幕",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/我记得你眼里的依恋_start22s_clip.mp3",
    // 栀子花开_start25s_clip
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "https://v26-artist.vlabvod.com/39c5c261caf6fd4dd5ed5210d801e3be/6905b023/video/tos/cn/tos-cn-v-148450/owmqCQDBoBd0chviidNjkSIXHAR8ff7gWBEWPx/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5978&bt=5978&cs=0&ds=12&ft=5QYTUxhhe6BMyqcnGCkJD12Nzj&mime_type=video_mp4&qs=0&rc=ZTk5Ojs0ZDhpaDk5ZWY0OkBpM3Y5b245cnI6NjczNDM7M0BhNDM2XmBfX2IxMS1fXjQ0YSNncmZfMmRzXnJhLS1kNDBzcw%3D%3D&btag=c0000e00018000&dy_q=1761375611&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=202510251500113BB9EF566BF43C6C27A2",
      "https://v6-artist.vlabvod.com/1f22548a22c98777942642ed6ce6efcc/6905b166/video/tos/cn/tos-cn-v-148450/oIu4wMAffkQHFaXsgDDRLaCQ7EBGFOlW6HcIex/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5841&bt=5841&cs=0&ds=12&ft=5QYTUxhhe6BMyqo9GCkJD12Nzj&mime_type=video_mp4&qs=0&rc=ZDM6aDloZztmM2Q2NGY7ZEBpMzl2a3I5cmY6NjczNDM7M0BhMzAtYV9jXjMxX18yNTExYSMxamJyMmQ0YXJhLS1kNDBzcw%3D%3D&btag=c0000e00010000&dy_q=1761375954&feature_id=a86f30d13437b00b109e4117546eca60&l=20251025150554C24DEC0EE31BAE6F4F31",
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
      url: "input/clip-audio/离别开出花.mp3",
      start: 20,
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
