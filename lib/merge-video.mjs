import 'zx/globals';
import crypto from 'crypto';
import { execSync } from 'child_process';

// =============================================================================
// CONFIGURATION CONSTANTS - 视频合并相关的配置参数
// =============================================================================

/**
 * 文件路径配置
 */
const CONFIG_PATHS = {
  INPUT_DIR: 'input/merge-video',
  OUTPUT_DIR: 'output/merge-video',
  HASH_LENGTH: 12,               // URL哈希长度
  MERGED_SUFFIX: '_merged',      // 合并后缀
};

/**
 * 视频处理配置
 */
const CONFIG_VIDEO = {
  CRF_VALUE: 18,                 // 视频质量参数
  PRESET_MEDIUM: 'medium',       // 编码预设
  AUDIO_BITRATE: '192k',         // 音频比特率
  VIDEO_CODEC: 'libx264',        // 视频编码器
  PIXEL_FORMAT: 'yuv420p',       // 像素格式
  AUDIO_CODEC_COPY: 'copy',      // 音频编码（复制）
  AUDIO_CODEC_AAC: 'aac',        // 音频编码（AAC）
};

/**
 * 转场效果配置
 */
const CONFIG_TRANSITIONS = {
  DEFAULT_DURATION: 1.0,         // 默认转场时长（秒）
  SUPPORTED_EFFECTS: [
    '叠化',      // fade/dissolve
    '淡入淡出',  // fade in/out
    '推拉',      // push/pull
    '擦除',      // wipe
    '无转场',    // no transition
  ],
};

/**
 * 执行命令的辅助函数，替代zx的模板字符串
 * @param {string} command - 要执行的命令
 * @returns {Object} - {stdout: string, stderr: string}
 */
function execCommand(command) {
  try {
    const stdout = execSync(command, { encoding: 'utf8' });
    return { stdout, stderr: '' };
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

/**
 * 处理路径配置，支持 https 和本地路径
 * @param {string} pathConfig - 配置中的路径
 * @returns {string} - 处理后的路径
 */
function resolvePath(pathConfig) {
  if (!pathConfig) return '';
  // 如果是 https 路径，直接返回
  if (pathConfig.startsWith('https://') || pathConfig.startsWith('http://')) {
    return pathConfig;
  }
  
  // 本地路径处理
  if (path.isAbsolute(pathConfig)) {
    return pathConfig;
  } else {
    // 相对路径，加上 process.cwd()
    return path.resolve(process.cwd(), pathConfig);
  }
}

/**
 * 下载视频到指定目录，避免重复下载
 * @param {string} url - 视频URL
 * @param {string} inputDir - 输入目录
 * @returns {string} - 下载的文件路径
 */
async function downloadVideo(url, inputDir) {
  await fs.mkdir(inputDir, { recursive: true });
  
  // 生成URL哈希用于识别重复下载
  const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, CONFIG_PATHS.HASH_LENGTH);
  
  // 检查是否已经下载过
  const existingFiles = await fs.readdir(inputDir).catch(() => []);
  const existingFile = existingFiles.find(file => file.includes(urlHash));
  
  if (existingFile) {
    const existingPath = path.join(inputDir, existingFile);
    console.log(`发现已下载的视频: ${existingPath}`);
    return existingPath;
  }
  
  // 下载新视频
  const ts = Date.now();
  const fileName = `${ts}_${urlHash}.mp4`;
  const filePath = path.join(inputDir, fileName);
  
  console.log(`正在下载视频到: ${filePath}`);
  execCommand(`curl -L --fail --retry 3 --retry-delay 1 -o "${filePath}" "${url}"`);
  
  return filePath;
}

/**
 * 获取视频信息
 * @param {string} videoPath - 视频文件路径
 * @returns {Object} - 视频信息对象
 */
async function getVideoInfo(videoPath) {
  const probe = execCommand(`ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`);
  const info = JSON.parse(probe.stdout);
  const videoStream = info.streams.find(s => s.codec_type === 'video');
  const audioStream = info.streams.find(s => s.codec_type === 'audio');
  
  return {
    width: videoStream?.width || 0,
    height: videoStream?.height || 0,
    duration: parseFloat(info?.format?.duration || videoStream?.duration || 0) || 0,
    fps: eval(videoStream?.r_frame_rate || '30/1') || 30,
    hasAudio: !!audioStream,
    format: info.format,
    videoStream,
    audioStream,
  };
}

/**
 * 生成转场效果的FFmpeg滤镜
 * @param {string} effect - 转场效果名称
 * @param {number} duration - 转场时长
 * @param {number} offset - 转场开始时间偏移
 * @returns {string} - FFmpeg滤镜字符串
 */
function generateTransitionFilter(effect, duration, offset) {
  switch (effect) {
    case '叠化':
    case 'fade':
    case 'dissolve':
      return `xfade=transition=fade:duration=${duration}:offset=${offset}`;
    
    case '淡入淡出':
    case 'fadeinout':
      return `xfade=transition=fadein:duration=${duration}:offset=${offset}`;
    
    case '推拉':
    case 'push':
      return `xfade=transition=slideleft:duration=${duration}:offset=${offset}`;
    
    case '擦除':
    case 'wipe':
      return `xfade=transition=wipeleft:duration=${duration}:offset=${offset}`;
    
    case '无转场':
    case 'none':
    default:
      return null; // 无转场效果
  }
}

/**
 * 合并多个视频文件
 * @param {string[]} videoPaths - 视频文件路径数组
 * @param {string} transitionEffect - 转场效果
 * @param {string} outputDir - 输出目录
 * @returns {string} - 合并后的视频路径
 */
async function mergeVideos(videoPaths, transitionEffect, outputDir) {
  if (!videoPaths || videoPaths.length === 0) {
    throw new Error('没有提供视频文件');
  }
  
  if (videoPaths.length === 1) {
    console.log('只有一个视频文件，直接复制到输出目录');
    const singleVideoPath = videoPaths[0];
    const outputPath = path.join(outputDir, `single_video${CONFIG_PATHS.MERGED_SUFFIX}.mp4`);
    execCommand(`cp "${singleVideoPath}" "${outputPath}"`);
    return outputPath;
  }
  
  await fs.mkdir(outputDir, { recursive: true });
  
  console.log(`开始合并 ${videoPaths.length} 个视频文件，转场效果: ${transitionEffect}`);
  
  // 获取第一个视频的信息作为参考
  const firstVideoInfo = await getVideoInfo(videoPaths[0]);
  console.log(`参考视频信息: ${firstVideoInfo.width}x${firstVideoInfo.height}, ${firstVideoInfo.fps}fps, 时长: ${firstVideoInfo.duration}s`);
  
  const ts = Date.now();
  const outputPath = path.join(outputDir, `merged_${ts}${CONFIG_PATHS.MERGED_SUFFIX}.mp4`);
  
  if (transitionEffect === '无转场' || transitionEffect === 'none') {
    // 无转场效果，直接拼接
    console.log('使用无转场拼接模式');
    
    // 创建文件列表
    const fileListPath = path.join(outputDir, `filelist_${ts}.txt`);
    const fileListContent = videoPaths.map(p => `file '${path.resolve(p)}'`).join('\n');
    await fs.writeFile(fileListPath, fileListContent, 'utf8');
    
    // 使用concat demuxer进行无转场拼接
    execCommand(`ffmpeg -y -f concat -safe 0 -i "${fileListPath}" -c copy "${outputPath}"`);
    
    // 清理临时文件
    await fs.remove(fileListPath).catch(() => {});
  } else {
    // 有转场效果，使用xfade滤镜
    console.log(`使用转场效果: ${transitionEffect}`);
    
    const transitionDuration = CONFIG_TRANSITIONS.DEFAULT_DURATION;
    let filterComplex = '';
    let inputs = '';
    
    // 构建输入参数
    for (let i = 0; i < videoPaths.length; i++) {
      inputs += `-i "${videoPaths[i]}" `;
    }
    
    // 检查所有视频是否都有音频
    const videoInfos = [];
    let hasAudio = true;
    for (const videoPath of videoPaths) {
      const info = await getVideoInfo(videoPath);
      videoInfos.push(info);
      if (!info.hasAudio) {
        hasAudio = false;
      }
    }
    
    console.log(`音频检测结果: ${hasAudio ? '所有视频都有音频' : '部分或全部视频无音频'}`);
    
    // 构建滤镜链
    if (videoPaths.length === 2) {
      // 两个视频的简单情况
      const videoInfo1 = videoInfos[0];
      const offset = Math.max(0, videoInfo1.duration - transitionDuration);
      const transitionFilter = generateTransitionFilter(transitionEffect, transitionDuration, offset);
      
      if (transitionFilter) {
        if (hasAudio) {
          filterComplex = `-filter_complex "[0:v][1:v]${transitionFilter}[v];[0:a][1:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[a]" -map "[v]" -map "[a]"`;
        } else {
          filterComplex = `-filter_complex "[0:v][1:v]${transitionFilter}[v]" -map "[v]"`;
        }
      } else {
        if (hasAudio) {
          filterComplex = '-filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v];[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[v]" -map "[a]"';
        } else {
          filterComplex = '-filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]"';
        }
      }
    } else {
      // 多个视频的复杂情况，逐步合并
      console.log('多视频合并，使用逐步处理方式');
      
      // 先合并前两个视频
      let currentOutput = path.join(outputDir, `temp_merge_0_${ts}.mp4`);
      const videoInfo1 = videoInfos[0];
      const offset = Math.max(0, videoInfo1.duration - transitionDuration);
      const transitionFilter = generateTransitionFilter(transitionEffect, transitionDuration, offset);
      
      if (transitionFilter) {
        if (hasAudio) {
          execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]${transitionFilter}[v];[0:a][1:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`);
        } else {
          execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]${transitionFilter}[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} "${currentOutput}"`);
        }
      } else {
        if (hasAudio) {
          execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v];[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`);
        } else {
          execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} "${currentOutput}"`);
        }
      }
      
      // 逐步合并剩余视频
      for (let i = 2; i < videoPaths.length; i++) {
        const nextOutput = i === videoPaths.length - 1 ? outputPath : path.join(outputDir, `temp_merge_${i-1}_${ts}.mp4`);
        const currentInfo = await getVideoInfo(currentOutput);
        const nextVideoInfo = videoInfos[i];
        const nextOffset = Math.max(0, currentInfo.duration - transitionDuration);
        const nextTransitionFilter = generateTransitionFilter(transitionEffect, transitionDuration, nextOffset);
        
        // 检查当前输出和下一个视频是否都有音频
        const currentHasAudio = currentInfo.hasAudio && nextVideoInfo.hasAudio;
        
        if (nextTransitionFilter) {
          if (currentHasAudio) {
            execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]${nextTransitionFilter}[v];[0:a][1:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`);
          } else {
            execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]${nextTransitionFilter}[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} "${nextOutput}"`);
          }
        } else {
          if (currentHasAudio) {
            execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v];[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`);
          } else {
            execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} "${nextOutput}"`);
          }
        }
        
        // 清理上一个临时文件
        if (i > 2) {
          await fs.remove(currentOutput).catch(() => {});
        }
        currentOutput = nextOutput;
      }
      
      // 清理最后一个临时文件
      if (videoPaths.length > 2) {
        const lastTempFile = path.join(outputDir, `temp_merge_0_${ts}.mp4`);
        await fs.remove(lastTempFile).catch(() => {});
      }
      
      return outputPath;
    }
    
    // 执行合并命令（两个视频的情况）
    if (hasAudio) {
      execCommand(`ffmpeg -y ${inputs} ${filterComplex} -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${outputPath}"`);
    } else {
      execCommand(`ffmpeg -y ${inputs} ${filterComplex} -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET_MEDIUM} "${outputPath}"`);
    }
  }
  
  console.log(`视频合并完成: ${outputPath}`);
  return outputPath;
}

/**
 * 清理临时文件
 * @param {string[]} tempFiles - 临时文件路径数组
 */
async function cleanupTempFiles(tempFiles) {
  console.log(`正在清理临时文件...`);
  for (const file of tempFiles) {
    try {
      if (await fs.pathExists(file)) {
        await fs.remove(file);
        console.log(`已删除临时文件: ${file}`);
      }
    } catch (e) {
      console.warn(`清理临时文件失败: ${file}`, e.message);
    }
  }
}

/**
 * 主函数：执行 merge-video 命令
 * @param {Object} config - 配置对象
 */
export default async function runMergeVideo(config) {
  if (!config) {
    throw new Error('缺少 merge-video 配置');
  }
  
  const { urls, switch: transitionEffect } = config;
  
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    throw new Error('配置中缺少 urls 数组或数组为空');
  }
  
  const effectName = transitionEffect || '叠化';
  
  if (!CONFIG_TRANSITIONS.SUPPORTED_EFFECTS.includes(effectName)) {
    console.warn(`不支持的转场效果: ${effectName}，使用默认效果: 叠化`);
  }
  
  console.log(`\n开始处理 merge-video 任务...`);
  console.log(`视频数量: ${urls.length}`);
  console.log(`转场效果: ${effectName}`);
  console.log(`视频列表:`);
  urls.forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`);
  });
  
  try {
    const inputDir = path.resolve(CONFIG_PATHS.INPUT_DIR);
    const outputDir = path.resolve(CONFIG_PATHS.OUTPUT_DIR);
    
    // 1. 处理所有视频（下载远程视频，解析本地路径）
    console.log(`\n[1/3] 准备视频文件...`);
    const videoPaths = [];
    const tempFiles = [];
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`处理视频 ${i + 1}/${urls.length}: ${url}`);
      
      if (url.startsWith('https://') || url.startsWith('http://')) {
        // 远程视频，需要下载
        const downloadedPath = await downloadVideo(url, inputDir);
        videoPaths.push(downloadedPath);
        tempFiles.push(downloadedPath); // 标记为临时文件，用于后续清理
      } else {
        // 本地视频
        const localPath = resolvePath(url);
        const exists = await fs.pathExists(localPath);
        if (!exists) {
          throw new Error(`本地视频文件不存在: ${localPath}`);
        }
        videoPaths.push(localPath);
        console.log(`使用本地视频: ${localPath}`);
      }
    }
    
    // 2. 合并视频
    console.log(`\n[2/3] 合并视频文件...`);
    const mergedVideoPath = await mergeVideos(videoPaths, effectName, outputDir);
    
    // 3. 清理临时文件（仅清理下载的远程视频）
    if (tempFiles.length > 0) {
      console.log(`\n[3/3] 清理临时文件...`);
      await cleanupTempFiles(tempFiles);
    } else {
      console.log(`\n[3/3] 无需清理临时文件`);
    }
    
    console.log(`\n✅ merge-video 任务完成！`);
    console.log(`🎬 合并后视频: ${mergedVideoPath}`);
    
    // 显示最终视频信息
    try {
      const finalInfo = await getVideoInfo(mergedVideoPath);
      console.log(`📊 最终视频信息: ${finalInfo.width}x${finalInfo.height}, ${finalInfo.fps}fps, 时长: ${finalInfo.duration.toFixed(2)}s`);
    } catch (e) {
      console.warn('无法获取最终视频信息:', e.message);
    }
    
  } catch (error) {
    console.error(`\n❌ merge-video 任务失败:`, error.message);
    throw error;
  }
}
