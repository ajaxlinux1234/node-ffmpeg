#!/usr/bin/env node

/**
 * 声音克隆功能测试脚本
 * 测试所有TTS引擎和声音克隆功能
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const testDir = 'output/voice-clone-test';

async function runTest() {
  console.log('🧪 开始声音克隆功能测试...\n');

  // 确保测试目录存在
  await fs.ensureDir(testDir);

  const tests = [
    {
      name: '基础TTS测试 (pyttsx3)',
      command: `python lib/tts_helper.py --text "这是pyttsx3引擎测试" --output "${testDir}/test_pyttsx3.wav" --engine pyttsx3`
    },
    {
      name: '高质量TTS测试 (gTTS)',
      command: `python lib/tts_helper.py --text "这是Google TTS引擎测试" --output "${testDir}/test_gtts.wav" --engine gtts --language zh`
    },
    {
      name: '神经语音TTS测试 (Edge TTS)',
      command: `python lib/tts_helper.py --text "这是微软Edge TTS引擎测试" --output "${testDir}/test_edge.wav" --engine edge --language zh`
    },
    {
      name: '声音风格模拟测试 (Edge TTS + 参考音频)',
      command: `python lib/tts_helper.py --text "这是声音风格模拟测试，使用参考音频" --output "${testDir}/test_style.wav" --engine edge --language zh --speaker_wav "music/20251112-孙中山_extracted_1762957677092.mp3"`
    },
    {
      name: '自动引擎选择测试',
      command: `python lib/tts_helper.py --text "这是自动引擎选择测试" --output "${testDir}/test_auto.wav" --engine auto --language zh`
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      execSync(test.command, { stdio: 'pipe' });
      
      // 检查文件是否生成
      const outputFile = test.command.match(/--output "([^"]+)"/)[1];
      if (await fs.pathExists(outputFile)) {
        const stats = await fs.stat(outputFile);
        if (stats.size > 1000) { // 至少1KB
          console.log(`✅ ${test.name} - 成功 (${(stats.size / 1024).toFixed(2)} KB)`);
          passedTests++;
        } else {
          console.log(`❌ ${test.name} - 文件太小 (${stats.size} bytes)`);
        }
      } else {
        console.log(`❌ ${test.name} - 文件未生成`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - 失败: ${error.message.split('\n')[0]}`);
    }
    console.log('');
  }

  // 测试完整的声音克隆流程
  console.log('🎭 测试完整声音克隆流程...');
  try {
    execSync('npx node-ffmpeg-tools voice-clone', { stdio: 'pipe' });
    
    // 检查克隆结果
    const clonedFiles = await fs.readdir('output/voice-clone');
    const clonedVoices = clonedFiles.filter(f => f.startsWith('cloned_voice_'));
    
    if (clonedVoices.length >= 3) {
      console.log(`✅ 声音克隆流程测试 - 成功 (生成了 ${clonedVoices.length} 个文件)`);
      passedTests++;
      totalTests++;
    } else {
      console.log(`❌ 声音克隆流程测试 - 文件数量不足 (${clonedVoices.length}/3)`);
      totalTests++;
    }
  } catch (error) {
    console.log(`❌ 声音克隆流程测试 - 失败: ${error.message.split('\n')[0]}`);
    totalTests++;
  }

  // 输出测试结果
  console.log('\n📊 测试结果汇总:');
  console.log(`通过测试: ${passedTests}/${totalTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！声音克隆功能完全正常！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查相关配置。');
  }

  // 显示可用引擎
  console.log('\n🔧 可用TTS引擎:');
  try {
    const result = execSync('python lib/tts_helper.py --list_models', { encoding: 'utf8' });
    console.log(result);
  } catch (error) {
    console.log('无法获取引擎列表');
  }
}

runTest().catch(console.error);
