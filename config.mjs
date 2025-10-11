import jimengVideoConfig, {
  accountId,
} from "./lib/auto-deepseek-jimeng/jimeng-video-config.mjs";
import jimengConfig from "./lib/auto-deepseek-jimeng/jimeng-config.mjs";
import deepseekConfig from "./lib/auto-deepseek-jimeng/deepseek-config.mjs";

const name = "人民的好局长任长霞打击罪犯的一生";
export default {
  // 全局配置
  cleanOutputHistory: false, // 是否在每次运行命令前清理output历史数据，默认为true
  "down-rm-watermark": {
    url: "https://aigc-idea-platform.cdn.bcebos.com/miaoying_video/shadow_i2v_1280x704_20250925_160634_a024gnii_2X_32fps_generate_metadata.mp4?authorization=bce-auth-v1%2FALTAKpTC4weJ6py821WCyek9FC%2F2025-09-25T08%3A06%3A41Z%2F-1%2F%2F612a44bb17040c579d19ab812adda61a6163d21f5bb02231b32c335a6e958b5b",
    "bg-music": "bg-music.mp3",
  },
  "history-person": {
    name,
    url: "output/merge-video/merged_1760161130084_merged.mp4",
    title: `{{人民的好局长}}\n任长霞\n打击罪犯的一生`,
    useBabyCry: false,
    titleDuration: 15, // 全局标题显示时长（秒），不设置则贯穿整个视频
    endTitle: "任长霞:公安，公安\n心中只有‘公’\n人民才能‘安’。", // 结尾标题
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
      "1983年/20岁 \n 警校训练场·立志 \n 在晨光中练习警体拳",
      "1985年/22岁 \n 派出所户籍室·服务 \n 耐心解答群众疑问",
      "1988年/25岁 \n 刑侦队办公室·钻研 \n 深夜分析案件卷宗",
      "1992年/29岁 \n 案发现场·取证 \n 仔细勘查现场痕迹",
      "1995年/32岁 \n 审讯室·讯问 \n 与犯罪嫌疑人斗智斗勇",
      "1998年/35岁 \n 指挥中心·部署 \n 研究案情制定方案",
      "2001年/38岁 \n 就任仪式·担当 \n 郑重接过工作重任",
      "2002年/39岁 \n 街头接访·倾听 \n 认真记录群众诉求",
      "2003年/40岁 \n 抓捕现场·指挥 \n 部署突击收网行动",
      "2004年/41岁 \n 群众家中·慰问 \n 安抚案件受害家属",
      "2004年/41岁 \n 办公室深夜·操劳 \n 批阅重要案件文件",
      "2004年/41岁 \n 基层视察·指导 \n 检查警务装备情况",
      "2004年/41岁 \n 工作会议·研讨 \n 与同事分析案件进展",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/我记得你眼里的依恋_start22s_clip.mp3",
    // 栀子花开_start25s_clip
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "https://v3-artist.vlabvod.com/6e6a685101c818569d184c4d473efbac/68f323a1/video/tos/cn/tos-cn-v-148450/ocEpcKjENEDfQEpIbCFRk63DAnEQdBzOfe0Ogj/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5981&bt=5981&cs=0&ds=12&ft=5QYTUxhhe6BMyqmIsLkJD12Nzj&mime_type=video_mp4&qs=0&rc=NGRmZTs1ZmZnZjdlNGY6OUBpajd4ams5cnF4NjczNDM7M0A2YTY0YmEtNmAxMGI2LzIuYSNnLWdmMmQ0ZWhhLS1kNC9zcw%3D%3D&btag=c0000e00018000&dy_q=1760159993&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=202510111319522903D055C5A9EA8802F1",
      "https://v6-artist.vlabvod.com/00bd870fc1f156549c705bd8e228d25e/68f3254a/video/tos/cn/tos-cn-v-148450/o8R6qQOeRjB7MSrpCqFEAqDhO0kDul3EI5fQEe/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=6084&bt=6084&cs=0&ds=12&ft=5QYTUxhhe6BMyqaKsLkJD12Nzj&mime_type=video_mp4&qs=0&rc=Z2Q4Ozw3ZGg0PGU3NzY8Z0BpMzxwZG85cjt4NjczNDM7M0A1NC4wY2FjXmExM15hNmE1YSNjZDNiMmRjaWhhLS1kNC9zcw%3D%3D&btag=c0000e00010000&dy_q=1760160438&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=20251011132717B5A0C8265ACF940344FA",
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
      url: "input/clip-audio/我记得你眼里的依恋.mp3",
      start: 22,
    },
  ],
  "auto-deepseek-jimeng": {
    deepseek: deepseekConfig,
    jimeng: jimengConfig,
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
