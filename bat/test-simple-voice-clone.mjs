#!/usr/bin/env node

/**
 * 简化的声音克隆测试脚本
 * 直接测试高级声音克隆功能
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

async function testAdvancedVoiceCloning() {
  console.log('🎭 测试高级声音克隆功能...\n');

  const referenceAudio = 'music/20251112-孙中山_extracted_1762957677092.mp3';
  const testTexts = [
    "这是高级声音克隆测试，第一段文本。",
    "这是高级声音克隆测试，第二段文本。",
    "这是高级声音克隆测试，第三段文本。"
  ];

  // 检查参考音频
  if (!await fs.pathExists(referenceAudio)) {
    console.log(`❌ 参考音频文件不存在: ${referenceAudio}`);
    return;
  }

  console.log(`✅ 找到参考音频: ${referenceAudio}`);
  
  // 确保输出目录存在
  const outputDir = 'output/voice-clone-test';
  await fs.ensureDir(outputDir);

  let successCount = 0;
  
  for (let i = 0; i < testTexts.length; i++) {
    const text = testTexts[i];
    const outputFile = path.join(outputDir, `advanced_clone_${i + 1}.wav`);
    
    try {
      console.log(`\n[${i + 1}/${testTexts.length}] 测试文本: "${text.substring(0, 30)}..."`);
      
      // 直接调用高级声音克隆脚本
      const command = `python lib/voice_cloning_advanced.py --text "${text}" --output "${outputFile}" --reference "${referenceAudio}"`;
      
      console.log(`🚀 执行命令: ${command}`);
      
      execSync(command, { stdio: 'inherit' });
      
      // 检查输出文件
      if (await fs.pathExists(outputFile)) {
        const stats = await fs.stat(outputFile);
        console.log(`✅ 生成成功: ${path.basename(outputFile)} (${(stats.size / 1024).toFixed(2)} KB)`);
        successCount++;
      } else {
        console.log(`❌ 文件未生成: ${outputFile}`);
      }
      
    } catch (error) {
      console.log(`❌ 生成失败: ${error.message}`);
    }
  }

  // 测试结果
  console.log('\n📊 测试结果汇总:');
  console.log(`成功生成: ${successCount}/${testTexts.length}`);
  console.log(`成功率: ${((successCount / testTexts.length) * 100).toFixed(1)}%`);

  if (successCount > 0) {
    console.log('\n🎉 高级声音克隆功能正常工作！');
    
    // 显示生成的文件
    console.log('\n📁 生成的文件:');
    const files = await fs.readdir(outputDir);
    for (const file of files.filter(f => f.startsWith('advanced_clone_'))) {
      const filePath = path.join(outputDir, file);
      const stats = await fs.stat(filePath);
      console.log(`  ${file} - ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
    // 简单的音频质量检查
    console.log('\n🔍 音频质量检查:');
    for (const file of files.filter(f => f.startsWith('advanced_clone_'))) {
      const filePath = path.join(outputDir, file);
      const stats = await fs.stat(filePath);
      
      // 基于文件大小的简单质量评估
      let quality = '未知';
      if (stats.size > 500000) {  // > 500KB
        quality = '✅ 高质量';
      } else if (stats.size > 100000) {  // > 100KB
        quality = '⚠️ 中等质量';
      } else if (stats.size > 10000) {   // > 10KB
        quality = '❌ 低质量';
      } else {
        quality = '💀 质量极差';
      }
      
      console.log(`  ${file}: ${quality} (${(stats.size / 1024).toFixed(2)} KB)`);
    }
    
  } else {
    console.log('\n❌ 高级声音克隆功能存在问题，请检查配置。');
  }
}

// 测试基本的音频特征分析
async function testAudioAnalysis() {
  console.log('\n🔬 测试音频特征分析...');
  
  const referenceAudio = 'music/20251112-孙中山_extracted_1762957677092.mp3';
  
  try {
    const result = execSync(`python -c "
import librosa
import numpy as np

try:
    y, sr = librosa.load('${referenceAudio.replace(/\\/g, '/')}', sr=22050)
    print(f'音频加载成功: 采样率={sr}, 时长={len(y)/sr:.2f}秒')
    
    # 基本统计
    print(f'音频数据: min={np.min(y):.4f}, max={np.max(y):.4f}, mean={np.mean(y):.4f}')
    
    # 尝试提取基频
    f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=80, fmax=400)
    voiced_frames = np.sum(voiced_flag)
    total_frames = len(voiced_flag)
    print(f'基频分析: 有声帧={voiced_frames}/{total_frames} ({voiced_frames/total_frames*100:.1f}%)')
    
    if voiced_frames > 0:
        f0_mean = np.nanmean(f0[voiced_flag])
        print(f'平均基频: {f0_mean:.2f} Hz')
    else:
        print('未检测到有声段落')
        
except Exception as e:
    print(f'分析失败: {e}')
"`, { encoding: 'utf8' });

    console.log('✅ 音频分析结果:');
    console.log(result);
    
  } catch (error) {
    console.log('❌ 音频分析失败:', error.message);
  }
}

async function main() {
  await testAdvancedVoiceCloning();
  await testAudioAnalysis();
}

main().catch(console.error);
