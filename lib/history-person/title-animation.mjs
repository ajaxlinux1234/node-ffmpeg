// =============================================================================
// TITLE ANIMATION CLASS - 全局标题动画处理类
// =============================================================================

import {
  CONFIG_SUBTITLE,
  CONFIG_SPACING,
  CONFIG_TITLE_ANIMATION,
} from "./history-person-constants.mjs";
import { TypewriterSoundGenerator } from "./typewriter-sound-generator.mjs";
import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";

/**
 * 执行命令行命令
 * @param {string} command - 要执行的命令
 * @returns {Object} - {stdout: string, stderr: string}
 */
function execCommand(command) {
  try {
    const stdout = execSync(command, { encoding: "utf8" });
    return { stdout, stderr: "" };
  } catch (error) {
    console.error(`命令执行失败: ${command}`);
    console.error(`错误信息: ${error.message}`);
    throw error;
  }
}

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
      console.warn(
        `[警告] 未知的动画类型: ${type}，使用默认动画类型: ${CONFIG_TITLE_ANIMATION.DEFAULT_ANIMATION}`
      );
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
   * 将CSS样式转换为FFmpeg兼容的格式
   * @param {Object} style - CSS样式对象
   * @param {string} font - 字体名称
   * @returns {Object} - FFmpeg兼容的样式对象
   */
  convertCSSToFFmpegStyle(style, font) {
    const result = {
      fontname: font || this.getPlatformFont(),
      fontsize: CONFIG_SUBTITLE.FONT_SIZE_GLOBAL_TITLE,
      primaryColour: "&H00FFFFFF", // 默认白色
      bold: 1,
    };

    if (style) {
      // 处理字体大小
      if (style.fontSize) {
        const fontSize = parseInt(style.fontSize.replace("px", ""));
        if (!isNaN(fontSize)) {
          result.fontsize = fontSize;
        }
      }

      // 处理颜色 - 将CSS颜色转换为ASS颜色格式
      if (style.color) {
        const color = style.color.toLowerCase();
        switch (color) {
          case "red":
            result.primaryColour = "&H000000FF"; // 红色
            break;
          case "blue":
            result.primaryColour = "&H00FF0000"; // 蓝色
            break;
          case "green":
            result.primaryColour = "&H0000FF00"; // 绿色
            break;
          case "yellow":
            result.primaryColour = "&H0000FFFF"; // 黄色
            break;
          case "white":
            result.primaryColour = "&H00FFFFFF"; // 白色
            break;
          case "black":
            result.primaryColour = "&H00000000"; // 黑色
            break;
          default:
            // 尝试解析十六进制颜色
            if (color.startsWith("#")) {
              const hex = color.substring(1);
              if (hex.length === 6) {
                // 将 #RRGGBB 转换为 &H00BBGGRR (ASS格式)
                const r = hex.substring(0, 2);
                const g = hex.substring(2, 4);
                const b = hex.substring(4, 6);
                result.primaryColour = `&H00${b}${g}${r}`.toUpperCase();
              }
            }
            break;
        }
      }

      // 处理字体粗细
      if (style.fontWeight) {
        result.bold =
          style.fontWeight === "bold" || parseInt(style.fontWeight) >= 600
            ? 1
            : 0;
      }
    }

    return result;
  }

  /**
   * 获取平台特定的字体名称
   * @returns {string} - 平台特定的字体名称
   */
  getPlatformFont() {
    const platform = process.platform;

    switch (platform) {
      case "darwin": // macOS
        return "BiauKai"; // 标楷体
      case "win32": // Windows
        return "KaiTi"; // 楷体
      case "linux": // Linux
        return "AR PL UKai CN"; // Linux 下的楷体
      default:
        return "KaiTi"; // 默认楷体
    }
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
      const brightEnd =
        cycleFlashStartDelay + CONFIG_TITLE_ANIMATION.FLASH_BRIGHT_DURATION;
      const cycleEndTime = Math.min(
        cycleStart + flashCycleDuration,
        totalDuration
      );

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
    const colors = [
      "&H0000FF&",
      "&H00FFFF&",
      "&H00FF00&",
      "&HFFFF00&",
      "&HFF0000&",
      "&HFF00FF&",
    ]; // 红橙黄绿青蓝紫
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
        const alpha = Math.floor(128 - intensity * 100)
          .toString(16)
          .padStart(2, "0");

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
        const shakeTime = shakeStart + (i * shakeDuration) / shakeCount;
        const offset = i % 2 === 0 ? 2 : -2;

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
        const flickerTime = fireStart + (i * cycleDuration) / flickerCount;
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
   * 生成粒子破碎消失动画效果（碎片飞散）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 粒子破碎动画效果字符串
   */
  generateParticleShatterAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 4000; // 4秒循环
    const shatterDelay = (charX / videoWidth) * 1000; // 基于位置的延迟
    const shatterDuration = 800; // 破碎过程持续时间

    let shatterEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const shatterStart = cycleStart + shatterDelay;
      const shatterPeak = shatterStart + shatterDuration / 3; // 破碎高峰
      const shatterEnd = shatterStart + shatterDuration;
      const cycleEnd = Math.min((cycle + 1) * cycleDuration, totalDuration);

      if (shatterStart < totalDuration) {
        // 第一阶段：字符开始震动和变形
        shatterEffect += `\\t(${shatterStart},${shatterPeak},\\fscx120\\fscy80\\1a&H40&\\3a&H40&\\blur2\\shad3)`;

        // 第二阶段：破碎效果 - 多个小碎片
        const fragmentCount = 6; // 碎片数量
        for (let i = 0; i < fragmentCount; i++) {
          const fragmentStart = shatterPeak + i * 50;
          const fragmentEnd = fragmentStart + 200;
          const offsetX = (Math.random() - 0.5) * 40; // 随机X偏移
          const offsetY = (Math.random() - 0.5) * 40; // 随机Y偏移
          const scale = 60 + Math.random() * 40; // 随机缩放 60-100%

          if (fragmentStart < totalDuration) {
            shatterEffect += `\\t(${fragmentStart},${fragmentEnd},\\fscx${scale}\\fscy${scale}\\1a&H80&\\3a&H80&\\blur4\\move(${charX},${charY},${charX + offsetX},${charY + offsetY}))`;
          }
        }

        // 第三阶段：完全消失
        shatterEffect += `\\t(${shatterEnd},${cycleEnd},\\1a&HFF&\\3a&HFF&\\fscx0\\fscy0)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(200,400)${shatterEffect}}`;
  }

  /**
   * 生成粒子溶解消失动画效果（逐渐消散）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 粒子溶解动画效果字符串
   */
  generateParticleDissolveAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 5000; // 5秒循环
    const dissolveDelay = (charX / videoWidth) * 1500;
    const dissolveDuration = 1200; // 溶解过程持续时间

    let dissolveEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const dissolveStart = cycleStart + dissolveDelay;
      const dissolvePhases = 8; // 溶解阶段数
      const phaseTime = dissolveDuration / dissolvePhases;

      for (let phase = 0; phase < dissolvePhases; phase++) {
        const phaseStart = dissolveStart + phase * phaseTime;
        const phaseEnd = phaseStart + phaseTime;
        const alpha = Math.floor(255 * (phase / dissolvePhases))
          .toString(16)
          .padStart(2, "0");
        const blur = 1 + phase * 0.5; // 逐渐增加模糊
        const scale = 100 - phase * 8; // 逐渐缩小

        if (phaseStart < totalDuration) {
          dissolveEffect += `\\t(${phaseStart},${phaseEnd},\\1a&H${alpha}&\\3a&H${alpha}&\\blur${blur}\\fscx${scale}\\fscy${scale})`;
        }
      }

      // 确保最终完全消失
      const fadeStart = dissolveStart + dissolveDuration;
      const fadeEnd = Math.min((cycle + 1) * cycleDuration, totalDuration);

      if (fadeStart < totalDuration) {
        dissolveEffect += `\\t(${fadeStart},${fadeEnd},\\1a&HFF&\\3a&HFF&\\fscx0\\fscy0)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(300,600)${dissolveEffect}}`;
  }

  /**
   * 生成粒子爆炸消失动画效果（爆炸飞散）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 粒子爆炸动画效果字符串
   */
  generateParticleExplosionAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 3500; // 3.5秒循环
    const explosionDelay = (charX / videoWidth) * 800;
    const explosionDuration = 600; // 爆炸过程持续时间

    let explosionEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const explosionStart = cycleStart + explosionDelay;
      const explosionPeak = explosionStart + 150; // 爆炸瞬间
      const explosionEnd = explosionStart + explosionDuration;

      if (explosionStart < totalDuration) {
        // 爆炸前的聚集
        explosionEffect += `\\t(${explosionStart},${explosionPeak},\\fscx80\\fscy80\\1a&H20&\\3a&H20&\\blur1)`;

        // 爆炸瞬间 - 强烈的闪光和扩散
        explosionEffect += `\\t(${explosionPeak},${explosionPeak + 100},\\fscx200\\fscy200\\1a&H00&\\3a&H00&\\1c&HFFFFFF&\\blur8)`;

        // 爆炸后的粒子飞散
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * 2 * Math.PI;
          const distance = 60 + Math.random() * 40;
          const particleX = charX + Math.cos(angle) * distance;
          const particleY = charY + Math.sin(angle) * distance;
          const particleStart = explosionPeak + 100 + i * 30;
          const particleEnd = particleStart + 300;

          if (particleStart < totalDuration) {
            explosionEffect += `\\t(${particleStart},${particleEnd},\\fscx30\\fscy30\\1a&HC0&\\3a&HC0&\\blur3\\move(${charX},${charY},${particleX},${particleY}))`;
          }
        }

        // 完全消失
        explosionEffect += `\\t(${explosionEnd},${Math.min((cycle + 1) * cycleDuration, totalDuration)},\\1a&HFF&\\3a&HFF&)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(150,300)${explosionEffect}}`;
  }

  /**
   * 生成粒子尘化消失动画效果（化为尘埃）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 粒子尘化动画效果字符串
   */
  generateParticleDustAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 4500; // 4.5秒循环
    const dustDelay = (charX / videoWidth) * 1200;
    const dustDuration = 1000; // 尘化过程持续时间

    let dustEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const dustStart = cycleStart + dustDelay;
      const dustPhases = 10; // 尘化阶段数
      const phaseTime = dustDuration / dustPhases;

      for (let phase = 0; phase < dustPhases; phase++) {
        const phaseStart = dustStart + phase * phaseTime;
        const phaseEnd = phaseStart + phaseTime;

        // 修复透明度计算：从不透明逐渐变为完全透明
        const alphaValue = Math.floor((phase / dustPhases) * 255);
        const alpha = alphaValue.toString(16).padStart(2, "0");
        const blur = 2 + phase * 0.8; // 逐渐增加模糊
        const scale = 100 - phase * 5; // 轻微缩小
        const dustColor = phase > 5 ? "&H808080&" : "&HFFFFFF&"; // 后期变灰

        if (phaseStart < totalDuration) {
          dustEffect += `\\t(${phaseStart},${phaseEnd},\\1a&H${alpha}&\\3a&H${alpha}&\\1c${dustColor}\\blur${blur}\\fscx${scale}\\fscy${scale})`;
        }
      }

      // 最终飘散效果 - 确保完全消失
      const floatStart = dustStart + dustDuration;
      const floatEnd = Math.min((cycle + 1) * cycleDuration, totalDuration);
      const floatY = charY - 30; // 向上飘散

      if (floatStart < totalDuration) {
        dustEffect += `\\t(${floatStart},${floatEnd},\\1a&HFF&\\3a&HFF&\\fscx0\\fscy0\\move(${charX},${charY},${charX},${floatY}))`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(250,500)${dustEffect}}`;
  }

  /**
   * 生成粒子闪烁消失动画效果（星光消散）
   * @param {number} charX - 字符X位置
   * @param {number} charY - 字符Y位置
   * @param {number} duration - 视频总时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 粒子闪烁动画效果字符串
   */
  generateParticleSparkleAnimation(charX, charY, duration, videoWidth) {
    const cycleDuration = 3000; // 3秒循环
    const sparkleDelay = (charX / videoWidth) * 1000;
    const sparkleDuration = 800; // 闪烁过程持续时间

    let sparkleEffect = "";
    const totalDuration = Math.floor(duration * 1000);
    const cycleCount = Math.ceil(totalDuration / cycleDuration);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const cycleStart = cycle * cycleDuration;
      const sparkleStart = cycleStart + sparkleDelay;

      // 多次闪烁效果
      const sparkleCount = 6;
      for (let sparkle = 0; sparkle < sparkleCount; sparkle++) {
        const sparkleTime =
          sparkleStart + sparkle * (sparkleDuration / sparkleCount);
        const sparkleEnd = sparkleTime + 80;
        const nextSparkle = sparkleTime + sparkleDuration / sparkleCount;

        if (sparkleTime < totalDuration) {
          // 闪烁时变亮变大
          sparkleEffect += `\\t(${sparkleTime},${sparkleEnd},\\1a&H00&\\3a&H00&\\1c&HFFFFFF&\\3c&HFFFF00&\\fscx130\\fscy130\\blur2\\bord3)`;
          // 闪烁后恢复并逐渐变暗
          sparkleEffect += `\\t(${sparkleEnd},${nextSparkle},\\1a&H${Math.floor(
            sparkle * 30
          )
            .toString(16)
            .padStart(2, "0")}&\\3a&H${Math.floor(sparkle * 30)
            .toString(16)
            .padStart(
              2,
              "0"
            )}&\\fscx${100 - sparkle * 10}\\fscy${100 - sparkle * 10}\\blur${sparkle * 0.5})`;
        }
      }

      // 最终消散
      const fadeStart = sparkleStart + sparkleDuration;
      const fadeEnd = Math.min((cycle + 1) * cycleDuration, totalDuration);

      if (fadeStart < totalDuration) {
        sparkleEffect += `\\t(${fadeStart},${fadeEnd},\\1a&HFF&\\3a&HFF&\\fscx0\\fscy0)`;
      }
    }

    return `{\\pos(${charX},${charY})\\fad(200,400)${sparkleEffect}}`;
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
        return this.generateSweepFastAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_SLOW:
        return this.generateSweepSlowAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_PULSE:
        return this.generateSweepPulseAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_RAINBOW:
        return this.generateSweepRainbowAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_WAVE:
        return this.generateSweepWaveAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_LASER:
        return this.generateSweepLaserAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_GLOW:
        return this.generateSweepGlowAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_NEON:
        return this.generateSweepNeonAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_ELECTRIC:
        return this.generateSweepElectricAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.SWEEP_DIAMOND:
        return this.generateSweepDiamondAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );

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
        return this.generateExplodeAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.HEARTBEAT:
        return this.generateHeartbeatAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.STAR:
        return this.generateStarAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.RIPPLE:
        return this.generateRippleAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.GHOST:
        return this.generateGhostAnimation(charX, charY, duration, videoWidth);
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.TYPEWRITER:
        return this.generateTypewriterAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );

      // 粒子破碎系列
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.PARTICLE_SHATTER:
        return this.generateParticleShatterAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.PARTICLE_DISSOLVE:
        return this.generateParticleDissolveAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.PARTICLE_EXPLOSION:
        return this.generateParticleExplosionAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.PARTICLE_DUST:
        return this.generateParticleDustAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );
      case CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.PARTICLE_SPARKLE:
        return this.generateParticleSparkleAnimation(
          charX,
          charY,
          duration,
          videoWidth
        );

      default:
        console.warn(
          `[警告] 未实现的动画类型: ${this.animationType}，使用闪光动画`
        );
        return this.generateFlashAnimation(charX, charY, duration, videoWidth);
    }
  }

  /**
   * 生成打字机动画效果
   * @param {number} charX - 字符X坐标
   * @param {number} charY - 字符Y坐标
   * @param {number} duration - 动画时长
   * @param {number} videoWidth - 视频宽度
   * @returns {string} 动画效果字符串
   */
  generateTypewriterAnimation(charX, charY, duration, videoWidth) {
    // 打字机效果：字符逐个显示，无特殊动画效果
    return `{\\pos(${charX},${charY})}`;
  }

  /**
   * 生成或获取打字机音效
   * @param {string} text - 文本内容
   * @param {number} duration - 时长（秒）
   * @param {string} outputPath - 输出音效文件路径
   * @returns {Promise<string>} 音效文件路径
   */
  async generateTypewriterSound(text, duration, outputPath) {
    // 首先尝试从 sounds 目录查找现有的键盘打字音效
    const soundsDir = path.join(process.cwd(), "sounds");
    const possibleNames = [
      "打字声.mp3",
      "打字声.wav", // 优先使用用户指定的音效
      "键盘打字声.mp3",
      "键盘打字声.wav",
      "打字机音效.mp3",
      "打字机音效.wav",
      "typewriter.mp3",
      "typewriter.wav",
      "keyboard.mp3",
      "keyboard.wav",
    ];

    for (const soundName of possibleNames) {
      const soundPath = path.join(soundsDir, soundName);
      try {
        await fs.access(soundPath);
        console.log(`🎵 找到现有打字机音效: ${soundPath}`);

        // 检查音效时长，如果需要可以循环播放匹配时长
        const probe = execCommand(
          `ffprobe -v quiet -print_format json -show_format "${soundPath}"`
        );
        const info = JSON.parse(probe.stdout);
        const soundDuration = parseFloat(info.format?.duration || 0);

        if (soundDuration >= duration) {
          // 音效时长足够，直接裁剪使用
          execCommand(
            `ffmpeg -y -i "${soundPath}" -t ${duration} -c copy "${outputPath}"`
          );
        } else {
          // 音效时长不够，循环播放
          const loopCount = Math.ceil(duration / soundDuration);
          execCommand(
            `ffmpeg -y -stream_loop ${loopCount - 1} -i "${soundPath}" -t ${duration} -c:a aac "${outputPath}"`
          );
        }

        return outputPath;
      } catch (error) {
        // 文件不存在，继续尝试下一个
        continue;
      }
    }

    // 如果没有找到现有音效，则生成新的
    console.log(`🎵 未找到现有打字机音效，开始生成新音效`);

    // 计算实际字符数（去除关键词标记和换行符）
    const cleanText = text.replace(/\{\{[^}]*\}\}/g, "").replace(/\n/g, "");
    const charCount = cleanText.length;

    if (charCount === 0) {
      console.warn("⚠️ 文本为空，跳过打字机音效生成");
      return null;
    }

    console.log(`🎵 生成打字机音效: ${charCount}个字符, ${duration}秒`);

    const soundGenerator = new TypewriterSoundGenerator();
    try {
      const soundPath = await soundGenerator.generateVariedTypewriterSequence(
        charCount,
        duration,
        outputPath
      );
      return soundPath;
    } catch (error) {
      console.error("❌ 生成打字机音效失败:", error.message);
      return null;
    }
  }

  /**
   * 检测文本是否为纯英文（包含字母、数字、空格和基本标点符号）
   * @param {string} text - 要检测的文本
   * @returns {boolean} - 是否为纯英文
   */
  isEnglishOnly(text) {
    // 移除关键词标记后检测
    const cleanText = text.replace(/\{\{[^}]*\}\}/g, "");
    // 检测是否只包含英文字母、数字、空格和基本标点符号
    return /^[a-zA-Z0-9\s\.,!?;:'"()\-–—]*$/.test(cleanText);
  }

  /**
   * 为英文文本计算字符间距
   * @param {string} text - 文本内容
   * @param {number} baseFontSize - 基础字体大小
   * @param {number} charIndex - 当前字符索引
   * @param {Array} chars - 字符数组
   * @returns {number} - 字符间距
   */
  calculateEnglishCharSpacing(text, baseFontSize, charIndex, chars) {
    const currentChar = chars[charIndex];
    const nextChar = charIndex < chars.length - 1 ? chars[charIndex + 1] : null;

    // 如果当前字符是空格，返回正常的单词间距
    if (currentChar === " ") {
      return baseFontSize * 1.2; // 单词间距（大幅增加）
    }

    // 如果下一个字符是空格或标点符号，给予适中间距
    if (nextChar === " " || /[.,!?;:'"()\-–—]/.test(nextChar)) {
      return baseFontSize * 0.8; // 字母与标点间的间距（大幅增加）
    }

    // 如果下一个字符是null（最后一个字符），不需要间距
    if (nextChar === null) {
      return 0;
    }

    // 字母之间需要更大间距，确保可读性
    return baseFontSize * 0.5; // 字母间的间距（大幅增加）
  }

  /**
   * 生成全局标题ASS字幕
   * @param {string} topTitle - 顶部标题文本
   * @param {number} duration - 视频时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @param {number} videoHeight - 视频高度
   * @param {function} wrapCJK - 中文换行函数
   * @param {function} toAssTime - 时间转换函数
   * @param {number} startTime - 开始时间，默认为0
   * @param {boolean} isEndTitle - 是否为结尾标题，默认为false
   * @returns {string} ASS字幕内容
   */
  generateGlobalTitleASS(
    topTitle,
    duration,
    videoWidth,
    videoHeight,
    wrapCJK,
    toAssTime,
    startTime = 0,
    isEndTitle = false,
    titleFontConfig = null
  ) {
    let ass = "";

    // 解析关键词并生成带颜色的标题
    const parsedTopTitleChars = this.parseKeywords(topTitle);

    // 处理换行：检查是否包含手动换行符 \n
    let topTitleLines;
    if (topTitle.includes("\n")) {
      // 手动换行：按 \n 分割，保留关键词标记
      topTitleLines = topTitle
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } else {
      // 自动换行：使用wrapCJK处理，但需要确保移除关键词标记进行长度计算
      const wrappedTopTitle = wrapCJK(topTitle);
      const topTitleText = wrappedTopTitle.replace(/\\N/g, "\n");
      topTitleLines = topTitleText.split("\n");
    }

    // 标题位置：结尾标题居中显示，普通标题使用配置的Y位置百分比
    const topTitleY = isEndTitle
      ? Math.floor(videoHeight * 0.5) // 结尾标题在屏幕中央
      : Math.floor(
          videoHeight * CONFIG_SPACING.GLOBAL_TITLE_POSITION_Y_PERCENT
        ); // 普通标题在顶部

    // 计算标题总高度用于垂直居中
    const topTitleFontSize = isEndTitle
      ? CONFIG_SUBTITLE.FONT_SIZE_END_TITLE
      : CONFIG_SUBTITLE.FONT_SIZE_GLOBAL_TITLE;
    const lineSpacing =
      topTitleFontSize + CONFIG_SPACING.GLOBAL_TITLE_LINE_SPACING;
    const totalTitleHeight = topTitleLines.length * lineSpacing - 10;
    const startY = topTitleY - Math.floor(totalTitleHeight / 2);

    // 为每个字符创建关键词映射
    const topTitleCharKeywordMap = new Map();
    let topTitleCleanCharIndex = 0;
    for (const parsedChar of parsedTopTitleChars) {
      topTitleCharKeywordMap.set(topTitleCleanCharIndex, parsedChar.isKeyword);
      topTitleCleanCharIndex++;
    }

    // 计算每行字符的起始X位置（居中对齐）
    let globalCharIndex = 0;
    // 如果是结尾标题，先计算所有行的最大宽度用于整体居中
    let endTitleStartX = 0;
    if (isEndTitle) {
      let maxLineWidth = 0;

      // 计算最大行宽度
      for (let i = 0; i < topTitleLines.length; i++) {
        const line = topTitleLines[i];
        const lineParsedChars = this.parseKeywords(line);
        const lineDisplayChars = lineParsedChars.map((pc) => pc.char);

        let lineWidth = 0;
        const isEnglishLine = this.isEnglishOnly(line);

        if (isEnglishLine) {
          // 英文行：计算实际宽度（考虑单词间距）
          for (let j = 0; j < lineDisplayChars.length; j++) {
            lineWidth += this.calculateEnglishCharSpacing(
              line,
              topTitleFontSize,
              j,
              lineDisplayChars
            );
          }
        } else {
          // 中文行：使用固定间距（结尾标题增加30%间距）
          const endTitleCharSpacing =
            topTitleFontSize *
            CONFIG_SPACING.GLOBAL_TITLE_CHAR_SPACING_FACTOR *
            1.3;
          lineWidth = lineDisplayChars.length * endTitleCharSpacing;
        }

        maxLineWidth = Math.max(maxLineWidth, lineWidth);
      }

      // 计算整体居中的起始位置
      const availableWidth =
        videoWidth -
        CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT -
        CONFIG_SPACING.GLOBAL_TITLE_MARGIN_RIGHT;

      if (maxLineWidth > availableWidth) {
        // 标题过长，在可用区域内居中
        endTitleStartX =
          CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT +
          Math.floor((availableWidth - maxLineWidth) / 2);
        console.log(
          `[结尾标题] 标题过长 (${maxLineWidth}px > ${availableWidth}px)，在可用区域内居中: ${endTitleStartX}px`
        );
      } else {
        // 标题适中，在整个屏幕宽度内居中
        const centerX = Math.floor((videoWidth - maxLineWidth) / 2);
        const minX = CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT;
        const maxX =
          videoWidth - CONFIG_SPACING.GLOBAL_TITLE_MARGIN_RIGHT - maxLineWidth;
        endTitleStartX = Math.max(minX, Math.min(centerX, maxX));
        console.log(
          `[结尾标题] 标题适中，居中显示: ${endTitleStartX}px (中心: ${centerX}px)`
        );
      }
    }

    for (let lineIndex = 0; lineIndex < topTitleLines.length; lineIndex++) {
      const line = topTitleLines[lineIndex];

      // 解析这一行的关键词，获取实际显示的字符
      const lineParsedChars = this.parseKeywords(line);
      const lineDisplayChars = lineParsedChars.map((pc) => pc.char);

      // 检测当前行是否为纯英文
      const isEnglishLine = this.isEnglishOnly(line);
      console.log(
        `[DEBUG] 行 ${lineIndex + 1}: "${line}" - 英文检测: ${isEnglishLine}`
      );

      let startX;
      if (isEndTitle) {
        // 结尾标题：整体居中但每行左对齐
        startX = endTitleStartX; // 所有行使用相同的左起始位置
      } else {
        // 普通标题：每行单独居中，需要计算实际行宽度
        let lineWidth = 0;
        if (isEnglishLine) {
          // 英文行：计算实际宽度（考虑单词间距）
          for (let i = 0; i < lineDisplayChars.length; i++) {
            lineWidth += this.calculateEnglishCharSpacing(
              line,
              topTitleFontSize,
              i,
              lineDisplayChars
            );
          }
        } else {
          // 中文行：使用固定间距
          const charSpacing =
            topTitleFontSize * CONFIG_SPACING.GLOBAL_TITLE_CHAR_SPACING_FACTOR;
          lineWidth = lineDisplayChars.length * charSpacing;
        }

        // 计算可用宽度（减去左右边距）
        const availableWidth =
          videoWidth -
          CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT -
          CONFIG_SPACING.GLOBAL_TITLE_MARGIN_RIGHT;

        // 如果标题宽度超过可用宽度，则水平居中在可用区域内
        if (lineWidth > availableWidth) {
          // 标题过长，在可用区域内居中
          const centerInAvailable =
            CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT +
            Math.floor((availableWidth - lineWidth) / 2);
          startX = centerInAvailable;
          console.log(
            `[标题] 标题过长 (${lineWidth}px > ${availableWidth}px)，在可用区域内居中: ${startX}px`
          );
        } else {
          // 标题适中，在整个屏幕宽度内居中
          const centerX = Math.floor((videoWidth - lineWidth) / 2);
          const minX = CONFIG_SPACING.GLOBAL_TITLE_MARGIN_LEFT;
          const maxX =
            videoWidth - CONFIG_SPACING.GLOBAL_TITLE_MARGIN_RIGHT - lineWidth;
          startX = Math.max(minX, Math.min(centerX, maxX));
          console.log(
            `[标题] 标题适中，居中显示: ${startX}px (中心: ${centerX}px)`
          );
        }
      }

      let currentX = startX;

      for (let charIndex = 0; charIndex < lineParsedChars.length; charIndex++) {
        const parsedChar = lineParsedChars[charIndex];
        const char = parsedChar.char;

        if (char.trim() === "") {
          globalCharIndex++;
          continue;
        }

        // 确定字符样式（使用解析出的关键词信息和titleFontConfig）
        const isKeyword = parsedChar.isKeyword;
        let styleName = isKeyword ? "TopTitleKeyword" : "TopTitle";
        let inlineStyle = "";

        // 如果有titleFontConfig，应用对应行的字体配置
        if (titleFontConfig && Array.isArray(titleFontConfig)) {
          let lineConfig = null;
          if (lineIndex < titleFontConfig.length) {
            lineConfig = titleFontConfig[lineIndex];
          } else if (titleFontConfig.length > 0) {
            // 如果行数超过配置数量，使用最后一个配置
            lineConfig = titleFontConfig[titleFontConfig.length - 1];
          }

          if (lineConfig) {
            const fontStyle = this.convertCSSToFFmpegStyle(
              lineConfig.style,
              lineConfig.font
            );
            // 使用内联样式覆盖
            inlineStyle = `{\\fn${fontStyle.fontname}\\fs${fontStyle.fontsize}\\c${fontStyle.primaryColour}\\b${fontStyle.bold}}`;
          }
        }

        // 转义字符
        const escapedChar = char.replace(/{/g, "\\{").replace(/}/g, "\\}");

        // 计算字符位置
        const charX = currentX;
        const charY = startY + lineIndex * lineSpacing;

        // 打字机效果特殊处理
        if (
          this.animationType ===
          CONFIG_TITLE_ANIMATION.ANIMATION_TYPES.TYPEWRITER
        ) {
          // 计算每个字符的显示时间
          const totalChars = topTitleCleanCharIndex;
          const charDuration = duration / totalChars; // 每个字符占用的时间
          const charStartTime = startTime + globalCharIndex * charDuration;
          const charEndTime = startTime + duration; // 显示到结束

          const animationEffect = this.generateTypewriterAnimation(
            charX,
            charY,
            duration,
            videoWidth
          );
          ass += `Dialogue: 0,${toAssTime(charStartTime)},${toAssTime(charEndTime)},${styleName},,0,0,0,,${inlineStyle}${animationEffect}${escapedChar}\n`;
        } else {
          // 其他动画效果
          const animationEffect = this.generateAnimation(
            charX,
            charY,
            duration,
            videoWidth
          );
          const endTime = startTime + duration;
          ass += `Dialogue: 0,${toAssTime(startTime)},${toAssTime(endTime)},${styleName},,0,0,0,,${inlineStyle}${animationEffect}${escapedChar}\n`;
        }

        // 计算下一个字符的间距
        let nextCharSpacing;
        if (isEnglishLine) {
          // 英文行：使用智能间距计算
          nextCharSpacing = this.calculateEnglishCharSpacing(
            line,
            topTitleFontSize,
            charIndex,
            lineDisplayChars
          );
        } else {
          // 中文行：使用固定间距
          if (isEndTitle) {
            nextCharSpacing =
              topTitleFontSize *
              CONFIG_SPACING.GLOBAL_TITLE_CHAR_SPACING_FACTOR *
              1.3; // 结尾标题增加30%字符间距
          } else {
            nextCharSpacing =
              topTitleFontSize *
              CONFIG_SPACING.GLOBAL_TITLE_CHAR_SPACING_FACTOR;
          }
        }

        currentX += nextCharSpacing;
        globalCharIndex++;
      }
    }

    console.log(
      `[3/5] 顶部标题已添加: "${topTitle}" (贯穿全视频，${topTitleLines.length}行，${topTitleCleanCharIndex}个字符，动画类型: ${this.animationType})`
    );

    return ass;
  }

  /**
   * 生成底部免责声明ASS字幕
   * @param {string} disclaimerText - 免责声明文本
   * @param {number} duration - 视频时长（秒）
   * @param {number} videoWidth - 视频宽度
   * @param {number} videoHeight - 视频高度
   * @param {function} wrapCJK - 中文换行函数
   * @param {function} toAssTime - 时间转换函数
   * @returns {string} ASS字幕内容
   */
  generateDisclaimerASS(
    disclaimerText,
    duration,
    videoWidth,
    videoHeight,
    wrapCJK,
    toAssTime
  ) {
    if (!disclaimerText) return "";

    const fontSize = CONFIG_SUBTITLE.FONT_SIZE_DISCLAIMER;
    const marginLeft = CONFIG_SPACING.DISCLAIMER_MARGIN_LEFT;
    const marginRight = CONFIG_SPACING.DISCLAIMER_MARGIN_RIGHT;
    const positionYPercent = CONFIG_SPACING.DISCLAIMER_POSITION_Y_PERCENT;

    // 计算可用宽度和每行字符数
    const availableWidth = videoWidth - marginLeft - marginRight;
    const charWidth = fontSize * 0.8; // 字符宽度估算
    const maxCharsPerLine = Math.floor(availableWidth / charWidth);

    // 换行处理
    let disclaimerLines;
    if (typeof wrapCJK === "function") {
      disclaimerLines = wrapCJK(disclaimerText, maxCharsPerLine);
    } else {
      // 简单的换行处理
      disclaimerLines = disclaimerText.split("\n");
    }

    // 确保返回的是数组
    if (!Array.isArray(disclaimerLines)) {
      disclaimerLines = [disclaimerText];
    }

    // 计算垂直位置（底部10%位置）
    const baseY = Math.floor(videoHeight * positionYPercent);
    const lineHeight = fontSize + 10; // 行高
    const totalHeight = disclaimerLines.length * lineHeight;
    const startY = baseY - totalHeight / 2;

    let ass = "";

    // 为每行生成字幕，分别处理英文和中文确保颜色一致
    disclaimerLines.forEach((line, lineIndex) => {
      const currentY = startY + lineIndex * lineHeight;
      const centerX = videoWidth / 2; // 居中显示

      // 分离英文和中文，分别设置样式
      let processedLine = "";
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === " ") {
          processedLine += " ";
        } else if (/[A-Za-z0-9]/.test(char)) {
          // 英文字符使用Arial字体，调整字体大小以匹配中文，添加斜体
          const englishFontSize = Math.round(fontSize * 0.85); // 英文字体调小15%以匹配中文
          processedLine += `{\\fn Arial\\fs${englishFontSize}\\i1\\1c&HFFFFFF&\\3c&H000000&\\1a&H00&\\3a&H00&\\b1}${char}{\\r}`;
        } else {
          // 中文字符强制使用相同颜色、字体大小和斜体
          processedLine += `{\\fs${fontSize}\\i1\\1c&HFFFFFF&\\3c&H000000&\\1a&H00&\\3a&H00&\\b1}${char}{\\r}`;
        }
      }

      // 基础样式
      const baseStyle = `{\\pos(${centerX},${currentY})\\an2\\fs${fontSize}\\bord2\\shad0}`;
      ass += `Dialogue: 0,${toAssTime(0)},${toAssTime(duration)},Default,,0,0,0,,${baseStyle}${processedLine}\n`;
    });

    console.log(
      `[3/5] 底部免责声明已添加: "${disclaimerText}" (${disclaimerLines.length}行，字体大小: ${fontSize}px，正常字体)`
    );

    return ass;
  }
}
