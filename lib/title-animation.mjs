// =============================================================================
// TITLE ANIMATION CLASS - 全局标题动画处理类
// =============================================================================

import { CONFIG_SUBTITLE, CONFIG_SPACING, CONFIG_TITLE_ANIMATION } from './history-person-constants.mjs';

/**
 * 全局标题动画处理类
 */
export class TitleAnimation {
  constructor() {
    this.animationType = CONFIG_TITLE_ANIMATION.DEFAULT_ANIMATION;
  }

  /**
   * 设置动画类型
   * @param {string} type - 动画类型
   */
  setAnimationType(type) {
    if (Object.values(CONFIG_TITLE_ANIMATION.ANIMATION_TYPES).includes(type)) {
      this.animationType = type;
    } else {
      console.warn(`[警告] 未知的动画类型: ${type}，使用默认动画类型: ${CONFIG_TITLE_ANIMATION.DEFAULT_ANIMATION}`);
      this.animationType = CONFIG_TITLE_ANIMATION.DEFAULT_ANIMATION;
    }
  }

  /**
   * 解析关键词语法，返回字符数组，每个字符包含内容和样式信息
   * @param {string} text - 包含关键词标记的文本
   * @returns {Array} 解析后的字符数组
   */
  parseKeywords(text) {
    const result = [];
    let i = 0;

    while (i < text.length) {
      if (text.substring(i, i + 2) === "{{") {
        // 找到关键词开始
        const keywordStart = i + 2;
        const keywordEnd = text.indexOf("}}", keywordStart);

        if (keywordEnd !== -1) {
          // 找到完整的关键词
          const keyword = text.substring(keywordStart, keywordEnd);
          for (const char of keyword) {
            result.push({ char, isKeyword: true });
          }
          i = keywordEnd + 2;
        } else {
          // 没有找到结束标记，当作普通字符处理
          result.push({ char: text[i], isKeyword: false });
          i++;
        }
      } else {
        // 普通字符
        result.push({ char: text[i], isKeyword: false });
        i++;
      }
    }

    return result;
  }

  /**
   * 移除关键词标记符号，返回纯净的显示文本
   * @param {string} text - 包含关键词标记的文本
   * @returns {string} 清理后的文本
   */
  removeKeywordMarkers(text) {
    return text.replace(/\{\{([^}]+)\}\}/g, "$1");
  }

  /**
   * 生成闪光动画效果
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 闪光动画效果字符串
   */
  generateFlashAnimation(charX, charY, duration, videoWidth) {
    const flashCycleDuration = CONFIG_TITLE_ANIMATION.FLASH_CYCLE_DURATION;
    const flashStartDelay = (charX / videoWidth) * flashCycleDuration;

    let flashEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / flashCycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * flashCycleDuration;
      const cycleEnd = (cycle + 1) * flashCycleDuration;
      const actualEnd = Math.min(cycleEnd, totalDuration);

      const cycleFlashStartDelay = cycleStart + flashStartDelay;
      const brightEnd = cycleFlashStartDelay + CONFIG_TITLE_ANIMATION.FLASH_BRIGHT_DURATION;
      const cycleEndTime = Math.min(cycleStart + flashCycleDuration, totalDuration);

      if (cycleFlashStartDelay < totalDuration) {
        flashEffect += `\\t(${cycleFlashStartDelay},${brightEnd},\\1a&HFF&\\3a&HFF&\\bord0)\\t(${brightEnd},${cycleEndTime},\\1a&H80&\\3a&H80&\\bord4)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(${CONFIG_TITLE_ANIMATION.FLASH_FADE_IN},${CONFIG_TITLE_ANIMATION.FLASH_FADE_OUT})${flashEffect}}`;
  }

  /**
   * 生成淡入淡出动画效果
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @returns {string} 淡入淡出动画效果字符串
   */
  generateFadeAnimation(charX, charY, duration) {
    const fadeInDuration = Math.min(2000, duration * 1000 * 0.1); // 淡入时间为视频时长的10%，最多2秒
    const fadeOutDuration = Math.min(2000, duration * 1000 * 0.1); // 淡出时间为视频时长的10%，最多2秒
    
    return `{\\pos(${charX},${charY})\\fad(${fadeInDuration},${fadeOutDuration})}`;
  }

  /**
   * 生成缩放动画效果
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @returns {string} 缩放动画效果字符串
   */
  generateScaleAnimation(charX, charY, duration) {
    const scaleInDuration = 500; // 缩放进入时间
    const scaleOutStart = Math.max(0, duration * 1000 - 500); // 缩放退出开始时间
    
    return `{\\pos(${charX},${charY})\\t(0,${scaleInDuration},\\fscx120\\fscy120)\\t(${scaleInDuration},1000,\\fscx100\\fscy100)\\t(${scaleOutStart},${duration * 1000},\\fscx80\\fscy80)}`;
  }

  /**
   * 生成滑动动画效果
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 滑动动画效果字符串
   */
  generateSlideAnimation(charX, charY, duration, videoWidth) {
    const slideInDuration = 1000; // 滑入时间
    const startX = -100; // 从左侧屏幕外开始
    
    return `{\\move(${startX},${charY},${charX},${charY},0,${slideInDuration})\\fad(200,200)}`;
  }

  /**
   * 生成无动画效果
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @returns {string} 无动画效果字符串
   */
  generateNoAnimation(charX, charY) {
    return `{\\pos(${charX},${charY})}`;
  }

  /**
   * 根据动画类型生成对应的动画效果
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 动画效果字符串
   */
  generateAnimation(charX, charY, duration, videoWidth) {
    switch (this.animationType) {
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.FLASH:
        return this.generateFlashAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.FADE:
        return this.generateFadeAnimation(charX, charY, duration);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SCALE:
        return this.generateScaleAnimation(charX, charY, duration);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SLIDE:
        return this.generateSlideAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.NONE:
        return this.generateNoAnimation(charX, charY);
      default:
        console.warn(`[警告] 未实现的动画类型: ${this.animationType}，使用闪光动画`);
        return this.generateFlashAnimation(charX, charY, duration, videoWidth);
    }
  }

  /**
   * 生成全局标题的ASS字幕内容
   * @param {string} topTitle - 标题文本
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @param {number} videoHeight - 视频高度
   * @param {Function} wrapCJK - 文本换行函数
   * @param {Function} toAssTime - 时间格式化函数
   * @returns {string} ASS字幕内容
   */
  generateGlobalTitleASS(topTitle, duration, videoWidth, videoHeight, wrapCJK, toAssTime) {
    let ass = "";

    // 解析关键词并生成带颜色的标题
    const parsedTopTitleChars = this.parseKeywords(topTitle);
    const wrappedTopTitle = wrapCJK(topTitle);
    const topTitleText = wrappedTopTitle.replace(/\\N/g, "\n");
    const topTitleLines = topTitleText.split("\n");

    // 顶部标题位置：使用配置的Y位置百分比，居中对齐
    const topTitleY = Math.floor(videoHeight * CONFIG_SPACING.GLOBAL_TITLE_POSITION_Y_PERCENT);

    // 计算标题总高度用于垂直居中
    const topTitleFontSize = CONFIG_SUBTITLE.FONT_SIZE_GLOBAL_TITLE;
    const lineSpacing = topTitleFontSize + CONFIG_SPACING.GLOBAL_TITLE_LINE_SPACING;
    const totalTitleHeight = topTitleLines.length * lineSpacing - 10;
    const startY = Math.max(CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT, topTitleY - Math.floor(totalTitleHeight / 2));

    // 为每个字符创建关键词映射
    const topTitleCharKeywordMap = new Map();
    let topTitleCleanCharIndex = 0;
    for (const parsedChar of parsedTopTitleChars) {
      topTitleCharKeywordMap.set(topTitleCleanCharIndex, parsedChar.isKeyword);
      topTitleCleanCharIndex++;
    }

    // 计算每行字符的起始X位置（居中对齐）
    let globalCharIndex = 0;
    for (let lineIndex = 0; lineIndex < topTitleLines.length; lineIndex++) {
      const line = topTitleLines[lineIndex];
      const lineChars = Array.from(line);
      const charSpacing = topTitleFontSize * CONFIG_SPACING.GLOBAL_TITLE_CHAR_SPACING_FACTOR;
      const lineWidth = lineChars.length * charSpacing;
      const startX = Math.max(CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT, Math.floor((videoWidth - lineWidth) / 2));

      let currentX = startX;

      for (let charIndex = 0; charIndex < lineChars.length; charIndex++) {
        const char = lineChars[charIndex];
        if (char.trim() === "") {
          globalCharIndex++;
          continue;
        }

        // 确定字符样式
        const isKeyword = topTitleCharKeywordMap.get(globalCharIndex) || false;
        const styleName = isKeyword ? "TopTitleKeyword" : "TopTitle";

        // 转义字符
        const escapedChar = char.replace(/{/g, "\\{").replace(/}/g, "\\}");

        // 计算字符位置
        const charX = currentX;
        const charY = startY + lineIndex * lineSpacing;

        // 生成动画效果
        const animationEffect = this.generateAnimation(charX, charY, duration, videoWidth);

        // 贯穿全视频的标题
        ass += `Dialogue: 0,${toAssTime(0)},${toAssTime(duration)},${styleName},,0,0,0,,${animationEffect}${escapedChar}\n`;

        currentX += charSpacing;
        globalCharIndex++;
      }
    }

    console.log(`[3/5] 顶部标题已添加: "${topTitle}" (贯穿全视频，${topTitleLines.length}行，${topTitleCleanCharIndex}个字符，动画类型: ${this.animationType})`);

    return ass;
  }
}
