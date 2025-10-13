#!/usr/bin/env node
import 'zx/globals';
import path from 'path';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';

/**
 * 2D转3D视频工具
 * 支持多种3D输出格式
 */

/**
 * 执行命令的辅助函数
 * @param {string} command - 要执行的命令
 * @returns {Object} - {stdout: string, stderr: string}
 */
function execCommand(command) {
  try {
    const stdout = execSync(command, { encoding: 'utf8' });
    return { stdout, stderr: '' };
  } catch (error) {
    return { stdout: '', stderr: error.message };
  }
}

// 3D转换模式
const CONVERT_3D_MODES = {
  'anaglyph-red-cyan': {
    name: '红蓝3D',
    description: '红蓝3D眼镜效果（最常见，需要红蓝眼镜观看）',
    method: 'anaglyph',
    params: 'arcg'
  },
  'anaglyph-green-magenta': {
    name: '绿品红3D',
    description: '绿品红3D眼镜效果（需要绿品红眼镜）',
    method: 'anaglyph',
    params: 'agmg'
  },
  'anaglyph-yellow-blue': {
    name: '黄蓝3D',
    description: '黄蓝3D眼镜效果',
    method: 'anaglyph',
    params: 'aybd'
  },
  'side-by-side': {
    name: '左右并排3D',
    description: '左右并排3D（适合VR设备、3D电视）',
    method: 'sbs',
    params: 'sbs2l'
  },
  'side-by-side-full': {
    name: '左右并排3D（全宽）',
    description: '左右并排3D全宽版本',
    method: 'sbs',
    params: 'sbsl'
  },
  'top-bottom': {
    name: '上下3D',
    description: '上下3D（适合部分3D电视）',
    method: 'tb',
    params: 'tb2l'
  },
  'top-bottom-full': {
    name: '上下3D（全高）',
    description: '上下3D全高版本',
    method: 'tb',
    params: 'tbl'
  }
};

/**
 * 列出所有3D转换模式
 */
function list3DModes() {
  console.log('\n🎬 可用的3D转换模式：\n');
  
  const categories = {
    '红蓝3D（需要眼镜）': ['anaglyph-red-cyan', 'anaglyph-green-magenta', 'anaglyph-yellow-blue'],
    '并排3D（VR/3D电视）': ['side-by-side', 'side-by-side-full'],
    '上下3D（3D电视）': ['top-bottom', 'top-bottom-full']
  };
  
  for (const [category, modes] of Object.entries(categories)) {
    console.log(`\n${category}:`);
    modes.forEach(modeId => {
      const mode = CONVERT_3D_MODES[modeId];
      console.log(`  ${modeId.padEnd(25)} - ${mode.name}`);
      console.log(`  ${''.padEnd(25)}   ${mode.description}`);
    });
  }
  
  console.log('\n💡 使用方法：');
  console.log('  npx node-ffmpeg-tools convert-3d --list                    # 列出所有模式');
  console.log('  npx node-ffmpeg-tools convert-3d -i input.mp4 -m anaglyph-red-cyan  # 转换为红蓝3D');
  console.log('  npx node-ffmpeg-tools convert-3d                           # 使用配置文件\n');
  
  console.log('📝 注意事项：');
  console.log('  - 红蓝3D需要佩戴红蓝3D眼镜观看');
  console.log('  - 左右并排和上下格式适合3D电视或VR设备');
  console.log('  - 深度效果可通过 depth 参数调整（0.0-1.0）\n');
}

/**
 * 2D转3D转换
 */
async function convert2Dto3D(config) {
  const {
    input,
    output,
    mode = 'anaglyph-red-cyan',
    depth = 0.3, // 深度强度 0.0-1.0
    quality = 'high',
    keepAudio = true
  } = config;
  
  // 验证输入文件
  if (!input) {
    throw new Error('请指定输入视频文件路径 (input)');
  }
  
  // 检查输入文件是否存在
  try {
    await fs.access(input);
  } catch (error) {
    throw new Error(`输入文件不存在: ${input}`);
  }
  
  // 验证模式
  const modeConfig = CONVERT_3D_MODES[mode];
  if (!modeConfig) {
    throw new Error(`未找到3D转换模式: ${mode}\n使用 --list 查看所有可用模式`);
  }
  
  console.log(`🎬 使用3D转换模式: ${mode} (${modeConfig.name})`);
  console.log(`   ${modeConfig.description}`);
  console.log(`   深度强度: ${depth}`);
  
  // 生成输出文件名
  let outputPath = output;
  if (!outputPath) {
    const inputPath = path.parse(input);
    outputPath = path.join(
      'output',
      'convert-3d',
      `${inputPath.name}_3d_${mode}${inputPath.ext}`
    );
  }
  
  // 创建输出目录
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  
  // 设置编码质量
  let qualityParams;
  switch (quality) {
    case 'high':
      qualityParams = ['-crf', '18', '-preset', 'slow'];
      break;
    case 'medium':
      qualityParams = ['-crf', '23', '-preset', 'medium'];
      break;
    case 'low':
      qualityParams = ['-crf', '28', '-preset', 'fast'];
      break;
    default:
      qualityParams = ['-crf', '23', '-preset', 'medium'];
  }
  
  console.log(`\n🎬 开始转换为3D视频...`);
  console.log(`📥 输入: ${input}`);
  console.log(`📤 输出: ${outputPath}`);
  console.log(`⚙️  质量: ${quality}`);
  console.log(`🔊 音频: ${keepAudio ? '保留' : '移除'}\n`);
  
  // 构建3D转换滤镜
  // 使用偏移法创建立体效果
  const depthPixels = Math.round(depth * 20); // 转换为像素偏移
  
  let filterString;
  if (modeConfig.method === 'anaglyph') {
    // 红蓝3D：创建左右眼视图并合成
    filterString = `[0:v]split=2[left][right];` +
                  `[left]crop=iw-${depthPixels}:ih:0:0[left_crop];` +
                  `[right]crop=iw-${depthPixels}:ih:${depthPixels}:0[right_crop];` +
                  `[left_crop][right_crop]stereo3d=sbsl:${modeConfig.params}`;
  } else if (modeConfig.method === 'sbs') {
    // 左右并排：创建左右视图
    filterString = `[0:v]split=2[left][right];` +
                  `[left]crop=iw-${depthPixels}:ih:0:0,scale=iw/2:ih[left_scaled];` +
                  `[right]crop=iw-${depthPixels}:ih:${depthPixels}:0,scale=iw/2:ih[right_scaled];` +
                  `[left_scaled][right_scaled]hstack`;
  } else if (modeConfig.method === 'tb') {
    // 上下：创建上下视图
    filterString = `[0:v]split=2[top][bottom];` +
                  `[top]crop=iw:ih-${depthPixels}:0:0,scale=iw:ih/2[top_scaled];` +
                  `[bottom]crop=iw:ih-${depthPixels}:0:${depthPixels},scale=iw:ih/2[bottom_scaled];` +
                  `[top_scaled][bottom_scaled]vstack`;
  }
  
  // 构建 FFmpeg 命令
  const ffmpegArgs = [
    '-i', input,
    '-filter_complex', filterString,
    '-c:v', 'libx264',
    ...qualityParams,
    '-pix_fmt', 'yuv420p'
  ];
  
  // 处理音频
  if (keepAudio) {
    ffmpegArgs.push('-c:a', 'copy');
  } else {
    ffmpegArgs.push('-an');
  }
  
  // 添加输出文件
  ffmpegArgs.push('-y', outputPath);
  
  try {
    // 构建完整的 FFmpeg 命令字符串
    const command = `ffmpeg ${ffmpegArgs.map(arg => `"${arg}"`).join(' ')}`;
    console.log(`🔧 执行命令: ${command}`);
    
    // 执行 FFmpeg 命令
    const result = execCommand(command);
    
    if (result.stderr) {
      throw new Error(result.stderr);
    }
    
    console.log(`\n✅ 3D视频转换完成！`);
    console.log(`📁 输出文件: ${outputPath}`);
    
    // 显示文件大小
    const stats = await fs.stat(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 文件大小: ${sizeMB} MB\n`);
    
    return outputPath;
  } catch (error) {
    throw new Error(`3D转换失败: ${error.message}`);
  }
}

/**
 * 主函数
 */
export default async function runConvert3D(config) {
  try {
    await convert2Dto3D(config);
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}\n`);
    throw error;
  }
}

// 导出工具函数
export { list3DModes, CONVERT_3D_MODES };
