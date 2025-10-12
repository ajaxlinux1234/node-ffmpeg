import jimengConfig from "./lib/auto-deepseek-jimeng/jimeng-config.mjs";
import deepseekConfig from "./lib/auto-deepseek-jimeng/deepseek-config.mjs";
import baiduConfig from "./lib/auto-deepseek-jimeng/baidu-config.mjs";
import jimengVideoConfig from "./lib/auto-deepseek-jimeng/jimeng-video-config.mjs";

const name = "与中国人民并肩抗日的“日籍同志”-尾崎秀实";
export default {
  // 全局配置
  cleanOutputHistory: false, // 是否在每次运行命令前清理output历史数据，默认为true
  "down-rm-watermark": {
    url: "https://aigc-idea-platform.cdn.bcebos.com/miaoying_video/shadow_i2v_1280x704_20250925_160634_a024gnii_2X_32fps_generate_metadata.mp4?authorization=bce-auth-v1%2FALTAKpTC4weJ6py821WCyek9FC%2F2025-09-25T08%3A06%3A41Z%2F-1%2F%2F612a44bb17040c579d19ab812adda61a6163d21f5bb02231b32c335a6e958b5b",
    "bg-music": "bg-music.mp3",
  },
  "history-person": {
    name,
    url: "output/merge-video/merged_1760245853909_merged.mp4",
    title: `{{与中国人民}}\n{{并肩抗日的}}\n“日籍同志”\n尾崎秀实`,
    useBabyCry: false,
    titleDuration: 10, // 全局标题显示时长（秒），不设置则贯穿整个视频
    endTitle: "尾崎秀实:\n中日应\n超越政治对立\n共同反对帝国主义压迫", // 结尾标题
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
    sectionFirstTitleTime: 2,
    sectionTitle: [
      "尾崎秀实在被捕前\n撕毁所有重要文件",
      "1901年/0岁 \n 东京宅院·新生 \n 婴儿安睡于传统日式襁褓",
      "1919年/18岁 \n 东京帝大校园·思索 \n 银杏树下阅读社会科学著作",
      "1928年/27岁 \n 上海码头·初至 \n 手提皮箱眺望外滩建筑群",
      "1930年/29岁 \n 内山书店·交流 \n 与中日文化界人士恳切交谈",
      "1932年/31岁 \n 报社办公室·笔耕 \n 在打字机前撰写时事评论",
      "1934年/33岁 \n 东京书房·深耕 \n 伏案写作《暴风雨中的中国》书稿",
      "1937年/36岁 \n 首相官邸·智囊 \n 以顾问身份参与政策研讨",
      "1939年/38岁 \n 会议室·洞察 \n 分析中国抗战形势图表",
      "1941年/40岁 \n 书房密谈·传递 \n 将重要情报交予联络人员",
      "1941年/40岁 \n 被捕时刻·从容 \n 在书斋平静面对突如其来的搜查",
      "1943年/42岁 \n 狱中书写·坚守 \n 借铁窗微光撰写申诉材料",
      "1944年/43岁 \n 囚室遥望·坚定 \n 凝视窗外飞鸟保持信念",
      "1944年/43岁 \n 最后时刻·平静 \n 整理衣着保持尊严与体面",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/国际歌.mp3",
    // 栀子花开_start25s_clip
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "output/clip-video/1_0s-2s_clipped.mp4",
      "https://v26-artist.vlabvod.com/c7077590eaed4ba8babbb300e9da4f3e/68f4654e/video/tos/cn/tos-cn-v-148450/ogL1GeLbOIfGRvUgNBRALCsWgpDlk4usfBN0Tn/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5982&bt=5982&cs=0&ds=12&ft=5QYTUxhhe6BMyqEKKLkJD12Nzj&mime_type=video_mp4&qs=0&rc=NzU5aWRoZ2Q4ZmhoZDZpaUBpajttcGw5cnVsNjczNDM7M0BeMzBhYzQzNV4xYGE2MC4uYSMya2xtMmRjZmlhLS1kNDBzcw%3D%3D&btag=c0000e00018000&dy_q=1760242342&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=202510121212227B4F079AE444749AF416",
      "https://v9-artist.vlabvod.com/19117271f82b7251678326c45b730de5/68f46557/video/tos/cn/tos-cn-v-148450/oUorIrbHSDEqegyOAK6BfFr5qACyvECqBy6qYQ/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=6053&bt=6053&cs=0&ds=12&ft=5QYTUxhhe6BMyq4UKLkJD12Nzj&mime_type=video_mp4&qs=0&rc=Z2doZGllNmk3aGY4ZGQzOEBpM3VvanY5cmVsNjczNDM7M0BfNmNeLi5jXy4xYDQuXzNfYSMtcF5uMmRzaWlhLS1kNC9zcw%3D%3D&btag=c0000e00010000&dy_q=1760242371&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=202510121212513976A667DEF80AC2046D",
    ],
    // 方式一：统一转场效果（原有方式，向后兼容）
    // switch: "无转场", // 所有视频之间使用相同的转场效果

    // 方式二：分别设置转场效果（新功能）
    transitions: [
      "时光流转", // 视频1 → 视频2 的转场效果
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
