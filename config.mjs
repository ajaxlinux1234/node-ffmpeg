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
    url: "output/merge-video/merged_1767688518061_replaced.mp4",
    title: `华夏五千年|十大美女盘点`,
    titleLineBreak: "|", // history-person 标题使用 | 作为换行符
    useBabyCry: false,

    // 字体配置系统
    globalFontConfig: [
      // 全局字体配置，应用于所有分镜的对应行
      {
        style: { color: "white", fontSize: "60px", fontWeight: "bold" },
        font: "KaiTi",
      },
      {
        style: { color: "yellow", fontSize: "40px", fontWeight: "normal" },
        font: "KaiTi",
      },
      {
        style: { color: "black", fontSize: "40px", fontWeight: "normal" },
        font: "KaiTi",
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
    titleAnimation: "ghost", // 可选值: "flash", "fade", "scale", "slide", "none", "sweep_fast", "sweep_slow", "sweep_pulse", "sweep_rainbow", "sweep_wave", "sweep_laser", "sweep_glow", "sweep_neon", "sweep_electric", "sweep_diamond"
    sectionTitleAnimation: "none", // 分镜字幕动画效果，可选值同titleAnimation

    // 视频质量配置
    qualityMode: "turbo", // 可选值: "high"(高质量,接近无损), "balanced"(平衡), "fast"(快速处理), "turbo"(极速处理)

    // 性能优化配置
    enableSpeedOptimization: true, // 启用速度优化：多线程+预设优化
    skipTempCleanup: false, // 跳过临时文件清理以节省时间
    sectionFirstTitleTime: 5,
    sectionTitleInterval: 11, // 分镜字幕间隔时间（秒）
    sectionLastTitleOffset: 5, // 最后一个分镜提前显示时间（秒）
    sectionTitle: [
      "西施\n公元前489年\n春秋越国若耶溪畔",
      "王昭君\n公元前33年\n汉匈和亲北行马车中",
      "赵飞燕\n公元前18年\n西汉皇宫水晶盘上",
      "貂蝉\n公元192年\n东汉司徒府后花园月下",
      "甄宓\n公元204年\n三国魏洛水之畔",
      "冯小怜\n公元570年\n北齐宫廷",
      "杨玉环\n公元744年\n唐代华清宫温泉花苑",
      "周娥皇\n公元965年\n南唐宫廷内",
      "李师师\n公元1110年\n北宋汴京樊楼雅间",
      "陈圆圆\n公元1644年\n明末清初江南庭园",
    ],
    watermark: "@人物传记史",
    "bg-music": "music/美人吟_start12s_clip.mp3",
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
      "https://v16-cc.capcut.com/8d971fbd082074e7138e60f9f3a981c5/6965d55a/video/tos/alisg/tos-alisg-ve-14178-sg/ocEJL3I59ihWb9D8Bgf8FENQgGQ51PenBIXpA2/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12552&bt=6276&cs=0&ft=GAAO2Inz7Th4NVDPXq8Zmo&mime_type=video_mp4&qs=0&rc=ZjY4NTZpOTY6ZzRlaGc7OkBpM3ZxNXg5cjw7ODYzODU6NEBjYTExYV5iX2MxXzExLzQ0YSNzcGxlMmRzMGJhLS1kMy1zcw%3D%3D&vvpl=1&l=20260106131704B8A095033FBD9C3C21CB&btag=e000b0000",
      "https://v16-cc.capcut.com/10692d88c548dddf78a4384b2a61bc59/6965d374/video/tos/alisg/tos-alisg-ve-14178-sg/o4s0rQBTIAAiHB33f7GwEgviXkcvwHKxOjPEom/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12584&bt=6292&cs=0&ft=GAAO2Inz7Thp_VDPXq8Zmo&mime_type=video_mp4&qs=0&rc=PGQ2PDY6NTtlNDY5ODUzPEBpamR3dXE5cnE8ODYzODU6NEBgLl41Mi9fNTUxYDVfXzBiYSMwMy80MmRzZWJhLS1kMy1zcw%3D%3D&vvpl=1&l=202601061308586EF4FCC1770D9E21A084&btag=e000b0000",
      "https://v16-cc.capcut.com/bef1d2c792ed3f14c38a4b131459abea/6965d493/video/tos/alisg/tos-alisg-ve-14178-sg/oYETbBEcsJqexKD6CAfgFVbgQPIDgHdeDTuSms/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12638&bt=6319&cs=0&ft=GAAO2Inz7ThvbVDPXq8Zmo&mime_type=video_mp4&qs=0&rc=OzYzZWlmPGczM2Y6NjM1OUBpMzZpaXA5cnk8ODYzODU6NEBfNmM2Y14xX2MxYjNhYzU2YSNkaGcyMmRrZ2JhLS1kMy1zcw%3D%3D&vvpl=1&l=20260106131345233F6402BCD7402B5F3D&btag=e000b0000",
      "https://v16-cc.capcut.com/3eceab78c93a2d7e347362c9a7e1fb5b/6965d716/video/tos/alisg/tos-alisg-ve-14178-sg/ogPcgexIGDiSLXrsF5IOTeQRuCgIfE9AIFTikb/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12566&bt=6283&cs=0&ft=GAAO2Inz7ThcpVDPXq8Zmo&mime_type=video_mp4&qs=0&rc=OTpmMzQ5NzQ0ODM4ZDo7aEBpM3Jxc2w5cjM8ODYzODU6NEA0LWBgMjRgXi4xNS81MC4wYSNlcS80MmRrbWJhLS1kMy1zcw%3D%3D&vvpl=1&l=20260106132428D79E89FC6C2C9E23D9EC&btag=e000b0000",
      "https://v16-cc.capcut.com/753f41a11d1493ed8053efac27860cc2/6965d84a/video/tos/alisg/tos-alisg-ve-14178-sg/oYgeiA24n3BAfGYmbOclUAsbZefYFqAG3zc35F/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12590&bt=6295&cs=0&ft=GAAO2Inz7Th8uVDPXq8Zmo&mime_type=video_mp4&qs=0&rc=Nmc8NTo2PGVoaWlpNWQ7NUBpanJ5bms5cmc8ODYzODU6NEAvLmFgYC5fNTMxYmI1Y2FfYSMycC9sMmRrb2JhLS1kMy1zcw%3D%3D&vvpl=1&l=20260106132936F8A5BED79EB56AC072F0&btag=e000b0000",
      "https://v16-cc.capcut.com/e4eeba219e2a56acfa115f10e6620489/6965df9c/video/tos/alisg/tos-alisg-ve-14178-sg/owkshQgMAX0CrmKX88STDBbtgbyeeuRfU7Jl4o/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=11970&bt=5985&cs=0&ft=GAAO2Inz7ThbOjDPXq8Zmo&mime_type=video_mp4&qs=0&rc=Nzk3ZGhoNzg4NmdkPDllNUBpMzhlcXc5cnFkODYzODU6NEAvLjItLzMwNl4xNWFjYC4xYSNwMnFpMmRjNmJhLS1kMzFzcw%3D%3D&vvpl=1&l=202601061400209451C932A8A53F3AB107&btag=e00088000",
      "https://v16-cc.capcut.com/aa53478312a0aafdd2036cac0b8cddfb/6965e643/video/tos/alisg/tos-alisg-ve-14178-sg/oUi8BOfDQIxDJKp2jqkg5XfKcB7N3EuHFQEzEg/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=13464&bt=6732&cs=0&ft=GAAO2Inz7ThuzjDPXq8Zmo&mime_type=video_mp4&qs=0&rc=aWZpNDNpZmY7PGRkZjtkZkBpM3l2eXI5cmZkODYzODU6NEBjLjE0YTYvX2IxLTQtMTYyYSNkXmRsMmRza2JhLS1kMy1zcw%3D%3D&vvpl=1&l=2026010614291882F3B88A445485314A7B&btag=e000b0000",
    ],
    videoReplaceUrls: [
      {
        index: 0,
        timeRange: [15, 20],
        url: "https://v16-cc.capcut.com/43d3302650b1308d6fef04c5e16187b7/6965ff16/video/tos/alisg/tos-alisg-ve-14178-sg/oYxVcYVKaHw7zQUGENIDAFCviX5EiPdIBQ5iE/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=13596&bt=6798&cs=0&ft=GAAO2Inz7Th-MpDPXq8Zmo&mime_type=video_mp4&qs=0&rc=N2lmOmU6MzppNWgzNGhnaEBpamo0eHM5cnFmODYzODU6NEA0YWIuXjRgNWExLjYtXzI2YSMwLm1wMmQ0NWJhLS1kMy1zcw%3D%3D&vvpl=1&l=202601061615133B22B5314CDDA70E99C9&btag=e000b0000",
      },
      {
        index: 1,
        timeRange: [45, 50],
        url: "https://v16-cc.capcut.com/c4fad36ad0ebce5f787f8dd41e7d91c0/6965ffca/video/tos/alisg/tos-alisg-ve-14178-sg/o4Zo5NJGMQgJAEIpKXFfBBgf2i0bUsQVJID626/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=13622&bt=6811&cs=0&ft=GAAO2Inz7ThQ4pDPXq8Zmo&mime_type=video_mp4&qs=0&rc=NjYzNDtnZDQzM2ZkMzM8Z0BpM3UzZXc5cmhmODYzODU6NEAzMzYvLjI2Nl8xYGMzY2NhYSNfNjEyMmRrXmJhLS1kMy1zcw%3D%3D&vvpl=1&l=202601061618134D37F2EC8E93690F8B15&btag=e000b0000",
      },
      {
        index: 2,
        timeRange: [50, 60],
        url: "https://v16-cc.capcut.com/b5358e161f8d4e79372c74159cd3693c/6965e1d4/video/tos/alisg/tos-alisg-ve-14178-sg/osYKivapBGDjn5cwV0UciQiEdsPv1idIHyRcA/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12590&bt=6295&cs=0&ft=GAAO2Inz7ThNTjDPXq8Zmo&mime_type=video_mp4&qs=0&rc=ZzRnOTc4O2k5Zjw0ZTpkZEBpM2ZtNGo5cmlkODYzODU6NEBiLy4yLS4uXi4xYV9hNTI1YSMyX2dlMmRrYmJhLS1kMy1zcw%3D%3D&vvpl=1&l=20260106141018CC3838F0C1D9364ED076&btag=e000b0000",
      },
      {
        index: 3,
        timeRange: [85, 90],
        url: "https://v16-cc.capcut.com/08b6f7df1c5c6bedb799917d33519cad/6965f24b/video/tos/alisg/tos-alisg-ve-14178-sg/oQp3fbDu5t1D8FTbSiy7eQgsAIJcCWSEEJ5WEe/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=13428&bt=6714&cs=0&ft=GAAO2Inz7ThPnNDPXq8Zmo&mime_type=video_mp4&qs=0&rc=OzNmZzw7NWRpNzo3aDxpNUBpamxxbHY5cmhlODYzODU6NEBjYDU1LzAtNi8xYjVfLy00YSNwcW1sMmRzY2JhLS1kMy1zcw%3D%3D&vvpl=1&l=20260106152038213E31271D33BA067AC1&btag=e000b0000",
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
      const historyNum = 10;
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
            .replaceAll("\n成长于", "")
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
        'div[data-testid="upload_file_panel_upload_item"]'
      ),
    input_selector_fn: () => document.querySelector("textarea"),
    get_promot_fn: () => {
      const historyNum = 10; // 对应seconds数组长度
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
