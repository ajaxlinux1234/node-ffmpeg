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
   * 生成快速扫光动画效果（2秒循环）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 快速扫光动画效果字符串
   */
  generateSweepFastAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 2000; // 2秒循环
    const lightDuration = 300; // 亮起时间
    const sweepStartDelay = (charX / videoWidth) * cycleDuration;

    let sweepEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const sweepStart = cycleStart + sweepStartDelay;
      const sweepEnd = sweepStart + lightDuration;
      const cycleEnd = Math.min((cycle + 1) * cycleDuration, totalDuration);

      if (sweepStart < totalDuration) {
        sweepEffect += `\\t(${sweepStart},${sweepEnd},\\1a&H00&\\3a&H00&\\bord2)\\t(${sweepEnd},${cycleEnd},\\1a&H80&\\3a&H80&\\bord4)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(200,200)${sweepEffect}}`;
  }

  /**
   * 生成慢速扫光动画效果（5秒循环）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 慢速扫光动画效果字符串
   */
  generateSweepSlowAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 5000; // 5秒循环
    const lightDuration = 800; // 亮起时间
    const sweepStartDelay = (charX / videoWidth) * cycleDuration;

    let sweepEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const sweepStart = cycleStart + sweepStartDelay;
      const sweepEnd = sweepStart + lightDuration;
      const cycleEnd = Math.min((cycle + 1) * cycleDuration, totalDuration);

      if (sweepStart < totalDuration) {
        sweepEffect += `\\t(${sweepStart},${sweepEnd},\\1a&H20&\\3a&H20&\\bord1)\\t(${sweepEnd},${cycleEnd},\\1a&H80&\\3a&H80&\\bord4)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(300,300)${sweepEffect}}`;
  }

  /**
   * 生成脉冲扫光动画效果（带呼吸效果）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 脉冲扫光动画效果字符串
   */
  generateSweepPulseAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 3000; // 3秒循环
    const pulsePhases = 3; // 3个脉冲阶段
    const phaseTime = cycleDuration / pulsePhases;
    const sweepStartDelay = (charX / videoWidth) * cycleDuration;

    let sweepEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const sweepStart = cycleStart + sweepStartDelay;

      for (let phase = 0; phase < pulsePhases; phase++) {
        const phaseStart = sweepStart + phase * phaseTime;
        const phaseEnd = phaseStart + phaseTime / 2;
        const phaseFade = phaseStart + phaseTime;

        if (phaseStart < totalDuration) {
          const alpha = phase === 1 ? "&H00&" : "&H60&"; // 中间阶段最亮
          sweepEffect += `\\t(${phaseStart},${phaseEnd},\\1a${alpha}\\3a${alpha}\\fscx110\\fscy110)\\t(${phaseEnd},${phaseFade},\\1a&H80&\\3a&H80&\\fscx100\\fscy100)`;
        }
      }
    }

    return `{\\pos(${charX},${charY})\\fad(250,250)${sweepEffect}}`;
  }

  /**
   * 生成彩虹扫光动画效果（颜色变化）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 彩虹扫光动画效果字符串
   */
  generateSweepRainbowAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 4000; // 4秒循环
    const colors = ["&H0000FF&", "&H00FFFF&", "&H00FF00&", "&HFFFF00&", "&HFF0000&", "&HFF00FF&"]; // 红橙黄绿青蓝紫
    const colorDuration = cycleDuration / colors.length;
    const sweepStartDelay = (charX / videoWidth) * cycleDuration;

    let sweepEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const sweepStart = cycleStart + sweepStartDelay;

      for (let i = 0; i < colors.length; i++) {
        const colorStart = sweepStart + i * colorDuration;
        const colorEnd = colorStart + colorDuration;

        if (colorStart < totalDuration) {
          sweepEffect += `\\t(${colorStart},${colorEnd},\\1c${colors[i]}\\3c&H000000&\\1a&H40&\\3a&H40&)`;
        }
      }
    }

    return `{\\pos(${charX},${charY})\\fad(200,200)${sweepEffect}}`;
  }

  /**
   * 生成波浪扫光动画效果（渐变效果）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 波浪扫光动画效果字符串
   */
  generateSweepWaveAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 3500; // 3.5秒循环
    const wavePhases = 5; // 5个波浪阶段
    const phaseTime = cycleDuration / wavePhases;
    const sweepStartDelay = (charX / videoWidth) * cycleDuration;

    let sweepEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const sweepStart = cycleStart + sweepStartDelay;

      for (let wave = 0; wave < wavePhases; wave++) {
        const waveStart = sweepStart + wave * phaseTime;
        const waveEnd = waveStart + phaseTime;
        const intensity = Math.sin((wave / wavePhases) * Math.PI); // 正弦波强度
        const alpha = Math.floor(128 - intensity * 100).toString(16).padStart(2, '0');

        if (waveStart < totalDuration) {
          sweepEffect += `\\t(${waveStart},${waveEnd},\\1a&H${alpha}&\\3a&H${alpha}&\\blur2)`;
        }
      }
    }

    return `{\\pos(${charX},${charY})\\fad(300,300)${sweepEffect}}`;
  }

  /**
   * 生成激光扫光动画效果（细线扫过）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 激光扫光动画效果字符串
   */
  generateSweepLaserAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 2500; // 2.5秒循环
    const laserDuration = 100; // 激光持续时间很短
    const sweepStartDelay = (charX / videoWidth) * cycleDuration;

    let sweepEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const laserStart = cycleStart + sweepStartDelay;
      const laserEnd = laserStart + laserDuration;
      const cycleEnd = Math.min((cycle + 1) * cycleDuration, totalDuration);

      if (laserStart < totalDuration) {
        sweepEffect += `\\t(${laserStart},${laserEnd},\\1a&H00&\\3a&H00&\\1c&H00FFFF&\\3c&H000000&\\bord1\\shad0)\\t(${laserEnd},${cycleEnd},\\1a&H80&\\3a&H80&\\bord4)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(150,150)${sweepEffect}}`;
  }

  /**
   * 生成辉光扫光动画效果（发光效果）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 辉光扫光动画效果字符串
   */
  generateSweepGlowAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 4000; // 4秒循环
    const glowDuration = 600; // 辉光持续时间
    const sweepStartDelay = (charX / videoWidth) * cycleDuration;

    let sweepEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const glowStart = cycleStart + sweepStartDelay;
      const glowPeak = glowStart + glowDuration / 2;
      const glowEnd = glowStart + glowDuration;
      const cycleEnd = Math.min((cycle + 1) * cycleDuration, totalDuration);

      if (glowStart < totalDuration) {
        sweepEffect += `\\t(${glowStart},${glowPeak},\\1a&H20&\\3a&H20&\\blur3\\fscx105\\fscy105)\\t(${glowPeak},${glowEnd},\\1a&H40&\\3a&H40&\\blur2\\fscx102\\fscy102)\\t(${glowEnd},${cycleEnd},\\1a&H80&\\3a&H80&\\blur0\\fscx100\\fscy100)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(250,250)${sweepEffect}}`;
  }

  /**
   * 生成霓虹扫光动画效果（霓虹灯效果）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 霓虹扫光动画效果字符串
   */
  generateSweepNeonAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 3000; // 3秒循环
    const neonDuration = 400; // 霓虹亮起时间
    const sweepStartDelay = (charX / videoWidth) * cycleDuration;

    let sweepEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const neonStart = cycleStart + sweepStartDelay;
      const neonEnd = neonStart + neonDuration;
      const cycleEnd = Math.min((cycle + 1) * cycleDuration, totalDuration);

      if (neonStart < totalDuration) {
        sweepEffect += `\\t(${neonStart},${neonEnd},\\1a&H10&\\3a&H10&\\1c&HFF00FF&\\3c&H8000FF&\\bord3\\shad2)\\t(${neonEnd},${cycleEnd},\\1a&H80&\\3a&H80&\\1c&HFFFFFF&\\3c&H000000&\\bord4\\shad0)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(200,200)${sweepEffect}}`;
  }

  /**
   * 生成电光扫光动画效果（闪电效果）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 电光扫光动画效果字符串
   */
  generateSweepElectricAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 2800; // 2.8秒循环
    const flashCount = 3; // 每次3次闪烁
    const flashDuration = 80; // 每次闪烁持续时间
    const sweepStartDelay = (charX / videoWidth) * cycleDuration;

    let sweepEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const electricStart = cycleStart + sweepStartDelay;

      for (let flash = 0; flash < flashCount; flash++) {
        const flashStart = electricStart + flash * flashDuration * 2;
        const flashEnd = flashStart + flashDuration;

        if (flashStart < totalDuration) {
          sweepEffect += `\\t(${flashStart},${flashEnd},\\1a&H00&\\3a&H00&\\1c&H00FFFF&\\3c&HFFFFFF&\\bord2\\shad1)`;
        }
      }
    }

    return `{\\pos(${charX},${charY})\\fad(150,150)${sweepEffect}}`;
  }

  /**
   * 生成钻石扫光动画效果（闪亮效果）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 钻石扫光动画效果字符串
   */
  generateSweepDiamondAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 3500; // 3.5秒循环
    const sparklePhases = 4; // 4个闪亮阶段
    const phaseTime = cycleDuration / sparklePhases;
    const sweepStartDelay = (charX / videoWidth) * cycleDuration;

    let sweepEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const sparkleStart = cycleStart + sweepStartDelay;

      for (let phase = 0; phase < sparklePhases; phase++) {
        const phaseStart = sparkleStart + phase * phaseTime;
        const phaseEnd = phaseStart + phaseTime / 2;
        const scale = 100 + phase * 5; // 逐渐放大

        if (phaseStart < totalDuration) {
          sweepEffect += `\\t(${phaseStart},${phaseEnd},\\1a&H20&\\3a&H20&\\1c&HFFFFFF&\\3c&HC0C0C0&\\fscx${scale}\\fscy${scale}\\blur1)`;
        }
      }
    }

    return `{\\pos(${charX},${charY})\\fad(300,300)${sweepEffect}}`;
  }

  /**
   * 生成旋转动画效果（3D旋转）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 旋转动画效果字符串
   */
  generateRotateAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 4000; // 4秒循环
    const rotateDelay = (charX / videoWidth) * 1000;

    let rotateEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const rotateStart = cycleStart + rotateDelay;
      const rotateEnd = rotateStart + 1000;

      if (rotateStart < totalDuration) {
        rotateEffect += `\\t(${rotateStart},${rotateStart + 250},\\fscx50\\fscy100)\\t(${rotateStart + 250},${rotateStart + 500},\\fscx0\\fscy100)\\t(${rotateStart + 500},${rotateStart + 750},\\fscx50\\fscy100)\\t(${rotateStart + 750},${rotateEnd},\\fscx100\\fscy100)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(200,200)${rotateEffect}}`;
  }

  /**
   * 生成弹跳动画效果（上下弹跳）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 弹跳动画效果字符串
   */
  generateBounceAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 2000; // 2秒循环
    const bounceDelay = (charX / videoWidth) * 500;

    let bounceEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const bounceStart = cycleStart + bounceDelay;
      const bounceUp = bounceStart + 300;
      const bounceDown = bounceUp + 300;

      if (bounceStart < totalDuration) {
        bounceEffect += `\\t(${bounceStart},${bounceUp},\\fscx110\\fscy90)\\t(${bounceUp},${bounceDown},\\fscx100\\fscy100)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(200,200)${bounceEffect}}`;
  }

  /**
   * 生成呼吸动画效果（缩放呼吸）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 呼吸动画效果字符串
   */
  generateBreathAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 3000; // 3秒循环
    const breathDelay = (charX / videoWidth) * 1000;

    let breathEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const breathStart = cycleStart + breathDelay;
      const breathIn = breathStart + 1500;
      const breathOut = breathIn + 1500;

      if (breathStart < totalDuration) {
        breathEffect += `\\t(${breathStart},${breathIn},\\fscx110\\fscy110\\1a&H40&\\3a&H40&)\\t(${breathIn},${breathOut},\\fscx100\\fscy100\\1a&H80&\\3a&H80&)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(250,250)${breathEffect}}`;
  }

  /**
   * 生成震动动画效果（快速抖动）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 震动动画效果字符串
   */
  generateShakeAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 2500; // 2.5秒循环
    const shakeDelay = (charX / videoWidth) * 500;
    const shakeCount = 8;
    const shakeDuration = 400;

    let shakeEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const shakeStart = cycleStart + shakeDelay;

      for (let i = 0; i < shakeCount; i++) {
        const shakeTime = shakeStart + (i * shakeDuration / shakeCount);
        const offset = (i % 2 === 0) ? 2 : -2;
        
        if (shakeTime < totalDuration) {
          shakeEffect += `\\t(${shakeTime},${shakeTime + shakeDuration / shakeCount},\\fscx${100 + offset}\\fscy${100 - offset})`;
        }
      }
    }

    return `{\\pos(${charX},${charY})\\fad(150,150)${shakeEffect}}`;
  }

  /**
   * 生成液态动画效果（流动变形）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 液态动画效果字符串
   */
  generateLiquidAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 4000; // 4秒循环
    const liquidDelay = (charX / videoWidth) * 1500;

    let liquidEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const liquidStart = cycleStart + liquidDelay;
      const phase1 = liquidStart + 1000;
      const phase2 = phase1 + 1000;
      const phase3 = phase2 + 1000;
      const phase4 = phase3 + 1000;

      if (liquidStart < totalDuration) {
        liquidEffect += `\\t(${liquidStart},${phase1},\\fscx120\\fscy80\\blur2)\\t(${phase1},${phase2},\\fscx80\\fscy120\\blur3)\\t(${phase2},${phase3},\\fscx110\\fscy90\\blur2)\\t(${phase3},${phase4},\\fscx100\\fscy100\\blur0)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(300,300)${liquidEffect}}`;
  }

  /**
   * 生成火焰动画效果（燃烧效果）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 火焰动画效果字符串
   */
  generateFireAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 2000; // 2秒循环
    const fireDelay = (charX / videoWidth) * 800;
    const flickerCount = 6;

    let fireEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const fireStart = cycleStart + fireDelay;

      for (let i = 0; i < flickerCount; i++) {
        const flickerTime = fireStart + (i * cycleDuration / flickerCount);
        const nextFlicker = flickerTime + cycleDuration / flickerCount;
        const colors = ["&H0000FF&", "&H0080FF&", "&H00FFFF&"];
        const color = colors[i % colors.length];
        
        if (flickerTime < totalDuration) {
          fireEffect += `\\t(${flickerTime},${nextFlicker},\\1c${color}\\3c&H000080&\\blur${1 + (i % 3)}\\fscy${105 + (i % 2) * 5})`;
        }
      }
    }

    return `{\\pos(${charX},${charY})\\fad(200,200)${fireEffect}}`;
  }

  /**
   * 生成冰冻动画效果（结冰效果）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 冰冻动画效果字符串
   */
  generateFreezeAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 3500; // 3.5秒循环
    const freezeDelay = (charX / videoWidth) * 1200;

    let freezeEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const freezeStart = cycleStart + freezeDelay;
      const freezePeak = freezeStart + 800;
      const freezeEnd = freezePeak + 1200;

      if (freezeStart < totalDuration) {
        freezeEffect += `\\t(${freezeStart},${freezePeak},\\1c&HFFFF00&\\3c&HFF8000&\\1a&H20&\\3a&H20&\\blur2\\fscx95\\fscy95)\\t(${freezePeak},${freezeEnd},\\1c&HFFFFFF&\\3c&H000000&\\1a&H80&\\3a&H80&\\blur0\\fscx100\\fscy100)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(250,250)${freezeEffect}}`;
  }

  /**
   * 生成爆炸动画效果（扩散效果）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 爆炸动画效果字符串
   */
  generateExplodeAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 3000; // 3秒循环
    const explodeDelay = (charX / videoWidth) * 1000;

    let explodeEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const explodeStart = cycleStart + explodeDelay;
      const explodePeak = explodeStart + 300;
      const explodeEnd = explodePeak + 500;

      if (explodeStart < totalDuration) {
        explodeEffect += `\\t(${explodeStart},${explodePeak},\\fscx150\\fscy150\\1a&H00&\\3a&H00&\\blur5)\\t(${explodePeak},${explodeEnd},\\fscx100\\fscy100\\1a&H80&\\3a&H80&\\blur0)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(200,200)${explodeEffect}}`;
  }

  /**
   * 生成心跳动画效果（跳动效果）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 心跳动画效果字符串
   */
  generateHeartbeatAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 1500; // 1.5秒循环
    const beatDelay = (charX / videoWidth) * 300;

    let beatEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const beat1Start = cycleStart + beatDelay;
      const beat1End = beat1Start + 150;
      const beat2Start = beat1End + 100;
      const beat2End = beat2Start + 150;

      if (beat1Start < totalDuration) {
        beatEffect += `\\t(${beat1Start},${beat1End},\\fscx115\\fscy115\\1c&H0000FF&)\\t(${beat1End},${beat2Start},\\fscx100\\fscy100\\1c&HFFFFFF&)\\t(${beat2Start},${beat2End},\\fscx110\\fscy110\\1c&H0000FF&)\\t(${beat2End},${cycleStart + cycleDuration},\\fscx100\\fscy100\\1c&HFFFFFF&)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(150,150)${beatEffect}}`;
  }

  /**
   * 生成星光动画效果（闪烁星星）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 星光动画效果字符串
   */
  generateStarAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 2500; // 2.5秒循环
    const starDelay = (charX / videoWidth) * 1000;

    let starEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const starStart = cycleStart + starDelay;
      const starPeak = starStart + 400;
      const starEnd = starPeak + 400;

      if (starStart < totalDuration) {
        starEffect += `\\t(${starStart},${starPeak},\\1a&H00&\\3a&H00&\\1c&HFFFFFF&\\3c&HFFFF00&\\fscx120\\fscy120\\blur2\\bord3)\\t(${starPeak},${starEnd},\\1a&H80&\\3a&H80&\\fscx100\\fscy100\\blur0\\bord4)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(200,200)${starEffect}}`;
  }

  /**
   * 生成波纹动画效果（水波纹）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 波纹动画效果字符串
   */
  generateRippleAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 3000; // 3秒循环
    const rippleDelay = (charX / videoWidth) * 1500;

    let rippleEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const rippleStart = cycleStart + rippleDelay;
      const ripple1 = rippleStart + 500;
      const ripple2 = ripple1 + 500;
      const ripple3 = ripple2 + 500;

      if (rippleStart < totalDuration) {
        rippleEffect += `\\t(${rippleStart},${ripple1},\\fscx105\\fscy105\\1a&H60&\\blur1)\\t(${ripple1},${ripple2},\\fscx110\\fscy110\\1a&H40&\\blur2)\\t(${ripple2},${ripple3},\\fscx100\\fscy100\\1a&H80&\\blur0)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(250,250)${rippleEffect}}`;
  }

  /**
   * 生成幽灵动画效果（飘动效果）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 幽灵动画效果字符串
   */
  generateGhostAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 4000; // 4秒循环
    const ghostDelay = (charX / videoWidth) * 1500;

    let ghostEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const ghostStart = cycleStart + ghostDelay;
      const fade1 = ghostStart + 1000;
      const fade2 = fade1 + 1000;
      const fade3 = fade2 + 1000;

      if (ghostStart < totalDuration) {
        ghostEffect += `\\t(${ghostStart},${fade1},\\1a&H40&\\3a&H40&\\blur3)\\t(${fade1},${fade2},\\1a&HA0&\\3a&HA0&\\blur4)\\t(${fade2},${fade3},\\1a&H60&\\3a&H60&\\blur2)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(300,300)${ghostEffect}}`;
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
      
      // 扫光动画系列
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_FAST:
        return this.generateSweepFastAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_SLOW:
        return this.generateSweepSlowAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_PULSE:
        return this.generateSweepPulseAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_RAINBOW:
        return this.generateSweepRainbowAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_WAVE:
        return this.generateSweepWaveAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_LASER:
        return this.generateSweepLaserAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_GLOW:
        return this.generateSweepGlowAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_NEON:
        return this.generateSweepNeonAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_ELECTRIC:
        return this.generateSweepElectricAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_DIAMOND:
        return this.generateSweepDiamondAnimation(charX, charY, duration, videoWidth);
      
      // 高级动画系列
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.ROTATE:
        return this.generateRotateAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.BOUNCE:
        return this.generateBounceAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.BREATH:
        return this.generateBreathAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SHAKE:
        return this.generateShakeAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.LIQUID:
        return this.generateLiquidAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.FIRE:
        return this.generateFireAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.FREEZE:
        return this.generateFreezeAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.EXPLODE:
        return this.generateExplodeAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.HEARTBEAT:
        return this.generateHeartbeatAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.STAR:
        return this.generateStarAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.RIPPLE:
        return this.generateRippleAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.GHOST:
        return this.generateGhostAnimation(charX, charY, duration, videoWidth);
      
      default:
        console.warn(`[警告] 未实现的动画类型: ${this.animationType}，使用闪光动画`);
        return this.generateFlashAnimation(charX, charY, duration, videoWidth);
    }
  }

  /**
   * 生成全局标题的ASS字幕内容
   * @param {string} topTitle - 标题文本
   * @param {number} duration - 显示时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @param {number} videoHeight - 视频高度
   * @param {Function} wrapCJK - 文本换行函数
   * @param {Function} toAssTime - 时间格式化函数
   * @param {number} startTime - 开始时间（秒），默认为0
   * @returns {string} ASS字幕内容
   */
  generateGlobalTitleASS(topTitle, duration, videoWidth, videoHeight, wrapCJK, toAssTime, startTime = 0) {
    let ass = "";

    // 解析关键词并生成带颜色的标题
    const parsedTopTitleChars = this.parseKeywords(topTitle);
    
    // 处理换行：检查是否包含手动换行符 \n
    let topTitleLines;
    if (topTitle.includes('\n')) {
      // 手动换行：按 \n 分割，保留关键词标记
      topTitleLines = topTitle.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    } else {
      // 自动换行：使用wrapCJK处理，但需要确保移除关键词标记进行长度计算
      const wrappedTopTitle = wrapCJK(topTitle);
      const topTitleText = wrappedTopTitle.replace(/\\N/g, "\n");
      topTitleLines = topTitleText.split("\n");
    }

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
      
      // 解析这一行的关键词，获取实际显示的字符
      const lineParsedChars = this.parseKeywords(line);
      const lineDisplayChars = lineParsedChars.map(pc => pc.char);
      
      const charSpacing = topTitleFontSize * CONFIG_SPACING.GLOBAL_TITLE_CHAR_SPACING_FACTOR;
      const lineWidth = lineDisplayChars.length * charSpacing;
      // 计算居中位置，确保不超出左右边距
      const centerX = Math.floor((videoWidth - lineWidth) / 2);
      const minX = CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT;
      const maxX = videoWidth - CONFIG_SPACING.GLOBAL_TITLE_MARGIN_RIGHT - lineWidth;
      const startX = Math.max(minX, Math.min(centerX, maxX));

      let currentX = startX;

      for (let charIndex = 0; charIndex < lineParsedChars.length; charIndex++) {
        const parsedChar = lineParsedChars[charIndex];
        const char = parsedChar.char;
        
        if (char.trim() === "") {
          globalCharIndex++;
          continue;
        }

        // 确定字符样式（使用解析出的关键词信息）
        const isKeyword = parsedChar.isKeyword;
        const styleName = isKeyword ? "TopTitleKeyword" : "TopTitle";

        // 转义字符
        const escapedChar = char.replace(/{/g, "\\{").replace(/}/g, "\\}");

        // 计算字符位置
        const charX = currentX;
        const charY = startY + lineIndex * lineSpacing;

        // 生成动画效果
        const animationEffect = this.generateAnimation(charX, charY, duration, videoWidth);

        // 根据开始时间和时长生成标题
        const endTime = startTime + duration;
        ass += `Dialogue: 0,${toAssTime(startTime)},${toAssTime(endTime)},${styleName},,0,0,0,,${animationEffect}${escapedChar}\n`;

        currentX += charSpacing;
        globalCharIndex++;
      }
    }

    console.log(`[3/5] 顶部标题已添加: "${topTitle}" (贯穿全视频，${topTitleLines.length}行，${topTitleCleanCharIndex}个字符，动画类型: ${this.animationType})`);

    return ass;
  }
}
