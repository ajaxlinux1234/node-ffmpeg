#!/usr/bin/env node

/**
 * 声音克隆质量验证脚本
 * 验证生成的声音是否与原始音频在音色上保持一致
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const testResults = {
  referenceAudio: 'music/20251112-孙中山_extracted_1762957677092.mp3',
  clonedFiles: [],
  analysisResults: {},
  qualityScore: 0
};

async function analyzeAudioFeatures(audioPath) {
  try {
    console.log(`🔍 分析音频特征: ${path.basename(audioPath)}`);
    
    const result = execSync(`python -c "
import librosa
import numpy as np
import sys

try:
    # 加载音频
    y, sr = librosa.load('${audioPath.replace(/\\/g, '/')}', sr=22050)
    
    # 提取基频
    f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=80, fmax=400)
    f0_mean = np.nanmean(f0[voiced_flag]) if np.any(voiced_flag) else 0
    f0_std = np.nanstd(f0[voiced_flag]) if np.any(voiced_flag) else 0
    
    # 提取频谱质心
    spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    spectral_centroid_mean = np.mean(spectral_centroids)
    
    # 提取MFCC特征
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_mean = np.mean(mfccs, axis=1)
    
    # 提取零交叉率
    zcr = librosa.feature.zero_crossing_rate(y)[0]
    zcr_mean = np.mean(zcr)
    
    # 提取能量
    rms = librosa.feature.rms(y=y)[0]
    rms_mean = np.mean(rms)
    
    print(f'F0_MEAN:{f0_mean:.2f}')
    print(f'F0_STD:{f0_std:.2f}')
    print(f'SPECTRAL_CENTROID:{spectral_centroid_mean:.2f}')
    print(f'ZCR_MEAN:{zcr_mean:.6f}')
    print(f'RMS_MEAN:{rms_mean:.6f}')
    print(f'DURATION:{len(y)/sr:.2f}')
    
except Exception as e:
    print(f'ERROR:{str(e)}')
    sys.exit(1)
"`, { encoding: 'utf8' });

    const features = {};
    const lines = result.trim().split('\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key === 'ERROR') {
          throw new Error(value);
        }
        features[key.toLowerCase()] = parseFloat(value);
      }
    }
    
    return features;
  } catch (error) {
    console.log(`❌ 音频分析失败: ${error.message}`);
    return null;
  }
}

function calculateSimilarityScore(refFeatures, clonedFeatures) {
  if (!refFeatures || !clonedFeatures) return 0;
  
  let totalScore = 0;
  let validFeatures = 0;
  
  // 基频相似度 (权重: 40%)
  if (refFeatures.f0_mean > 0 && clonedFeatures.f0_mean > 0) {
    const f0_diff = Math.abs(refFeatures.f0_mean - clonedFeatures.f0_mean);
    const f0_similarity = Math.max(0, 1 - (f0_diff / Math.max(refFeatures.f0_mean, clonedFeatures.f0_mean)));
    totalScore += f0_similarity * 0.4;
    validFeatures += 0.4;
  }
  
  // 频谱质心相似度 (权重: 30%)
  if (refFeatures.spectral_centroid > 0 && clonedFeatures.spectral_centroid > 0) {
    const sc_diff = Math.abs(refFeatures.spectral_centroid - clonedFeatures.spectral_centroid);
    const sc_similarity = Math.max(0, 1 - (sc_diff / Math.max(refFeatures.spectral_centroid, clonedFeatures.spectral_centroid)));
    totalScore += sc_similarity * 0.3;
    validFeatures += 0.3;
  }
  
  // 零交叉率相似度 (权重: 15%)
  if (refFeatures.zcr_mean > 0 && clonedFeatures.zcr_mean > 0) {
    const zcr_diff = Math.abs(refFeatures.zcr_mean - clonedFeatures.zcr_mean);
    const zcr_similarity = Math.max(0, 1 - (zcr_diff / Math.max(refFeatures.zcr_mean, clonedFeatures.zcr_mean)));
    totalScore += zcr_similarity * 0.15;
    validFeatures += 0.15;
  }
  
  // RMS能量相似度 (权重: 15%)
  if (refFeatures.rms_mean > 0 && clonedFeatures.rms_mean > 0) {
    const rms_diff = Math.abs(refFeatures.rms_mean - clonedFeatures.rms_mean);
    const rms_similarity = Math.max(0, 1 - (rms_diff / Math.max(refFeatures.rms_mean, clonedFeatures.rms_mean)));
    totalScore += rms_similarity * 0.15;
    validFeatures += 0.15;
  }
  
  return validFeatures > 0 ? (totalScore / validFeatures) * 100 : 0;
}

async function verifyVoiceCloning() {
  console.log('🎭 开始声音克隆质量验证...\n');
  
  // 检查参考音频
  if (!await fs.pathExists(testResults.referenceAudio)) {
    console.log(`❌ 参考音频文件不存在: ${testResults.referenceAudio}`);
    return;
  }
  
  // 查找克隆的音频文件
  const outputDir = 'output/voice-clone';
  if (!await fs.pathExists(outputDir)) {
    console.log(`❌ 输出目录不存在: ${outputDir}`);
    return;
  }
  
  const files = await fs.readdir(outputDir);
  testResults.clonedFiles = files.filter(f => f.startsWith('cloned_voice_') && f.endsWith('.wav'));
  
  if (testResults.clonedFiles.length === 0) {
    console.log('❌ 未找到克隆的音频文件');
    return;
  }
  
  console.log(`📁 找到 ${testResults.clonedFiles.length} 个克隆音频文件`);
  
  // 分析参考音频
  console.log('\n📊 分析参考音频特征...');
  const refFeatures = await analyzeAudioFeatures(testResults.referenceAudio);
  
  if (!refFeatures) {
    console.log('❌ 无法分析参考音频特征');
    return;
  }
  
  console.log('✅ 参考音频特征:');
  console.log(`   基频: ${refFeatures.f0_mean?.toFixed(2) || 'N/A'} Hz`);
  console.log(`   频谱质心: ${refFeatures.spectral_centroid?.toFixed(2) || 'N/A'} Hz`);
  console.log(`   零交叉率: ${refFeatures.zcr_mean?.toFixed(6) || 'N/A'}`);
  console.log(`   RMS能量: ${refFeatures.rms_mean?.toFixed(6) || 'N/A'}`);
  
  // 分析克隆音频
  console.log('\n📊 分析克隆音频特征...');
  let totalSimilarity = 0;
  let validFiles = 0;
  
  for (const file of testResults.clonedFiles) {
    const filePath = path.join(outputDir, file);
    const clonedFeatures = await analyzeAudioFeatures(filePath);
    
    if (clonedFeatures) {
      const similarity = calculateSimilarityScore(refFeatures, clonedFeatures);
      testResults.analysisResults[file] = {
        features: clonedFeatures,
        similarity: similarity
      };
      
      console.log(`\n✅ ${file}:`);
      console.log(`   基频: ${clonedFeatures.f0_mean?.toFixed(2) || 'N/A'} Hz`);
      console.log(`   频谱质心: ${clonedFeatures.spectral_centroid?.toFixed(2) || 'N/A'} Hz`);
      console.log(`   零交叉率: ${clonedFeatures.zcr_mean?.toFixed(6) || 'N/A'}`);
      console.log(`   RMS能量: ${clonedFeatures.rms_mean?.toFixed(6) || 'N/A'}`);
      console.log(`   🎯 相似度评分: ${similarity.toFixed(1)}%`);
      
      totalSimilarity += similarity;
      validFiles++;
    } else {
      console.log(`❌ ${file}: 分析失败`);
    }
  }
  
  // 计算总体质量评分
  if (validFiles > 0) {
    testResults.qualityScore = totalSimilarity / validFiles;
    
    console.log('\n📊 声音克隆质量评估结果:');
    console.log('=' .repeat(50));
    console.log(`参考音频: ${path.basename(testResults.referenceAudio)}`);
    console.log(`克隆文件数量: ${validFiles}/${testResults.clonedFiles.length}`);
    console.log(`平均相似度: ${testResults.qualityScore.toFixed(1)}%`);
    
    // 质量等级评估
    let qualityLevel, recommendation;
    if (testResults.qualityScore >= 85) {
      qualityLevel = '🌟 优秀';
      recommendation = '声音克隆质量非常高，音色高度一致';
    } else if (testResults.qualityScore >= 70) {
      qualityLevel = '✅ 良好';
      recommendation = '声音克隆质量良好，音色基本一致';
    } else if (testResults.qualityScore >= 55) {
      qualityLevel = '⚠️ 一般';
      recommendation = '声音克隆质量一般，有一定相似度但仍有差异';
    } else {
      qualityLevel = '❌ 较差';
      recommendation = '声音克隆质量较差，建议检查参考音频质量或调整参数';
    }
    
    console.log(`质量等级: ${qualityLevel}`);
    console.log(`建议: ${recommendation}`);
    
    // 保存详细报告
    const reportPath = 'output/voice-clone/quality_report.json';
    await fs.writeJson(reportPath, {
      timestamp: new Date().toISOString(),
      referenceAudio: testResults.referenceAudio,
      overallScore: testResults.qualityScore,
      qualityLevel: qualityLevel,
      recommendation: recommendation,
      referenceFeatures: refFeatures,
      clonedResults: testResults.analysisResults
    }, { spaces: 2 });
    
    console.log(`\n📄 详细报告已保存: ${reportPath}`);
    
  } else {
    console.log('\n❌ 无法分析任何克隆音频文件');
  }
}

verifyVoiceCloning().catch(console.error);
