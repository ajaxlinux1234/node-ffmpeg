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
    name: "NBA历史三分王, NBA4冠王, 斯蒂芬.库里的人生经历",
    url: "output/merge-video/merged_1767264850986_replaced.mp4",
    title: `一百一十米栏{{奥运冠军}}|{{世界纪录}}保持者|中国田径{{里程碑}}|中国飞人{{刘翔}}的人生经历`,
    titleLineBreak: "|", // history-person 标题使用 | 作为换行符
    useBabyCry: false,

    // 字体配置系统
    globalFontConfig: [
      // 全局字体配置，应用于所有分镜的对应行
      {
        style: { color: "white", fontSize: "60px", fontWeight: "bold" },
        font: "楷体",
      },
      {
        style: { color: "yellow", fontSize: "40px", fontWeight: "normal" },
        font: "楷体",
      },
    ],

    // 全局标题字体配置，应用于顶部全局标题的每一行
    // titleFontConfig: [
    //   // 第一行：红色大字体粗体
    //   {
    //     style: { color: "white", fontSize: "45px", fontWeight: "bold" },
    //     font: "微软雅黑",
    //   },
    //   // 第二行：蓝色中等字体正常
    //   {
    //     style: { color: "blue", fontSize: "40px", fontWeight: "normal" },
    //     font: "微软雅黑",
    //   },
    //   // 第三行：黄色小字体粗体
    //   {
    //     style: { color: "yellow", fontSize: "35px", fontWeight: "bold" },
    //     font: "微软雅黑",
    //   },
    // ],

    // 分镜字体配置会从 processed_data.json 自动加载
    // 每个分镜可以有自己的 fontConfig 数组，覆盖 globalFontConfig
    // 如果分镜的行数超过 fontConfig 数组长度，剩余行使用最后一个 fontConfig

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
    endTitleDuration: 2, // 结尾标题显示时长（秒）- 延长打字机音效时间
    endTitleAnimation: "typewriter", // 结尾标题动画效果：打字机效果
    endTitleSound: "typewriter", // 结尾标题声音效果：打字机声音
    disclaimerText: "", // 底部免责声明文字（30px斜体，底部10%位置）
    // 快乐传递者何炅
    // 国士无双袁隆平
    titleAnimation: "sweep_slow", // 可选值: "flash", "fade", "scale", "slide", "none", "sweep_fast", "sweep_slow", "sweep_pulse", "sweep_rainbow", "sweep_wave", "sweep_laser", "sweep_glow", "sweep_neon", "sweep_electric", "sweep_diamond"
    sectionTitleAnimation: "none", // 分镜字幕动画效果，可选值同titleAnimation

    // 视频质量配置
    qualityMode: "high", // 可选值: "high"(高质量,接近无损), "balanced"(平衡), "fast"(快速处理), "turbo"(极速处理)

    // 性能优化配置
    enableSpeedOptimization: true, // 启用速度优化：多线程+预设优化
    skipTempCleanup: false, // 跳过临时文件清理以节省时间
    sectionFirstTitleTime: 4,
    sectionTitleInterval: 6, // 分镜字幕间隔时间（秒）
    sectionTitle: [
      "1983年\n上海家中\n出生于上海一个普通家庭",
      "1993年/10岁\n{{上海普陀少体校}}操场\n与跨栏项目结缘\n天赋初显",
      "1999年/16岁\n上海专业田径训练场\n进入专业队\n开始系统严格的训练",
      "2002年/19岁\n釜山亚运会田径场\n赢得{{首枚}}重要洲际赛事金牌\n崭露头角",
      "2004年/21岁\n雅典奥林匹克体育场\n以{{12秒91}}平世界纪录的成绩\n夺得{{奥运金牌}}\n创造{{亚洲历史}}\n达到生涯第一个巅峰",
      "2006年/23岁\n瑞士洛桑田径场\n以{{12秒88}}\n打破沉睡{{13年}}的世界纪录\n确立统治地位",
      "2007年/24岁\n日本大阪长居体育场\n克服第九道不利道次夺冠\n集{{奥运}}冠军\n{{世锦赛}}冠军\n{{世界纪录}}保持者于一身\n实现{{“大满贯”}}",
      "2008年/25岁\n鸟巢\n因右脚跟腱伤复发\n在亿万国人瞩目下于赛前退赛\n经历人生巨大转折",
      "2012年/29岁\n伦敦奥运会体育场\n预赛中攻第一个栏时跟腱断裂\n坚持单脚跳完全程并亲吻栏架\n以悲壮方式告别奥运",
      "2015年/32岁\n上海退役发布会\n正式宣布结束职业生涯\n深情告别赛道",
      "2015年至今/32岁后\n日常生活场景\n退役后回归家庭与个人生活\n从事体育推广等工作\n享受平静\n完成从“飞人”到普通人的转身",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/中国人.mp3",
    // output/clip-audio/抗美援朝_start36s_53s.mp3
    // Go West-Fancy
    // 美人吟_start12s_clip.mp3
    // 西方神话_start2s_clip
    // 栀子花开_start25s_clip
    // 国际歌
    // 国际歌_start5.2s_clip
    // 民国_start5s_clip
    // 屠洪刚 - 精忠报国_start25s_clip
  },
  "merge-video": {
    urls: [
      "https://v16-cc.capcut.com/3d50674bae1243cccf895bfee4c86c6c/695f7d61/video/tos/alisg/tos-alisg-ve-14178-sg/ogJpIBdHNtiIugrpukUFEKPVQBBfCeTWZgDQ2S/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=11908&bt=5954&cs=0&ft=GAAO2Inz7ThfvRaPXq8Zmo&mime_type=video_mp4&qs=0&rc=NTg0NmY3Mzc1ZTQ6Zjc4N0BpanFoanA5cjo3ODYzODU6NEAtNWEvNWJfXzIxYy5fYC9gYSNfYzFoMmRjMl9hLS1kMzFzcw%3D%3D&vvpl=1&l=202601011747356B28340E09AEBE668F37&btag=e00088000",
      "https://v16-cc.capcut.com/f8d2df716988a944180a4680f63f891a/695f7ed3/video/tos/alisg/tos-alisg-ve-14178-sg/osbDgHJswGSIeCEahaGIfQlUgriTIhLA9fKsMs/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12220&bt=6110&cs=0&ft=GAAO2Inz7ThlIRaPXq8Zmo&mime_type=video_mp4&qs=0&rc=Ojs1OjY2ZTtnODY1OTU6N0BpMzdkdHI5cmY3ODYzODU6NEAvMzMzYDIvXjAxMy40YjBjYSNnc2w1MmRrNV9hLS1kMy1zcw%3D%3D&vvpl=1&l=20260101175408E759E8866BCAC45F8C73&btag=e000b8000",
    ],
    videoReplaceUrls: [
      {
        index: 0,
        timeRange: [0, 6],
        url: "https://v16-cc.capcut.com/ae706e15f2622d6b03eaec1da6a723db/695f87e0/video/tos/alisg/tos-alisg-ve-14178-sg/o0bpAP1gJNuvgJwfgQF6VmQDPfnnIrkEB2BasI/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=13128&bt=6564&cs=0&ft=GAAO2Inz7ThxJRaPXq8Zmo&mime_type=video_mp4&qs=0&rc=aGQ3aTs6NmQ7OzllaDc3aEBpam0zdnE5cm03ODYzODU6NEBfMS5hMTMuNmExNF9fMWNfYSNyNXJqMmRzbl9hLS1kMy1zcw%3D%3D&vvpl=1&l=20260101183258A5F67967CBD82484B1E8&btag=e000b0000",
      },
      {
        index: 1,
        timeRange: [6, 12],
        url: "https://v16-cc.capcut.com/7a66cba2f520f61992b182734ca117a2/695f8819/video/tos/alisg/tos-alisg-ve-14178-sg/oYTVWYG1a9VpZOUYFKRDAJkXih6NivdIBQxiE/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=14046&bt=7023&cs=0&ft=GAAO2Inz7Th~ERaPXq8Zmo&mime_type=video_mp4&qs=0&rc=Z2kzPGU5OzllOTlnODU4PEBpam83ZGs5cjQ3ODYzODU6NEAwXzUxYzI1Xi4xLy5eLi82YSNycF5xMmRrb19hLS1kMy1zcw%3D%3D&vvpl=1&l=2026010118335556F5B3B5CC81586A7144&btag=e000b0000",
      },
      {
        index: 2,
        timeRange: [12, 18],
        url: "https://v16-cc.capcut.com/456fecdba23fefdc883bc6c2a53d3389/695f858c/video/tos/alisg/tos-alisg-ve-14178-sg/ok7rQQ8i3DNwShJCekFjBJpg52dgCBMVIzfuWE/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=13456&bt=6728&cs=0&ft=GAAO2Inz7ThP7RaPXq8Zmo&mime_type=video_mp4&qs=0&rc=Z2U5OzpmZDo0NmU6aTNpO0BpMzQ5bms5cnc3ODYzODU6NEA1Xy5iYTUuNWIxXjFhMmA2YSNjcTRsMmRzaV9hLS1kMy1zcw%3D%3D&vvpl=1&l=20260101182302C463719AE186113AA003&btag=e000b0000",
      },
      {
        index: 3,
        timeRange: [48, 54],
        url: "https://v16-cc.capcut.com/4abf499272cb04a047ae7bf8c5ec650c/695f810a/video/tos/alisg/tos-alisg-ve-14178-sg/oEV0BpMxEG68QEQhwIiKqRoB9f4GqoyiA7AlWE/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=13274&bt=6637&cs=0&ft=GAAO2Inz7ThjRRaPXq8Zmo&mime_type=video_mp4&qs=0&rc=Zjc5NjM4ZWRoPDZmOTw8OkBpMzk5eHY5cng3ODYzODU6NEAxMDQ1LTI0X14xXzQxMC1gYSMyaDNeMmRzYF9hLS1kMy1zcw%3D%3D&vvpl=1&l=20260101180348C4F1B5F8251B7B7174C9&btag=e000b0000",
      },
    ],
    useCacheVideo: true,
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
      url: "music/中国人.mp3",
      start: 72,
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
    videoPath: "input/get-promot-image-by-video/20251220-曼德拉.mp4", // 输入视频路径
    videoName: "20251220-曼德拉", // 视频名称，用于创建输出目录
    useMoveVideo: true, // 是否从 E:/chromeDownload 移动最新的"人物传记史"开头的视频（配合 --name 参数使用）
    useAutoSeconds: false, // 是否自动计算时间点（true: 自动，false: 使用手动配置的seconds）
    directDownload: false, // 直接下载模式：true时跳过视频帧提取，直接打开页面执行get_title_selector_fn生成processed_data.json
    seconds: [0, 6.5, 12.5, 18.5, 24.5, 30.5, 37.5, 44.5, 50, 56.5, 62.5], // 提取视频帧的时间点（秒），useAutoSeconds为false时使用
    // [1, 5.5, 13, 18, 24.5, 30.5, 37, 44, 50.5, 56.5, 62.5]
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
        .filter((one) => /^\d/.test(one.innerText))
        .slice(-historyNum)
        .map((one) =>
          one.innerText
            .replaceAll(/\s+/g, "")
            .replaceAll("|", "\n")
            .replaceAll("\n无", "")
            .replaceAll("/0岁", "")
            .replaceAll("\n开启人生历程", "")
            .replaceAll("\n成长于", ""),
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
    defaultPrompt: "", // 默认提示词，当无法获取AI生成的提示词时使用此默认值填充 processed_data.json 的 prompt 字段
    waitTime: 60000, // 登录等待时间（毫秒）
    pageLoadWaitTime: 3000, // 页面加载后等待时间（毫秒）
    uploadWaitTime: 8000, // 上传图片后等待时间（毫秒）
    sendWaitTime: 20000, // 发送后等待AI回复时间（毫秒）
    generateWaitTime: 30000, // 图片生成等待时间（毫秒）
    stepTimeout: 60, // 每步骤用户确认超时时间（秒）
    removeTextPrompt:
      "去除这张图片中的所有位置上所有颜色的文字，去除左边半透明水印", // 去文字提示词
    // getTitlePrompt: `按照"人物名称/国籍/年份|事情1|事情2"的格式识别输出图片中间的文本内容，并输出文本内容`,
    // getTitlePrompt: `按照"年份/年龄|事情1|事情2"的格式识别输出图片中间的文本内容`,
    getTitlePrompt: `按照"年份/年龄|事情1|事情2"的格式识别输出图片中间的文本内容`,
    getPromotPrompt: `图片生成提示词反推，不要画面文字，提示词要有画面色彩搭配`,

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
    input: "outputUtils/20251212-卡斯特罗.mp4", // 输入视频路径
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

    quality: "original", // 视频质量: original/lossless (接近无损), high (高质量), medium (中等), low (低质量)
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
