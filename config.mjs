export default {
  "down-rm-watermark": {
    "url": "https://aigc-idea-platform.cdn.bcebos.com/miaoying_video/shadow_i2v_1280x704_20250925_160634_a024gnii_2X_32fps_generate_metadata.mp4?authorization=bce-auth-v1%2FALTAKpTC4weJ6py821WCyek9FC%2F2025-09-25T08%3A06%3A41Z%2F-1%2F%2F612a44bb17040c579d19ab812adda61a6163d21f5bb02231b32c335a6e958b5b",
    "bg-music": "bg-music.mp3"
  },
  "history-person": {
    "url": "https://v26-artist.vlabvod.com/cfb53ce6ee16c4e02ab042bf6e68dd18/68e11754/video/tos/cn/tos-cn-v-148450/oAgcezWeDRIXmGBDCgGvUkL7ZUerAkdQhyu6IO/?a=4066&ch=0&cr=0&dr=0&er=0&lr=display_watermark_aigc&cd=0%7C0%7C0%7C0&br=5977&bt=5977&cs=0&ds=12&ft=5QYTUxhhe6BMyqBrT3kJD12Nzj&mime_type=video_mp4&qs=0&rc=Nzs4Njk0NDhoNmhkZDk0ZkBpamgzOnE5cjl3NjczNDM7M0AxMi0zMTUxXzIxYDJiMDAzYSMyaG5gMmRjbV9hLS1kNDBzcw%3D%3D&btag=c0000e00018000&dy_q=1758977196&feature_id=7bed9f9dfbb915a044e5d473759ce9df&l=20250927204636F2919C19D2D202D3C407",
    "title": "{{世界喜剧大师}}-卓别林",
    "sectionTitle": [
      "1889年在{{贫民窟}}与{{音乐厅后台}}成长",
      "1914年创造出经典的流浪汉形象",
      "1915年《流浪汉》大获成功,确立喜剧风格",
      "1921年首次执导长片《寻子遇仙记》,将{{笑与泪}}完美融合",
      "1931年在有声片时代坚持拍摄默片杰作",
      "1936年创作其最后一部无声片,深刻批判工业社会对人性的异化",
      "1952年被{{麦卡锡主义}}迫害,离开美国前往瑞士",
      "1972年重返美国接受{{奥斯卡荣誉奖}}",
      "1977年永远的喜剧大师卓别林优雅谢幕"
    ],
    "watermark": "@人物传记史",
    "bg-music": "input/history-person/bg-music.mp3"
  },
  "ai-remove-watermark": {
    "url": "output/history-person/1758868423130_10b9525ce467.mp4",
    "debug": true,
    "mask": {
      "autodetect": "full-text",
      "inpaint_radius": 14,
      "dilate_px": 16,
      "extra_expand_px": 6,
      "extra_regions": [
        { "x": 6, "y": 6, "w": 220, "h": 120 }
      ]
    }
  }
}
