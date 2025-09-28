export default {
  "down-rm-watermark": {
    url: "https://aigc-idea-platform.cdn.bcebos.com/miaoying_video/shadow_i2v_1280x704_20250925_160634_a024gnii_2X_32fps_generate_metadata.mp4?authorization=bce-auth-v1%2FALTAKpTC4weJ6py821WCyek9FC%2F2025-09-25T08%3A06%3A41Z%2F-1%2F%2F612a44bb17040c579d19ab812adda61a6163d21f5bb02231b32c335a6e958b5b",
    "bg-music": "bg-music.mp3",
  },
  "history-person": {
    url: "input/history-person/康熙大帝.mp4",
    title: "{{千古一帝}}-康熙",
    titleAnimation: "sweep_slow", // 可选值: "flash", "fade", "scale", "slide", "none", "sweep_fast", "sweep_slow", "sweep_pulse", "sweep_rainbow", "sweep_wave", "sweep_laser", "sweep_glow", "sweep_neon", "sweep_electric", "sweep_diamond"
    sectionTitleAnimation: "fade", // 分镜字幕动画效果，可选值同titleAnimation
    sectionTitle: [
      "1654年\n北京紫禁城\n幼年登基",
      "1661年\n孝庄太皇太后指导下\n学习为君之道",
      "1669年\n以摔跤少年\n智擒权臣鳌拜",
      "1684年\n亲临{{黄河堤坝}}\n视察水利工程",
      "1696年\n御驾亲征\n奠定{{漠北}}胜局",
      "1712年\n推行{{仁政}}\n减轻百姓负担",
      "1722年\n去世\n精神与功业永垂史册",
    ],
    watermark: "@人物传记史",
    "bg-music": "input/history-person/bg-music.mp3",
  },
  "merge-video": {
    urls: [
      // 示例：可以混合使用本地路径和远程URL
      // "input/merge-video/video1.mp4",
      // "input/merge-video/video2.mp4",
      // "https://example.com/video3.mp4"
    ],
    switch: "叠化", // 支持：叠化、淡入淡出、推拉、擦除、无转场
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
};
