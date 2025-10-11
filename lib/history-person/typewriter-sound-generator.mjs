// =============================================================================
// TYPEWRITER SOUND GENERATOR - 打字机音效生成器
// =============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * 生成打字机音效
 */
export class TypewriterSoundGenerator {
  constructor() {
    this.soundsDir = path.join(process.cwd(), 'sounds');
  }

  /**
   * 确保音效目录存在
   */
  async ensureSoundsDir() {
    try {
      await fs.mkdir(this.soundsDir, { recursive: true });
    } catch (error) {
      // 目录已存在，忽略错误
    }
  }

  /**
   * 生成单个打字机敲击音效
   * @param {string} outputPath - 输出文件路径
   * @returns {Promise<string>} 生成的音效文件路径
   */
  async generateSingleKeystroke(outputPath) {
    await this.ensureSoundsDir();
    
    // 使用 FFmpeg 生成一个短促的敲击声
    // 组合多个频率创造更真实的打字机声音
    const command = `ffmpeg -y -f lavfi -i "sine=frequency=800:duration=0.05" -f lavfi -i "sine=frequency=1200:duration=0.03" -f lavfi -i "sine=frequency=400:duration=0.02" -filter_complex "[0:a][1:a][2:a]amix=inputs=3:duration=shortest:dropout_transition=0,volume=0.3,highpass=f=200,lowpass=f=3000" -t 0.08 -ar 44100 -ac 1 "${outputPath}"`;
    
    try {
      await execAsync(command);
      console.log(`✅ 打字机敲击音效已生成: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error(`❌ 生成打字机音效失败:`, error.message);
      throw error;
    }
  }

  /**
   * 生成打字机音效序列
   * @param {number} charCount - 字符数量
   * @param {number} duration - 总时长（秒）
   * @param {string} outputPath - 输出文件路径
   * @returns {Promise<string>} 生成的音效文件路径
   */
  async generateTypewriterSequence(charCount, duration, outputPath) {
    await this.ensureSoundsDir();
    
    // 计算每个字符的时间间隔
    const interval = duration / charCount;
    
    // 生成单个敲击音效
    const singleKeystrokePath = path.join(this.soundsDir, 'single_keystroke.wav');
    await this.generateSingleKeystroke(singleKeystrokePath);
    
    // 创建音效序列
    let filterComplex = '';
    let inputs = '';
    
    for (let i = 0; i < charCount; i++) {
      const delay = (i * interval).toFixed(3);
      inputs += `-i "${singleKeystrokePath}" `;
      
      const delayMs = Math.round(parseFloat(delay) * 1000); // 转换为毫秒
      if (i === 0) {
        filterComplex += `[0:a]adelay=${delayMs}|${delayMs}[a0];`;
      } else {
        filterComplex += `[${i}:a]adelay=${delayMs}|${delayMs}[a${i}];`;
      }
    }
    
    // 混合所有音效
    const mixInputs = Array.from({length: charCount}, (_, i) => `[a${i}]`).join('');
    filterComplex += `${mixInputs}amix=inputs=${charCount}:duration=longest:dropout_transition=0,volume=0.8`;
    
    const command = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -t ${duration + 1} -ar 44100 -ac 1 "${outputPath}"`;
    
    try {
      await execAsync(command);
      console.log(`✅ 打字机音效序列已生成: ${outputPath} (${charCount}个字符, ${duration}秒)`);
      
      // 清理临时文件
      await fs.unlink(singleKeystrokePath).catch(() => {});
      
      return outputPath;
    } catch (error) {
      console.error(`❌ 生成打字机音效序列失败:`, error.message);
      throw error;
    }
  }

  /**
   * 生成变化的打字机音效（更真实）
   * @param {number} charCount - 字符数量
   * @param {number} duration - 总时长（秒）
   * @param {string} outputPath - 输出文件路径
   * @returns {Promise<string>} 生成的音效文件路径
   */
  async generateVariedTypewriterSequence(charCount, duration, outputPath) {
    await this.ensureSoundsDir();
    
    const interval = duration / charCount;
    let filterComplex = '';
    let inputs = '';
    
    for (let i = 0; i < charCount; i++) {
      const delay = (i * interval).toFixed(3);
      
      // 为每个敲击生成略微不同的音效
      const freq1 = 800 + (Math.random() - 0.5) * 200; // 600-1000Hz
      const freq2 = 1200 + (Math.random() - 0.5) * 300; // 1050-1350Hz
      const freq3 = 400 + (Math.random() - 0.5) * 100; // 350-450Hz
      const volume = (0.25 + Math.random() * 0.15) * 10; // 2.5-4.0 (提升10倍)
      
      inputs += `-f lavfi -i "sine=frequency=${freq1}:duration=0.05" -f lavfi -i "sine=frequency=${freq2}:duration=0.03" -f lavfi -i "sine=frequency=${freq3}:duration=0.02" `;
      
      const baseIndex = i * 3;
      const delayMs = Math.round(parseFloat(delay) * 1000); // 转换为毫秒
      filterComplex += `[${baseIndex}:a][${baseIndex + 1}:a][${baseIndex + 2}:a]amix=inputs=3:duration=shortest,volume=${volume},adelay=${delayMs}|${delayMs}[a${i}];`;
    }
    
    // 混合所有音效
    const mixInputs = Array.from({length: charCount}, (_, i) => `[a${i}]`).join('');
    filterComplex += `${mixInputs}amix=inputs=${charCount}:duration=longest:dropout_transition=0,highpass=f=200,lowpass=f=3000`;
    
    const command = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -t ${duration + 1} -ar 44100 -ac 1 "${outputPath}"`;
    
    try {
      await execAsync(command);
      console.log(`✅ 变化打字机音效已生成: ${outputPath} (${charCount}个字符, ${duration}秒)`);
      return outputPath;
    } catch (error) {
      console.error(`❌ 生成变化打字机音效失败:`, error.message);
      throw error;
    }
  }
}
