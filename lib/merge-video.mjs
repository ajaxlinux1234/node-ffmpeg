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
  CRF_VALUE: 12,                 // 视频质量参数 (降低到12，接近无损)
  PRESET: 'slow',                // 编码预设 (改为slow，更好的压缩效率)
  AUDIO_BITRATE: '320k',         // 音频比特率 (提高到320k，更高音质)
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
    // 历史人物专用转场效果
    '时光流转',  // 适合时间跨度大的历史事件衔接
    '岁月如歌',  // 适合人物成长历程的温馨转场
    '历史回眸',  // 适合重要历史时刻的庄重转场
    '命运转折',  // 适合人物命运转折点的戏剧性转场
    '精神传承',  // 适合表现精神品质传承的升华转场
    '时代变迁',  // 适合不同历史时期的宏大转场
    '心路历程',  // 适合内心世界变化的细腻转场
    '光影交错',  // 适合现实与回忆交织的艺术转场
  ],
  // 历史人物转场效果的应用场景说明
  HISTORICAL_SCENES: {
    '时光流转': '适用于跨越多年的人生阶段转换，如从童年到青年、从求学到工作等重要人生节点',
    '岁月如歌': '适用于温馨的成长历程，如家庭生活、求学经历、师生情谊等温暖时光的衔接',
    '历史回眸': '适用于重大历史事件的庄重呈现，如重要发现、历史性时刻、国家大事等严肃场景',
    '命运转折': '适用于人物命运的重大转折，如人生选择、事业转向、历史机遇等戏剧性时刻',
    '精神传承': '适用于表现人物精神品质的传承，如师承关系、价值观传递、精神财富延续',
    '时代变迁': '适用于不同历史时期的宏大叙事，如社会变革、时代背景转换、历史进程推进',
    '心路历程': '适用于人物内心世界的细腻变化，如思想觉悟、情感波动、心理成长过程',
    '光影交错': '适用于现实与回忆的交织呈现，如追忆往昔、对比今昔、时空穿越效果'
  }
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
    
    // 历史人物专用转场效果
    case '时光流转':
      // 圆形缩放转场，象征时间的流逝和轮回
      return `xfade=transition=zoomin:duration=${duration}:offset=${offset}`;
    
    case '岁月如歌':
      // 温柔的快速淡化转场，营造温馨氛围
      return `xfade=transition=fadefast:duration=${duration}:offset=${offset}`;
    
    case '历史回眸':
      // 庄重的垂直擦除，象征历史的厚重
      return `xfade=transition=wipeup:duration=${duration}:offset=${offset}`;
    
    case '命运转折':
      // 对角线转场，象征命运的转折
      return `xfade=transition=diagtl:duration=${duration}:offset=${offset}`;
    
    case '精神传承':
      // 圆形扩散转场，象征精神的传播
      return `xfade=transition=circleopen:duration=${duration}:offset=${offset}`;
    
    case '时代变迁':
      // 水平推拉转场，象征时代的推进
      return `xfade=transition=slideright:duration=${duration}:offset=${offset}`;
    
    case '心路历程':
      // 柔和的白色淡化，表现内心的细腻变化
      return `xfade=transition=fadewhite:duration=${duration}:offset=${offset}`;
    
    case '光影交错':
      // 径向转场效果，营造回忆与现实交织的感觉
      return `xfade=transition=radial:duration=${duration}:offset=${offset}`;
    
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
async function mergeVideos(videoPaths, transitionEffects, outputDir) {
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
  
  // 支持单个转场效果（向后兼容）或转场效果数组
  let effectsArray = [];
  if (Array.isArray(transitionEffects)) {
    effectsArray = transitionEffects;
  } else {
    // 向后兼容：单个转场效果
    effectsArray = new Array(videoPaths.length - 1).fill(transitionEffects);
  }
  
  console.log(`开始合并 ${videoPaths.length} 个视频文件`);
  console.log(`转场效果: ${effectsArray.join(' → ')}`);
  
  // 获取第一个视频的信息作为参考
  const firstVideoInfo = await getVideoInfo(videoPaths[0]);
  console.log(`参考视频信息: ${firstVideoInfo.width}x${firstVideoInfo.height}, ${firstVideoInfo.fps}fps, 时长: ${firstVideoInfo.duration}s`);
  
  const ts = Date.now();
  const outputPath = path.join(outputDir, `merged_${ts}${CONFIG_PATHS.MERGED_SUFFIX}.mp4`);
  
  // 检查是否所有转场都是无转场
  const allNoTransition = effectsArray.every(effect => effect === '无转场' || effect === 'none');
  
  if (allNoTransition) {
    // 无转场效果，直接拼接
    console.log('使用无转场拼接模式');
    
    // 获取所有视频的信息
    const videoInfos = [];
    let someHaveAudio = false;
    for (const videoPath of videoPaths) {
      const info = await getVideoInfo(videoPath);
      videoInfos.push(info);
      if (info.hasAudio) {
        someHaveAudio = true;
      }
    }
    
    // 检查视频分辨率是否一致
    const resolutions = videoInfos.map(info => `${info.width}x${info.height}`);
    const uniqueResolutions = [...new Set(resolutions)];
    
    // 统一转换为9:16比例
    console.log('统一所有视频为9:16比例进行拼接');
    const targetWidth = 1080;  // 9:16比例的标准宽度
    const targetHeight = 1920; // 9:16比例的标准高度
    
    // 检查是否所有视频都已经是9:16比例
    const allAre916 = videoInfos.every(info => 
      info.width === targetWidth && info.height === targetHeight
    );
    
    if (allAre916) {
      // 所有视频都是9:16，使用简单拼接
      const fileListPath = path.join(outputDir, `filelist_${ts}.txt`);
      const fileListContent = videoPaths.map(p => `file '${path.resolve(p)}'`).join('\n');
      await fs.writeFile(fileListPath, fileListContent, 'utf8');
      
      execCommand(`ffmpeg -y -f concat -safe 0 -i "${fileListPath}" -c copy "${outputPath}"`);
      
      // 清理临时文件
      await fs.remove(fileListPath).catch(() => {});
    } else {
      // 分辨率不一致，统一为9:16比例进行拼接
      console.log('检测到不同分辨率，统一为9:16比例进行拼接');
      // 使用标准的9:16比例，选择合适的分辨率
      const targetWidth = 1080;  // 9:16比例的标准宽度
      const targetHeight = 1920; // 9:16比例的标准高度
      
      let inputs = '';
      let filterComplex = '';
      
      // 构建输入和滤镜
      for (let i = 0; i < videoPaths.length; i++) {
        inputs += `-i "${videoPaths[i]}" `;
        const currentRatio = videoInfos[i].width / videoInfos[i].height;
        const targetRatio = targetWidth / targetHeight; // 9:16 = 0.5625
        
        if (videoInfos[i].width !== targetWidth || videoInfos[i].height !== targetHeight) {
          if (currentRatio > targetRatio) {
            // 视频太宽，需要左右裁剪
            const cropWidth = Math.round(videoInfos[i].height * targetRatio);
            const cropX = Math.round((videoInfos[i].width - cropWidth) / 2);
            filterComplex += `[${i}:v]crop=${cropWidth}:${videoInfos[i].height}:${cropX}:0,scale=${targetWidth}:${targetHeight},setsar=1[v${i}];`;
          } else if (currentRatio < targetRatio) {
            // 视频太高，需要上下裁剪
            const cropHeight = Math.round(videoInfos[i].width / targetRatio);
            const cropY = Math.round((videoInfos[i].height - cropHeight) / 2);
            filterComplex += `[${i}:v]crop=${videoInfos[i].width}:${cropHeight}:0:${cropY},scale=${targetWidth}:${targetHeight},setsar=1[v${i}];`;
          } else {
            // 比例相同，只需要缩放
            filterComplex += `[${i}:v]scale=${targetWidth}:${targetHeight},setsar=1[v${i}];`;
          }
        } else {
          filterComplex += `[${i}:v]setsar=1[v${i}];`;
        }
      }
      
      // 拼接视频
      filterComplex += videoPaths.map((_, i) => `[v${i}]`).join('') + `concat=n=${videoPaths.length}:v=1:a=0[v];`;
      
      // 处理音频 - 只处理有音频的视频
      if (someHaveAudio) {
        const audioInputs = [];
        for (let i = 0; i < videoPaths.length; i++) {
          if (videoInfos[i].hasAudio) {
            audioInputs.push(`[${i}:a]`);
          }
        }
        
        if (audioInputs.length > 0) {
          if (audioInputs.length === 1) {
            // 只有一个音频流，直接使用（不需要滤镜，直接映射）
            execCommand(`ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v]" -map "${audioInputs[0].replace('[', '').replace(']', '')}" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${outputPath}"`);
          } else {
            // 多个音频流，进行拼接
            filterComplex += audioInputs.join('') + `concat=n=${audioInputs.length}:v=0:a=1[a];`;
            execCommand(`ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${outputPath}"`);
          }
        } else {
          execCommand(`ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${outputPath}"`);
        }
      } else {
        execCommand(`ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${outputPath}"`);
      }
    }
  } else {
    // 有转场效果，使用xfade滤镜
    console.log(`使用转场效果: ${effectsArray.join(' → ')}`);
    
    const transitionDuration = CONFIG_TRANSITIONS.DEFAULT_DURATION;
    let filterComplex = '';
    let inputs = '';
    
    // 构建输入参数
    for (let i = 0; i < videoPaths.length; i++) {
      inputs += `-i "${videoPaths[i]}" `;
    }
    
    // 检查所有视频的音频情况
    const videoInfos = [];
    let allHaveAudio = true;
    let someHaveAudio = false;
    for (let i = 0; i < videoPaths.length; i++) {
      const videoPath = videoPaths[i];
      const info = await getVideoInfo(videoPath);
      videoInfos.push(info);
      console.log(`视频 ${i + 1} (${path.basename(videoPath)}) 音频检测: ${info.hasAudio ? '有音频' : '无音频'}`);
      if (info.hasAudio) {
        someHaveAudio = true;
      } else {
        allHaveAudio = false;
      }
    }
    
    console.log(`音频检测结果: ${allHaveAudio ? '所有视频都有音频' : someHaveAudio ? '部分视频有音频' : '所有视频都无音频'}`);
    
    // 检查视频分辨率是否一致，如果不一致则统一分辨率
    const resolutions = videoInfos.map(info => `${info.width}x${info.height}`);
    const uniqueResolutions = [...new Set(resolutions)];
    
    // 统一转换为9:16比例进行转场合并
    console.log('统一所有视频为9:16比例进行转场合并');
    const targetWidth = 1080;  // 9:16比例的标准宽度
    const targetHeight = 1920; // 9:16比例的标准高度
    
    // 检查是否需要缩放
    const needsScaling = videoInfos.some(info => 
      info.width !== targetWidth || info.height !== targetHeight
    );
    
    // 为不同分辨率的视频添加裁剪和缩放滤镜
    let scaleFilters = '';
    
    if (needsScaling) {
      for (let i = 0; i < videoPaths.length; i++) {
        const currentRatio = videoInfos[i].width / videoInfos[i].height;
        const targetRatio = targetWidth / targetHeight; // 9:16 = 0.5625
        
        if (videoInfos[i].width !== targetWidth || videoInfos[i].height !== targetHeight) {
          if (currentRatio > targetRatio) {
            // 视频太宽，需要左右裁剪
            const cropWidth = Math.round(videoInfos[i].height * targetRatio);
            const cropX = Math.round((videoInfos[i].width - cropWidth) / 2);
            scaleFilters += `[${i}:v]crop=${cropWidth}:${videoInfos[i].height}:${cropX}:0,scale=${targetWidth}:${targetHeight},setsar=1[v${i}scaled];`;
          } else if (currentRatio < targetRatio) {
            // 视频太高，需要上下裁剪
            const cropHeight = Math.round(videoInfos[i].width / targetRatio);
            const cropY = Math.round((videoInfos[i].height - cropHeight) / 2);
            scaleFilters += `[${i}:v]crop=${videoInfos[i].width}:${cropHeight}:0:${cropY},scale=${targetWidth}:${targetHeight},setsar=1[v${i}scaled];`;
          } else {
            // 比例相同，只需要缩放
            scaleFilters += `[${i}:v]scale=${targetWidth}:${targetHeight},setsar=1[v${i}scaled];`;
          }
        } else {
          scaleFilters += `[${i}:v]setsar=1[v${i}scaled];`;
        }
      }
      
      // 更新输入标签
      for (let i = 0; i < videoPaths.length; i++) {
        filterComplex = scaleFilters;
      }
    }
    
    // 构建滤镜链
    if (videoPaths.length === 2) {
      // 两个视频的简单情况
      const videoInfo1 = videoInfos[0];
      const offset = Math.max(0, videoInfo1.duration - transitionDuration);
      const transitionFilter = generateTransitionFilter(effectsArray[0], transitionDuration, offset);
      
      // 根据是否需要缩放调整滤镜输入
      const v1Input = needsScaling ? '[v0scaled]' : '[0:v]';
      const v2Input = needsScaling ? '[v1scaled]' : '[1:v]';
      
      if (transitionFilter) {
        if (allHaveAudio) {
          // 两个视频都有音频，使用音频交叉淡化
          const scalePrefix = needsScaling ? scaleFilters : '';
          filterComplex = `-filter_complex "${scalePrefix}${v1Input}${v2Input}${transitionFilter}[v];[0:a][1:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[a]" -map "[v]" -map "[a]"`;
        } else if (someHaveAudio) {
          // 部分视频有音频，需要智能处理
          const video1HasAudio = videoInfos[0].hasAudio;
          const video2HasAudio = videoInfos[1].hasAudio;
          
          if (video1HasAudio && !video2HasAudio) {
            // 第一个有音频，第二个没有：只保留第一个的音频
            const scalePrefix = needsScaling ? scaleFilters : '';
            filterComplex = `-filter_complex "${scalePrefix}${v1Input}${v2Input}${transitionFilter}[v]" -map "[v]" -map "0:a"`;
          } else if (!video1HasAudio && video2HasAudio) {
            // 第一个没音频，第二个有：只保留第二个的音频
            const scalePrefix = needsScaling ? scaleFilters : '';
            filterComplex = `-filter_complex "${scalePrefix}${v1Input}${v2Input}${transitionFilter}[v]" -map "[v]" -map "1:a"`;
          } else {
            // 都没有音频
            const scalePrefix = needsScaling ? scaleFilters : '';
            filterComplex = `-filter_complex "${scalePrefix}${v1Input}${v2Input}${transitionFilter}[v]" -map "[v]"`;
          }
        } else {
          // 都没有音频
          const scalePrefix = needsScaling ? scaleFilters : '';
          filterComplex = `-filter_complex "${scalePrefix}${v1Input}${v2Input}${transitionFilter}[v]" -map "[v]"`;
        }
      } else {
        if (allHaveAudio) {
          // 两个视频都有音频，直接拼接
          const scalePrefix = needsScaling ? scaleFilters : '';
          filterComplex = `-filter_complex "${scalePrefix}[v0scaled][v1scaled]concat=n=2:v=1:a=0[v];[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[v]" -map "[a]"`;
        } else if (someHaveAudio) {
          // 部分视频有音频，需要智能处理
          const video1HasAudio = videoInfos[0].hasAudio;
          const video2HasAudio = videoInfos[1].hasAudio;
          
          if (video1HasAudio && !video2HasAudio) {
            // 第一个有音频，第二个没有：只保留第一个的音频
            const scalePrefix = needsScaling ? scaleFilters : '';
            const videoInputs = needsScaling ? '[v0scaled][v1scaled]' : '[0:v][1:v]';
            filterComplex = `-filter_complex "${scalePrefix}${videoInputs}concat=n=2:v=1:a=0[v]" -map "[v]" -map "0:a"`;
          } else if (!video1HasAudio && video2HasAudio) {
            // 第一个没音频，第二个有：只保留第二个的音频
            const scalePrefix = needsScaling ? scaleFilters : '';
            const videoInputs = needsScaling ? '[v0scaled][v1scaled]' : '[0:v][1:v]';
            filterComplex = `-filter_complex "${scalePrefix}${videoInputs}concat=n=2:v=1:a=0[v]" -map "[v]" -map "1:a"`;
          } else {
            // 都没有音频
            const scalePrefix = needsScaling ? scaleFilters : '';
            const videoInputs = needsScaling ? '[v0scaled][v1scaled]' : '[0:v][1:v]';
            filterComplex = `-filter_complex "${scalePrefix}${videoInputs}concat=n=2:v=1:a=0[v]" -map "[v]"`;
          }
        } else {
          // 都没有音频
          const scalePrefix = needsScaling ? scaleFilters : '';
          const videoInputs = needsScaling ? '[v0scaled][v1scaled]' : '[0:v][1:v]';
          filterComplex = `-filter_complex "${scalePrefix}${videoInputs}concat=n=2:v=1:a=0[v]" -map "[v]"`;
        }
      }
    } else {
      // 多个视频的复杂情况，逐步合并
      console.log('多视频合并，使用逐步处理方式');
      
      // 先合并前两个视频
      let currentOutput = path.join(outputDir, `temp_merge_0_${ts}.mp4`);
      const videoInfo1 = videoInfos[0];
      const offset = Math.max(0, videoInfo1.duration - transitionDuration);
      const transitionFilter = generateTransitionFilter(effectsArray[0], transitionDuration, offset);
      
      // 检查前两个视频的音频情况
      const firstTwoHaveAudio = videoInfos[0].hasAudio && videoInfos[1].hasAudio;
      const firstTwoSomeHaveAudio = videoInfos[0].hasAudio || videoInfos[1].hasAudio;
      
      if (transitionFilter) {
        if (firstTwoHaveAudio) {
          execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]${transitionFilter}[v];[0:a][1:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`);
        } else if (firstTwoSomeHaveAudio) {
          // 智能处理混合音频情况
          const video1HasAudio = videoInfos[0].hasAudio;
          const video2HasAudio = videoInfos[1].hasAudio;
          
          if (video1HasAudio && !video2HasAudio) {
            execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]${transitionFilter}[v]" -map "[v]" -map "0:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`);
          } else if (!video1HasAudio && video2HasAudio) {
            execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]${transitionFilter}[v]" -map "[v]" -map "1:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`);
          }
        } else {
          execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]${transitionFilter}[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${currentOutput}"`);
        }
      } else {
        if (firstTwoHaveAudio) {
          execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v];[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`);
        } else if (firstTwoSomeHaveAudio) {
          // 智能处理混合音频情况
          const video1HasAudio = videoInfos[0].hasAudio;
          const video2HasAudio = videoInfos[1].hasAudio;
          
          if (video1HasAudio && !video2HasAudio) {
            execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -map "0:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`);
          } else if (!video1HasAudio && video2HasAudio) {
            execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -map "1:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${currentOutput}"`);
          }
        } else {
          execCommand(`ffmpeg -y -i "${videoPaths[0]}" -i "${videoPaths[1]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${currentOutput}"`);
        }
      }
      
      // 逐步合并剩余视频
      for (let i = 2; i < videoPaths.length; i++) {
        const nextOutput = i === videoPaths.length - 1 ? outputPath : path.join(outputDir, `temp_merge_${i-1}_${ts}.mp4`);
        const currentInfo = await getVideoInfo(currentOutput);
        const nextVideoInfo = videoInfos[i];
        const nextOffset = Math.max(0, currentInfo.duration - transitionDuration);
        const nextTransitionFilter = generateTransitionFilter(effectsArray[i - 1], transitionDuration, nextOffset);
        
        // 检查当前输出和下一个视频是否有音频
        const currentHasAudio = currentInfo.hasAudio || nextVideoInfo.hasAudio;
        
        if (nextTransitionFilter) {
          if (currentHasAudio) {
            // 智能音频处理：如果两个视频都有音频则交叉淡化，否则直接复制有音频的流
            if (currentInfo.hasAudio && nextVideoInfo.hasAudio) {
              execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]${nextTransitionFilter}[v];[0:a][1:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`);
            } else if (currentInfo.hasAudio) {
              execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]${nextTransitionFilter}[v]" -map "[v]" -map "0:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`);
            } else {
              execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]${nextTransitionFilter}[v]" -map "[v]" -map "1:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`);
            }
          } else {
            execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]${nextTransitionFilter}[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${nextOutput}"`);
          }
        } else {
          if (currentHasAudio) {
            // 智能音频处理：如果两个视频都有音频则连接，否则直接复制有音频的流
            if (currentInfo.hasAudio && nextVideoInfo.hasAudio) {
              execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v];[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[v]" -map "[a]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`);
            } else if (currentInfo.hasAudio) {
              execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -map "0:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`);
            } else {
              execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -map "1:a" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${nextOutput}"`);
            }
          } else {
            execCommand(`ffmpeg -y -i "${currentOutput}" -i "${videoPaths[i]}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${nextOutput}"`);
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
    if (someHaveAudio) {
      execCommand(`ffmpeg -y ${inputs} ${filterComplex} -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE} "${outputPath}"`);
    } else {
      execCommand(`ffmpeg -y ${inputs} ${filterComplex} -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET} "${outputPath}"`);
    }
  }
  
  console.log(`视频合并完成: ${outputPath}`);
  return outputPath;
}

/**
 * 获取转场效果的应用场景说明
 * @param {string} effect - 转场效果名称
 * @returns {string} - 应用场景说明
 */
function getTransitionSceneDescription(effect) {
  const description = CONFIG_TRANSITIONS.HISTORICAL_SCENES[effect];
  return description || '通用转场效果，适用于各种场景衔接';
}

/**
 * 显示所有可用的转场效果及其应用场景
 */
function displayAvailableTransitions() {
  console.log('\n📋 可用的转场效果及应用场景：');
  console.log('━'.repeat(80));
  
  // 基础转场效果
  console.log('\n🔧 基础转场效果：');
  const basicEffects = ['叠化', '淡入淡出', '推拉', '擦除', '无转场'];
  basicEffects.forEach(effect => {
    console.log(`  • ${effect.padEnd(8)} - ${getTransitionSceneDescription(effect)}`);
  });
  
  // 历史人物专用转场效果
  console.log('\n🎭 历史人物专用转场效果：');
  const historicalEffects = ['时光流转', '岁月如歌', '历史回眸', '命运转折', '精神传承', '时代变迁', '心路历程', '光影交错'];
  historicalEffects.forEach(effect => {
    console.log(`  • ${effect.padEnd(8)} - ${getTransitionSceneDescription(effect)}`);
  });
  
  console.log('━'.repeat(80));
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
  
  const { urls, switch: transitionEffect, transitions } = config;
  
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    throw new Error('配置中缺少 urls 数组或数组为空');
  }
  
  // 支持两种配置方式：
  // 1. switch: "统一转场效果" (原有方式)
  // 2. transitions: ["转场1", "转场2", ...] (新方式，为每个转场单独设置)
  let effectNames = [];
  
  if (transitions && Array.isArray(transitions)) {
    // 新方式：为每个转场单独设置效果
    effectNames = transitions;
    console.log(`使用分别设置的转场效果`);
  } else {
    // 原有方式：统一转场效果
    const effectName = transitionEffect || '叠化';
    effectNames = new Array(urls.length - 1).fill(effectName);
    console.log(`使用统一转场效果: ${effectName}`);
  }
  
  // 确保转场效果数量正确（应该比视频数量少1）
  if (effectNames.length !== urls.length - 1) {
    console.warn(`⚠️ 转场效果数量(${effectNames.length})与视频间隔数量(${urls.length - 1})不匹配`);
    // 自动调整：不足的用第一个效果填充，多余的截断
    while (effectNames.length < urls.length - 1) {
      effectNames.push(effectNames[0] || '叠化');
    }
    effectNames = effectNames.slice(0, urls.length - 1);
  }
  
  console.log(`\n开始处理 merge-video 任务...`);
  console.log(`视频数量: ${urls.length}`);
  
  // 显示转场效果配置
  console.log(`转场效果配置:`);
  effectNames.forEach((effect, index) => {
    const sceneDescription = getTransitionSceneDescription(effect);
    console.log(`  视频${index + 1} → 视频${index + 2}: ${effect} (${sceneDescription})`);
  });
  
  console.log(`\n视频列表:`);
  urls.forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`);
  });
  
  // 检查是否有不支持的转场效果
  const unsupportedEffects = effectNames.filter(effect => 
    !CONFIG_TRANSITIONS.SUPPORTED_EFFECTS.includes(effect)
  );
  
  if (unsupportedEffects.length > 0) {
    console.warn(`⚠️  发现不支持的转场效果: ${unsupportedEffects.join(', ')}`);
    displayAvailableTransitions();
    console.log(`\n不支持的效果将使用默认转场效果: 叠化`);
    
    // 替换不支持的效果
    for (let i = 0; i < effectNames.length; i++) {
      if (!CONFIG_TRANSITIONS.SUPPORTED_EFFECTS.includes(effectNames[i])) {
        effectNames[i] = '叠化';
      }
    }
  }
  
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
    const mergedVideoPath = await mergeVideos(videoPaths, effectNames, outputDir);
    
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

/**
 * 显示所有可用转场效果的帮助信息
 * 可以通过 npx node-ffmpeg-tools merge-video --help 调用
 */
export function showTransitionHelp() {
  console.log('\n🎬 merge-video 转场效果使用指南');
  console.log('═'.repeat(80));
  
  console.log('\n📖 使用方法：');
  console.log('在 config.mjs 的 merge-video 配置中设置 switch 参数：');
  console.log('```javascript');
  console.log('"merge-video": {');
  console.log('  urls: ["视频1", "视频2"],');
  console.log('  switch: "时光流转"  // 选择合适的转场效果');
  console.log('}');
  console.log('```');
  
  displayAvailableTransitions();
  
  console.log('\n💡 使用建议：');
  console.log('• 根据历史人物故事的情感基调选择合适的转场效果');
  console.log('• 重要历史时刻建议使用"历史回眸"或"命运转折"');
  console.log('• 温馨的成长历程适合使用"岁月如歌"');
  console.log('• 跨越时间的叙事推荐"时光流转"或"时代变迁"');
  console.log('• 表现精神传承时使用"精神传承"效果最佳');
  
  console.log('\n═'.repeat(80));
}
