#!/usr/bin/env node
import 'zx/globals';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * 视频滤镜处理工具
 * 支持多种电影级滤镜效果
 */

// 预设滤镜配置
const FILTER_PRESETS = {
  // 电影风格滤镜
  'cinematic-warm': {
    name: '电影暖色调',
    description: '温暖的电影感，适合怀旧、温馨场景',
    filter: 'curves=vintage,eq=contrast=1.1:brightness=0.05:saturation=1.2,colorbalance=rs=0.1:gs=-0.05:bs=-0.1'
  },
  'cinematic-cool': {
    name: '电影冷色调',
    description: '冷峻的电影感，适合科幻、悬疑场景',
    filter: 'curves=vintage,eq=contrast=1.15:brightness=-0.02:saturation=0.9,colorbalance=rs=-0.1:gs=0:bs=0.15'
  },
  'cinematic-teal-orange': {
    name: '青橙电影色调',
    description: '经典好莱坞青橙色调',
    filter: 'curves=vintage,colorbalance=rs=0.15:gs=-0.05:bs=-0.1:rm=0.05:gm=0:bm=0.1,eq=contrast=1.2:saturation=1.3'
  },
  'noir': {
    name: '黑色电影',
    description: '高对比度黑白，经典黑色电影风格',
    filter: 'hue=s=0,eq=contrast=1.5:brightness=0.05:gamma=1.2'
  },
  
  // 复古滤镜
  'vintage-film': {
    name: '复古胶片',
    description: '模拟老式胶片效果',
    filter: 'curves=vintage,eq=contrast=1.1:saturation=0.8,noise=alls=10:allf=t,vignette=PI/4'
  },
  '80s-vhs': {
    name: '80年代VHS',
    description: '80年代录像带效果',
    filter: 'eq=contrast=0.9:saturation=1.5:gamma=1.1,noise=alls=15:allf=t,curves=vintage'
  },
  'sepia': {
    name: '棕褐色',
    description: '经典棕褐色老照片效果',
    filter: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131'
  },
  
  // 艺术风格
  'dramatic': {
    name: '戏剧化',
    description: '高对比度，戏剧化效果',
    filter: 'eq=contrast=1.4:brightness=0.05:saturation=1.3:gamma=1.1'
  },
  'soft-glow': {
    name: '柔光',
    description: '柔和光晕效果',
    filter: 'gblur=sigma=2,blend=all_mode=overlay:all_opacity=0.3'
  },
  'high-contrast': {
    name: '高对比度',
    description: '强烈的明暗对比',
    filter: 'eq=contrast=1.6:brightness=0.1:saturation=1.2'
  },
  'vibrant': {
    name: '鲜艳',
    description: '色彩饱和度增强',
    filter: 'eq=saturation=1.5:contrast=1.2'
  },
  
  // 色彩调整
  'warm': {
    name: '暖色调',
    description: '增加暖色调',
    filter: 'colorbalance=rs=0.2:gs=0.1:bs=-0.1,eq=saturation=1.1'
  },
  'cool': {
    name: '冷色调',
    description: '增加冷色调',
    filter: 'colorbalance=rs=-0.1:gs=0:bs=0.2,eq=saturation=1.1'
  },
  'desaturate': {
    name: '降低饱和度',
    description: '柔和的低饱和度效果',
    filter: 'eq=saturation=0.6:contrast=1.05'
  },
  
  // 黑白滤镜
  'black-white': {
    name: '黑白',
    description: '经典黑白效果',
    filter: 'hue=s=0'
  },
  'high-contrast-bw': {
    name: '高对比黑白',
    description: '高对比度黑白',
    filter: 'hue=s=0,eq=contrast=1.5:brightness=0.05'
  },
  
  // 特殊效果
  'dream': {
    name: '梦幻',
    description: '梦幻般的柔焦效果',
    filter: 'gblur=sigma=1.5,eq=brightness=0.1:saturation=1.2,colorbalance=rs=0.05:bs=0.05'
  },
  'bleach-bypass': {
    name: '漂白效果',
    description: '银盐漂白效果，高对比度低饱和',
    filter: 'eq=contrast=1.3:saturation=0.7:brightness=0.05'
  },
  'cross-process': {
    name: '交叉冲印',
    description: '交叉冲印效果，色彩偏移',
    filter: 'curves=vintage,eq=contrast=1.2:saturation=1.4,colorbalance=rs=0.1:gs=-0.05:bs=0.1'
  },
  'vignette': {
    name: '暗角',
    description: '添加暗角效果',
    filter: 'vignette=PI/3'
  },
  
  // 自然风格
  'natural': {
    name: '自然',
    description: '自然真实的色彩',
    filter: 'eq=contrast=1.05:saturation=1.05:brightness=0.02'
  },
  'vivid-nature': {
    name: '鲜艳自然',
    description: '增强自然色彩',
    filter: 'eq=contrast=1.1:saturation=1.3:brightness=0.05,colorbalance=gs=0.05'
  },
  
  // 夜景滤镜
  'night-vision': {
    name: '夜视',
    description: '夜视仪效果',
    filter: 'colorchannelmixer=rr=0:rg=1:rb=0:gr=0:gg=1:gb=0:br=0:bg=1:bb=0,eq=contrast=1.3:brightness=0.2'
  },
  'moonlight': {
    name: '月光',
    description: '月光下的蓝色调',
    filter: 'colorbalance=rs=-0.15:gs=-0.05:bs=0.2,eq=contrast=1.1:saturation=0.8:brightness=-0.1'
  },
  
  // 3D效果
  '3d-anaglyph-red-cyan': {
    name: '3D红蓝',
    description: '红蓝3D眼镜效果（最常见）',
    filter: 'stereo3d=sbsl:arcg',
    is3d: true
  },
  '3d-anaglyph-green-magenta': {
    name: '3D绿品红',
    description: '绿品红3D眼镜效果',
    filter: 'stereo3d=sbsl:agmg',
    is3d: true
  },
  '3d-side-by-side': {
    name: '3D左右',
    description: '左右并排3D（VR设备）',
    filter: 'stereo3d=sbsl:sbs2l',
    is3d: true
  },
  '3d-top-bottom': {
    name: '3D上下',
    description: '上下3D（部分3D电视）',
    filter: 'stereo3d=sbsl:tb2l',
    is3d: true
  }
};

/**
 * 列出所有可用的滤镜
 */
function listFilters() {
  console.log('\n📸 可用的视频滤镜效果：\n');
  
  const categories = {
    '电影风格': ['cinematic-warm', 'cinematic-cool', 'cinematic-teal-orange', 'noir'],
    '复古风格': ['vintage-film', '80s-vhs', 'sepia'],
    '艺术风格': ['dramatic', 'soft-glow', 'high-contrast', 'vibrant'],
    '色彩调整': ['warm', 'cool', 'desaturate'],
    '黑白效果': ['black-white', 'high-contrast-bw'],
    '特殊效果': ['dream', 'bleach-bypass', 'cross-process', 'vignette'],
    '自然风格': ['natural', 'vivid-nature'],
    '夜景效果': ['night-vision', 'moonlight'],
    '3D效果': ['3d-anaglyph-red-cyan', '3d-anaglyph-green-magenta', '3d-side-by-side', '3d-top-bottom']
  };
  
  for (const [category, filters] of Object.entries(categories)) {
    console.log(`\n${category}:`);
    filters.forEach(filterId => {
      const filter = FILTER_PRESETS[filterId];
      console.log(`  ${filterId.padEnd(25)} - ${filter.name} (${filter.description})`);
    });
  }
  
  console.log('\n💡 使用方法：');
  console.log('  npx node-ffmpeg-tools filter --list                    # 列出所有滤镜');
  console.log('  npx node-ffmpeg-tools filter --preset <name>           # 使用预设滤镜');
  console.log('  npx node-ffmpeg-tools filter --custom <filter-string>  # 使用自定义滤镜');
  console.log('  npx node-ffmpeg-tools filter                           # 使用配置文件\n');
}

/**
 * 应用滤镜到视频
 */
async function applyFilter(config) {
  const {
    input,
    output,
    preset,
    customFilter,
    quality = 'high', // high, medium, low
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
  
  // 确定使用的滤镜
  let filterString;
  if (customFilter) {
    filterString = customFilter;
    console.log(`🎨 使用自定义滤镜: ${customFilter}`);
  } else if (preset) {
    const presetConfig = FILTER_PRESETS[preset];
    if (!presetConfig) {
      throw new Error(`未找到预设滤镜: ${preset}\n使用 --list 查看所有可用滤镜`);
    }
    filterString = presetConfig.filter;
    console.log(`🎨 使用预设滤镜: ${preset} (${presetConfig.name})`);
    console.log(`   ${presetConfig.description}`);
  } else {
    throw new Error('请指定预设滤镜 (preset) 或自定义滤镜 (customFilter)');
  }
  
  // 生成输出文件名
  let outputPath = output;
  if (!outputPath) {
    const inputPath = path.parse(input);
    const filterName = preset || 'filtered';
    outputPath = path.join(
      'output',
      'filter',
      `${inputPath.name}_${filterName}${inputPath.ext}`
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
  
  console.log(`\n🎬 开始处理视频...`);
  console.log(`📥 输入: ${input}`);
  console.log(`📤 输出: ${outputPath}`);
  console.log(`⚙️  质量: ${quality}`);
  console.log(`🔊 音频: ${keepAudio ? '保留' : '移除'}\n`);
  
  // 构建 FFmpeg 命令
  const ffmpegArgs = [
    '-i', input,
    '-vf', filterString,
    '-c:v', 'libx264',
    ...qualityParams,
    '-pix_fmt', 'yuv420p'
  ];
  
  // 处理音频
  if (keepAudio) {
    // 复制音频流（如果存在），如果不存在则忽略
    ffmpegArgs.push('-c:a', 'copy');
    // 如果需要重新编码音频，可以使用：
    // ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k');
  } else {
    ffmpegArgs.push('-an');
  }
  
  // 添加输出文件
  ffmpegArgs.push('-y', outputPath);
  
  try {
    // 执行 FFmpeg 命令
    await $`ffmpeg ${ffmpegArgs}`;
    
    console.log(`\n✅ 视频处理完成！`);
    console.log(`📁 输出文件: ${outputPath}`);
    
    // 显示文件大小
    const stats = await fs.stat(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 文件大小: ${sizeMB} MB\n`);
    
    return outputPath;
  } catch (error) {
    throw new Error(`视频处理失败: ${error.message}`);
  }
}

/**
 * 主函数
 */
export default async function runFilter(config) {
  try {
    await applyFilter(config);
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}\n`);
    throw error;
  }
}

// 导出工具函数
export { listFilters, FILTER_PRESETS };
