// =============================================================================
// HISTORY-PERSON CONFIGURATION CONSTANTS - 历史人物视频处理相关的配置参数
// =============================================================================

const FONT_MAP = {
  en: {
    FONT_SIZE_TITLE: 20,
    FONT_SIZE_GLOBAL_TITLE: 30,
  },
  zh: {
    FONT_SIZE_TITLE: 40,
    FONT_SIZE_GLOBAL_TITLE: 40,
  },
};

const FONT = FONT_MAP["zh"];
/**
 * 字幕和布局配置
 */
export const CONFIG_SUBTITLE = {
  FONT_SIZE_TITLE: FONT.FONT_SIZE_TITLE, // 主要字幕字体大小
  FONT_SIZE_COVER: 80, // 封面标题字体大小
  FONT_SIZE_WATERMARK: 20, // 水印字体大小
  FONT_SIZE_GLOBAL_TITLE: FONT.FONT_SIZE_GLOBAL_TITLE, // 全局标题字体大小
  FONT_SIZE_END_TITLE: 50, // 结尾标题字体大小
  FONT_SIZE_DISCLAIMER: 30, // 底部免责声明字体大小
  CHAR_WIDTH_FACTOR: 0.7, // 字符宽度因子
  TYPEWRITER_SPEED: 0.08, // 打字机效果速度（秒/字符）
  LEFT_MARGIN: 50, // 左边距（px）
  RIGHT_MARGIN: 50, // 右边距（px）
  SAFE_PADDING: 100, // 安全边距（左右边距之和）
  SUBTITLE_POSITION_Y_PERCENT: 0.35, // 字幕Y位置百分比（从下往上）
  MIN_CHARS_PER_LINE: 3, // 每行最小字符数
  MIN_USABLE_WIDTH: 200, // 最小可用宽度
  FADE_IN_OUT_MS: 50, // 淡入淡出时间（毫秒）
  SCALE_DURATION_MS: 200, // 缩放动画持续时间（毫秒）
  SCALE_END_MS: 400, // 缩放结束时间（毫秒）
  SCALE_X_START: 120, // X缩放起始值
  SCALE_Y_START: 120, // Y缩放起始值
  SCALE_X_END: 100, // X缩放结束值
  SCALE_Y_END: 100, // Y缩放结束值
  SECTION_TITLE_DURATION: 4.8, // 分镜字幕持续时间（秒）
};

/** 左上角水印遮照  */
export const CONFIG_MASK = {
  x: 5,
  y: 10,
  w: 0, // 120
  h: 0, // 60
};

// x: 0,
// y: 20,
// w: 200,
// h: 100,

/**
 * 间距和定位配置 - 统一管理所有间距相关参数
 */
export const CONFIG_SPACING = {
  // 全局标题间距配置
  GLOBAL_TITLE_CHAR_SPACING_FACTOR: 1, // 全局标题字符间距因子（相对于字体大小）
  GLOBAL_TITLE_LINE_SPACING: 10, // 全局标题行间距（px）
  GLOBAL_TITLE_MARGIN_LEFT: 120, // 全局标题左边距（px）
  GLOBAL_TITLE_MARGIN_RIGHT: 80, // 全局标题右边距（px）
  GLOBAL_TITLE_POSITION_Y_PERCENT: 0.12, // 全局标题Y位置百分比（从顶部，约80px，在水印上方）

  // 底部免责声明间距配置
  DISCLAIMER_POSITION_Y_PERCENT: 0.95, // 底部免责声明Y位置百分比（从顶部，0.9表示底部10%位置）
  DISCLAIMER_MARGIN_LEFT: 80, // 底部免责声明左边距（px）
  DISCLAIMER_MARGIN_RIGHT: 80, // 底部免责声明右边距（px）

  // 字幕间距配置
  SUBTITLE_CHAR_SPACING_NORMAL: 5, // 普通字符间距（px）
  SUBTITLE_CHAR_SPACING_DIGIT: 8, // 数字字符间距（px）
  SUBTITLE_CHAR_WIDTH_NORMAL: 0.8, // 普通字符宽度因子
  SUBTITLE_CHAR_WIDTH_DIGIT: 0.5, // 数字字符宽度因子

  // 封面标题间距配置
  COVER_TITLE_MARGIN_TOP: 80, // 封面标题顶部边距（px）

  // 水印间距配置
  WATERMARK_MARGIN: 100, // 水印边距（px）
};

/**
 * 水印动画配置
 */
export const CONFIG_WATERMARK = {
  FONT_SIZE: 20,
  OPACITY_HEX: "&HD0FFFFFF", // 白色半透明
  NO_OUTLINE_COLOR: "&H00000000", // 无描边
  LEFT_BOTTOM_X: 100, // 左下角X位置
  LEFT_BOTTOM_Y_OFFSET: 100, // 左下角Y偏移
  TOP_RIGHT_X_OFFSET: 100, // 右上角X偏移
  TOP_RIGHT_Y: 100, // 右上角Y位置
  MOVEMENT_START_MS: 1000, // 移动开始时间（毫秒）
  STAY_END_MS: 1000, // 停留结束时间（毫秒）
  TRAVEL_DURATION_FACTOR: 2000, // 移动时长因子
  HALF_WAY_FACTOR: 2, // 中点分割因子
  ARC_CENTER_Y_PERCENT: 0.3, // 弧线中点Y百分比
};

/**
 * 视频处理配置
 */
export const CONFIG_VIDEO = {
  DEFAULT_WIDTH: 720, // 默认视频宽度
  DEFAULT_HEIGHT: 1280, // 默认视频高度
  DEFAULT_ASPECT_RATIO: "9:16", // 默认宽高比
  DEFAULT_RESOLUTION: "720x1280", // 默认分辨率
  DEFAULT_FIT_MODE: "crop", // 默认适应模式

  // 高质量编码配置 - 接近无损但文件大小合理
  CRF_VALUE: 15, // 视频质量参数 (降低到15，更高质量)
  CRF_VALUE_HIGH_QUALITY: 12, // 超高质量选项
  CRF_VALUE_BALANCED: 18, // 平衡质量选项（原值）

  // 编码预设配置
  PRESET_SLOW: "slow", // 慢速预设（更好压缩）
  PRESET_MEDIUM: "medium", // 中等预设
  PRESET_FAST: "fast", // 快速预设

  // 比特率控制选项
  MAX_BITRATE: "8000k", // 最大比特率限制
  BUFFER_SIZE: "16000k", // 缓冲区大小

  // 编码器配置
  VIDEO_CODEC: "libx264", // 视频编码器
  VIDEO_CODEC_PROFILE: "high", // H.264 配置文件
  VIDEO_CODEC_LEVEL: "4.1", // H.264 级别
  PIXEL_FORMAT: "yuv420p", // 像素格式

  // 音频配置
  AUDIO_BITRATE: "256k", // 音频比特率（提升到256k）
  AUDIO_CODEC_COPY: "copy", // 音频编码（复制）
  AUDIO_CODEC_AAC: "aac", // 音频编码（AAC）

  // 质量优化参数
  TUNE_OPTION: "film", // 调优选项，适合电影内容
  MOTION_ESTIMATION: "umh", // 运动估计算法
  SUBPIXEL_REFINEMENT: 8, // 亚像素细化
  REFERENCE_FRAMES: 5, // 参考帧数量
};

/**
 * 音频音量配置
 */
export const CONFIG_AUDIO_VOLUME = {
  // 背景音乐音量配置
  BACKGROUND_MUSIC_VOLUME: 1.2, // 背景音乐音量（0.0-2.0）- 调整：提高到1.2保持较强音量

  // 配音音量配置
  VOICE_CLIP_VOLUME: 2.0, // 片段配音音量（0.0-2.0）- 修复：从5.0降低到1.2

  // 原视频音频音量配置
  ORIGINAL_AUDIO_VOLUME_WITH_BG: 1.0, // 有背景音乐时原音频音量 - 适度降低为背景音乐让路
  ORIGINAL_AUDIO_VOLUME_SOLO: 1.0, // 无背景音乐时原音频音量

  // 特殊音效音量配置
  TYPEWRITER_SOUND_VOLUME: 1.5, // 打字机音效音量 - 从2.0降低到1.5
  BABY_CRY_VOLUME: 0.8, // 婴儿哭声音量
};

/**
 * 文件路径配置
 */
export const CONFIG_PATHS = {
  INPUT_DIR: "input/history-person",
  OUTPUT_DIR: "output/history-person",
  HASH_LENGTH: 12, // URL哈希长度
  PROCESSED_SUFFIX: "_processed", // 处理后缀
  TITLES_TEMP_SUFFIX: "_with_titles_temp", // 标题临时后缀
  THUMBNAIL_SUFFIX: "_title.png", // 缩略图后缀
  ASS_SUFFIX: ".ass", // ASS字幕文件后缀
};

/**
 * 清理配置
 */
export const CONFIG_CLEANUP = {
  OLD_FINAL_PATTERN: "_final_",
  VERIFY_PATTERN: "verify_",
  TEST_PATTERN: "test_",
  PROCESSED_KEEP_PATTERN: "_processed",
};

/**
 * 定格帧动画配置
 */
export const CONFIG_FREEZE_FRAME_ANIMATION = {
  // 动画类型
  TYPES: {
    NONE: "none", // 无动画
    ZOOM_IN: "zoom_in", // 从小到大放大
    ZOOM_OUT: "zoom_out", // 从大到小缩小
    FADE_IN: "fade_in", // 淡入
    SLIDE_UP: "slide_up", // 从下往上滑入
    SLIDE_DOWN: "slide_down", // 从上往下滑入
    ROTATE: "rotate", // 旋转
    PULSE: "pulse", // 脉冲（放大缩小循环）
    SHAKE: "shake", // 震动
    BLUR_IN: "blur_in", // 从模糊到清晰
  },
  
  // 默认动画
  DEFAULT: "zoom_in",
};

/**
 * 全局标题动画配置
 */
export const CONFIG_TITLE_ANIMATION = {
  // 闪光动画配置
  FLASH_CYCLE_DURATION: 4000, // 闪光循环时长（毫秒）
  FLASH_BRIGHT_DURATION: 800, // 闪光亮起时长（毫秒）
  FLASH_FADE_IN: 300, // 闪光淡入时间（毫秒）
  FLASH_FADE_OUT: 300, // 闪光淡出时间（毫秒）

  // 扫光动画配置
  SWEEP_CYCLE_DURATION: 3000, // 扫光循环时长（毫秒）
  SWEEP_LIGHT_DURATION: 500, // 扫光亮起时长（毫秒）
  SWEEP_FADE_DURATION: 200, // 扫光淡入淡出时长（毫秒）

  // 动画类型
  ANIMATION_TYPES: {
    FLASH: "flash", // 闪光扫过效果（原有）
    FADE: "fade", // 淡入淡出效果
    SCALE: "scale", // 缩放效果
    SLIDE: "slide", // 滑动效果
    NONE: "none", // 无动画

    // 扫光动画系列
    SWEEP_FAST: "sweep_fast", // 快速扫光（2秒循环）
    SWEEP_SLOW: "sweep_slow", // 慢速扫光（5秒循环）
    SWEEP_PULSE: "sweep_pulse", // 脉冲扫光（带呼吸效果）
    SWEEP_RAINBOW: "sweep_rainbow", // 彩虹扫光（颜色变化）
    SWEEP_WAVE: "sweep_wave", // 波浪扫光（渐变效果）
    SWEEP_LASER: "sweep_laser", // 激光扫光（细线扫过）
    SWEEP_GLOW: "sweep_glow", // 辉光扫光（发光效果）
    SWEEP_NEON: "sweep_neon", // 霓虹扫光（霓虹灯效果）
    SWEEP_ELECTRIC: "sweep_electric", // 电光扫光（闪电效果）
    SWEEP_DIAMOND: "sweep_diamond", // 钻石扫光（闪亮效果）

    // 高级动画系列
    ROTATE: "rotate", // 旋转动画（3D旋转）
    BOUNCE: "bounce", // 弹跳动画（上下弹跳）
    BREATH: "breath", // 呼吸动画（缩放呼吸）
    SHAKE: "shake", // 震动动画（快速抖动）
    LIQUID: "liquid", // 液态动画（流动变形）
    FIRE: "fire", // 火焰动画（燃烧效果）
    TYPEWRITER: "typewriter", // 打字机效果（逐字显示）
    FREEZE: "freeze", // 冰冻动画（结冰效果）
    EXPLODE: "explode", // 爆炸动画（扩散效果）
    HEARTBEAT: "heartbeat", // 心跳动画（跳动效果）
    STAR: "star", // 星光动画（闪烁星星）
    RIPPLE: "ripple", // 波纹动画（水波纹）
    GHOST: "ghost", // 幽灵动画（飘动效果）
  },

  // 默认动画类型
  DEFAULT_ANIMATION: "flash",
};
