// =============================================================================
// HISTORY-PERSON CONFIGURATION CONSTANTS - 历史人物视频处理相关的配置参数
// =============================================================================

/**
 * 字幕和布局配置
 */
export const CONFIG_SUBTITLE = {
  FONT_SIZE_TITLE: 50, // 主要字幕字体大小
  FONT_SIZE_COVER: 80, // 封面标题字体大小
  FONT_SIZE_WATERMARK: 20, // 水印字体大小
  FONT_SIZE_GLOBAL_TITLE: 60, // 全局标题字体大小
  CHAR_WIDTH_FACTOR: 0.8, // 字符宽度因子
  TYPEWRITER_SPEED: 0.08, // 打字机效果速度（秒/字符）
  LEFT_MARGIN: 100, // 左边距（px）
  RIGHT_MARGIN: 100, // 右边距（px）
  SAFE_PADDING: 200, // 安全边距（左右边距之和）
  SUBTITLE_POSITION_Y_PERCENT: 0.4, // 字幕Y位置百分比（从下往上）
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

/**
 * 间距和定位配置 - 统一管理所有间距相关参数
 */
export const CONFIG_SPACING = {
  // 全局标题间距配置
  GLOBAL_TITLE_CHAR_SPACING_FACTOR: 1, // 全局标题字符间距因子（相对于字体大小）
  GLOBAL_TITLE_LINE_SPACING: 10, // 全局标题行间距（px）
  GLOBAL_TITLE_MARGIN_LEFT: 180, // 全局标题左边距（px）
  GLOBAL_TITLE_MARGIN_RIGHT: 80, // 全局标题右边距（px）
  GLOBAL_TITLE_POSITION_Y_PERCENT: 0.15, // 全局标题Y位置百分比（从顶部）

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
  DEFAULT_WIDTH: 704, // 默认视频宽度
  DEFAULT_HEIGHT: 1248, // 默认视频高度
  DEFAULT_ASPECT_RATIO: "9:16", // 默认宽高比
  DEFAULT_RESOLUTION: "1080x1920", // 默认分辨率
  DEFAULT_FIT_MODE: "crop", // 默认适应模式
  CRF_VALUE: 18, // 视频质量参数
  PRESET_MEDIUM: "medium", // 编码预设
  AUDIO_BITRATE: "192k", // 音频比特率
  VIDEO_CODEC: "libx264", // 视频编码器
  PIXEL_FORMAT: "yuv420p", // 像素格式
  AUDIO_CODEC_COPY: "copy", // 音频编码（复制）
  AUDIO_CODEC_AAC: "aac", // 音频编码（AAC）
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
  },

  // 默认动画类型
  DEFAULT_ANIMATION: "flash",
};
