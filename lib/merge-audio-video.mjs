import 'zx/globals';
import crypto from 'crypto';
import { execSync } from 'child_process';

// =============================================================================
// CONFIGURATION CONSTANTS - 音视频合并相关的配置参数
// =============================================================================

/**
 * 文件路径配置
 */
const CONFIG_PATHS = {
  INPUT_DIR: 'input/merge-audio-video',
  OUTPUT_DIR: 'output/merge-audio-video',
  HASH_LENGTH: 12,               // URL哈希长度
  MERGED_SUFFIX: '_merged',      // 合并后缀
};

/**
 * 音频合并配置
 */
const CONFIG_MERGE = {
  // 音频位置选项
  AUDIO_POSITIONS: ['start', 'end', 'overlay', 'replace'],
  
  // 默认配置
  DEFAULT_POSITION: 'overlay',
  DEFAULT_VOLUME: 1.0,
  DEFAULT_FADE_DURATION: 2.0,
  
  // 音频混合模式
  MIX_MODES: {
    overlay: 'overlay',    // 叠加模式（音频和视频音频混合）
    replace: 'replace',    // 替换模式（完全替换视频音频）
    start: 'start',        // 开始位置（音频从视频开始播放）
    end: 'end'            // 结束位置（音频从视频结束前开始播放）
  },
  
  // 支持的音频格式
  SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'],
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'avi', 'mov', 'mkv', 'webm'],
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
 * 下载文件到指定目录，避免重复下载
 * @param {string} url - 文件URL
 * @param {string} inputDir - 输入目录
 * @param {string} extension - 文件扩展名
 * @returns {string} - 下载的文件路径
 */
async function downloadFile(url, inputDir, extension = 'mp4') {
  await fs.mkdir(inputDir, { recursive: true });
  
  // 生成URL哈希用于识别重复下载
  const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, CONFIG_PATHS.HASH_LENGTH);
  
  // 检查是否已经下载过
  const existingFiles = await fs.readdir(inputDir).catch(() => []);
  const existingFile = existingFiles.find(file => file.includes(urlHash));
  
  if (existingFile) {
    const existingPath = path.join(inputDir, existingFile);
    console.log(`发现已下载的文件: ${existingPath}`);
    return existingPath;
  }
  
  // 下载新文件
  const ts = Date.now();
  const fileName = `${ts}_${urlHash}.${extension}`;
  const filePath = path.join(inputDir, fileName);
  
  console.log(`正在下载文件到: ${filePath}`);
  execCommand(`curl -L --fail --retry 3 --retry-delay 1 -o "${filePath}" "${url}"`);
  
  return filePath;
}

/**
 * 获取媒体文件信息
 * @param {string} filePath - 媒体文件路径
 * @returns {Object} - 媒体文件信息对象
 */
async function getMediaInfo(filePath) {
  const probe = execCommand(`ffprobe -v quiet -print_format json -show_streams -show_format "${filePath}"`);
  const info = JSON.parse(probe.stdout);
  const videoStream = info.streams.find(s => s.codec_type === 'video');
  const audioStream = info.streams.find(s => s.codec_type === 'audio');
  
  return {
    duration: parseFloat(info?.format?.duration || videoStream?.duration || audioStream?.duration || 0) || 0,
    hasVideo: !!videoStream,
    hasAudio: !!audioStream,
    videoStream,
    audioStream,
    format: info.format,
    // 视频信息
    width: videoStream?.width || 0,
    height: videoStream?.height || 0,
    fps: videoStream ? eval(videoStream?.r_frame_rate || '30/1') || 30 : 0,
    videoCodec: videoStream?.codec_name || 'none',
    // 音频信息
    audioCodec: audioStream?.codec_name || 'none',
    audioBitrate: audioStream?.bit_rate || 0,
    audioChannels: audioStream?.channels || 0,
    audioSampleRate: audioStream?.sample_rate || 0,
  };
}

/**
 * 合并音频和视频
 * @param {string} videoPath - 视频文件路径
 * @param {string} audioPath - 音频文件路径
 * @param {string} outputDir - 输出目录
 * @param {Object} options - 合并选项
 * @returns {string} - 合并后的视频文件路径
 */
async function mergeAudioVideo(videoPath, audioPath, outputDir, options = {}) {
  const {
    position = CONFIG_MERGE.DEFAULT_POSITION,
    volume = CONFIG_MERGE.DEFAULT_VOLUME,
    fadeDuration = CONFIG_MERGE.DEFAULT_FADE_DURATION,
    audioDelay = 0,
    videoDelay = 0,
    trimAudio = false,
    trimVideo = false
  } = options;
  
  // 验证位置参数
  if (!CONFIG_MERGE.AUDIO_POSITIONS.includes(position)) {
    throw new Error(`不支持的音频位置: ${position}。支持的位置: ${CONFIG_MERGE.AUDIO_POSITIONS.join(', ')}`);
  }
  
  await fs.mkdir(outputDir, { recursive: true });
  
  // 获取媒体文件信息
  const videoInfo = await getMediaInfo(videoPath);
  const audioInfo = await getMediaInfo(audioPath);
  
  console.log(`📊 视频信息:`);
  console.log(`  分辨率: ${videoInfo.width}x${videoInfo.height}`);
  console.log(`  帧率: ${videoInfo.fps}fps`);
  console.log(`  时长: ${videoInfo.duration.toFixed(2)}s`);
  console.log(`  视频编码: ${videoInfo.videoCodec}`);
  console.log(`  原始音频: ${videoInfo.hasAudio ? `${videoInfo.audioCodec}, ${Math.round(videoInfo.audioBitrate / 1000)}kbps` : '无'}`);
  
  console.log(`\n🎵 音频信息:`);
  console.log(`  时长: ${audioInfo.duration.toFixed(2)}s`);
  console.log(`  编码格式: ${audioInfo.audioCodec}`);
  console.log(`  比特率: ${Math.round(audioInfo.audioBitrate / 1000)}kbps`);
  console.log(`  声道数: ${audioInfo.audioChannels}`);
  console.log(`  采样率: ${audioInfo.audioSampleRate}Hz`);
  
  // 生成输出文件名
  const originalVideoName = path.basename(videoPath, path.extname(videoPath));
  const originalAudioName = path.basename(audioPath, path.extname(audioPath));
  const ts = Date.now();
  const outputFileName = `${originalVideoName}_${originalAudioName}${CONFIG_PATHS.MERGED_SUFFIX}_${ts}.mp4`;
  const outputPath = path.join(outputDir, outputFileName);
  
  // 构建FFmpeg命令
  let ffmpegCmd = `ffmpeg -y`;
  
  // 添加输入文件
  if (videoDelay > 0) {
    ffmpegCmd += ` -ss ${videoDelay}`;
  }
  ffmpegCmd += ` -i "${videoPath}"`;
  
  if (audioDelay > 0) {
    ffmpegCmd += ` -ss ${audioDelay}`;
  }
  ffmpegCmd += ` -i "${audioPath}"`;
  
  // 根据位置模式构建滤镜
  let filterComplex = '';
  
  switch (position) {
    case 'overlay':
      // 叠加模式：音频和视频音频混合
      if (videoInfo.hasAudio) {
        filterComplex = `[1:a]volume=${volume}[a1];[0:a][a1]amix=inputs=2:duration=longest:dropout_transition=2[aout]`;
      } else {
        // 无原音频时，需要填充音频到视频长度
        if (audioInfo.duration < videoInfo.duration) {
          filterComplex = `[1:a]volume=${volume},apad=pad_dur=${videoInfo.duration}[aout]`;
        } else {
          filterComplex = `[1:a]volume=${volume}[aout]`;
        }
      }
      ffmpegCmd += ` -filter_complex "${filterComplex}" -map 0:v -map "[aout]"`;
      break;
      
    case 'replace':
      // 替换模式：完全替换视频音频
      if (audioInfo.duration < videoInfo.duration) {
        // 音频比视频短，需要填充到视频长度
        filterComplex = `[1:a]volume=${volume},apad=pad_dur=${videoInfo.duration}[aout]`;
      } else {
        filterComplex = `[1:a]volume=${volume}[aout]`;
      }
      ffmpegCmd += ` -filter_complex "${filterComplex}" -map 0:v -map "[aout]"`;
      break;
      
    case 'start':
      // 开始位置：音频从视频开始播放
      if (audioInfo.duration > videoInfo.duration) {
        // 音频比视频长，裁剪音频到视频长度
        filterComplex = `[1:a]atrim=duration=${videoInfo.duration},volume=${volume}[aout]`;
      } else {
        // 音频比视频短，需要处理剩余时间
        if (videoInfo.hasAudio) {
          // 有原音频：音频播放完后继续播放原音频
          filterComplex = `[1:a]volume=${volume}[a1];[0:a]volume=0.5,adelay=${audioInfo.duration * 1000}|${audioInfo.duration * 1000}[a0];[a1][a0]amix=inputs=2:duration=longest[aout]`;
        } else {
          // 无原音频：填充静音到视频长度
          filterComplex = `[1:a]volume=${volume},apad=pad_dur=${videoInfo.duration}[aout]`;
        }
      }
      ffmpegCmd += ` -filter_complex "${filterComplex}" -map 0:v -map "[aout]"`;
      break;
      
    case 'end':
      // 结束位置：音频从视频结束前开始播放
      const startTime = Math.max(0, videoInfo.duration - audioInfo.duration);
      if (videoInfo.hasAudio) {
        // 有原音频：保持视频长度，在结束前添加音频
        filterComplex = `[0:a]volume=0.5[a0];[1:a]volume=${volume},adelay=${startTime * 1000}|${startTime * 1000}[a1];[a0][a1]amix=inputs=2:duration=longest[aout]`;
      } else {
        // 无原音频：在视频结束前添加音频，保持视频长度
        filterComplex = `[1:a]volume=${volume},adelay=${startTime * 1000}|${startTime * 1000},apad=pad_dur=${videoInfo.duration}[aout]`;
      }
      ffmpegCmd += ` -filter_complex "${filterComplex}" -map 0:v -map "[aout]" -t ${videoInfo.duration}`;
      break;
  }
  
  // 添加编码参数
  ffmpegCmd += ` -c:v libx264 -crf 18 -preset medium`;
  ffmpegCmd += ` -c:a aac -b:a 192k`;
  
  // 添加时长控制（仅在用户明确要求时）
  if (trimVideo && videoInfo.duration > audioInfo.duration && position !== 'end') {
    ffmpegCmd += ` -t ${audioInfo.duration}`;
  } else if (trimAudio && audioInfo.duration > videoInfo.duration && position !== 'start' && position !== 'overlay' && position !== 'replace') {
    ffmpegCmd += ` -t ${videoInfo.duration}`;
  }
  
  // 输出文件
  ffmpegCmd += ` "${outputPath}"`;
  
  console.log(`\n🔄 开始合并音视频...`);
  console.log(`合并模式: ${position}`);
  console.log(`音频音量: ${volume}`);
  if (audioDelay > 0) console.log(`音频延迟: ${audioDelay}s`);
  if (videoDelay > 0) console.log(`视频延迟: ${videoDelay}s`);
  
  // 执行合并命令
  console.log(`执行命令: ${ffmpegCmd}`);
  execCommand(ffmpegCmd);
  
  // 获取输出文件信息
  const outputInfo = await getMediaInfo(outputPath);
  const fileSizeMB = (await fs.stat(outputPath)).size / 1024 / 1024;
  console.log(`\n📊 合并后视频信息:`);
  console.log(`  文件大小: ${fileSizeMB.toFixed(2)} MB`);
  console.log(`  时长: ${outputInfo.duration.toFixed(2)}s`);
  console.log(`  分辨率: ${outputInfo.width}x${outputInfo.height}`);
  console.log(`  音频: ${outputInfo.audioCodec}, ${Math.round(outputInfo.audioBitrate / 1000)}kbps`);
  
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
 * 显示支持的合并模式和选项
 */
function displayMergeOptions() {
  console.log('\n📋 支持的音视频合并模式：');
  console.log('━'.repeat(60));
  
  console.log('\n🎵 音频位置模式：');
  console.log('  • overlay  - 叠加模式（音频与视频原音频混合）');
  console.log('  • replace  - 替换模式（完全替换视频原音频）');
  console.log('  • start    - 开始位置（音频从视频开始播放）');
  console.log('  • end      - 结束位置（音频从视频结束前开始播放）');
  
  console.log('\n🔊 音频参数：');
  console.log('  • volume        - 音频音量 (0.0-2.0, 默认: 1.0)');
  console.log('  • fadeDuration  - 淡入淡出时长 (秒, 默认: 2.0)');
  console.log('  • audioDelay    - 音频延迟 (秒, 默认: 0)');
  console.log('  • videoDelay    - 视频延迟 (秒, 默认: 0)');
  
  console.log('\n⏱️  时长控制：');
  console.log('  • trimAudio  - 裁剪音频到视频长度 (true/false)');
  console.log('  • trimVideo  - 裁剪视频到音频长度 (true/false)');
  
  console.log('\n📁 支持的格式：');
  console.log(`  • 音频: ${CONFIG_MERGE.SUPPORTED_AUDIO_FORMATS.join(', ')}`);
  console.log(`  • 视频: ${CONFIG_MERGE.SUPPORTED_VIDEO_FORMATS.join(', ')}`);
  
  console.log('━'.repeat(60));
}

/**
 * 主函数：执行 merge-audio-video 命令
 * @param {Object} config - 配置对象
 */
export default async function runMergeAudioVideo(config) {
  if (!config) {
    throw new Error('缺少 merge-audio-video 配置');
  }
  
  const { 
    videoUrl,
    audioUrl,
    position = CONFIG_MERGE.DEFAULT_POSITION,
    volume = CONFIG_MERGE.DEFAULT_VOLUME,
    fadeDuration = CONFIG_MERGE.DEFAULT_FADE_DURATION,
    audioDelay = 0,
    videoDelay = 0,
    trimAudio = false,
    trimVideo = false,
    showOptions = false
  } = config;
  
  // 如果请求显示选项信息
  if (showOptions) {
    displayMergeOptions();
    return;
  }
  
  if (!videoUrl || !audioUrl) {
    throw new Error('配置中缺少视频URL (videoUrl) 或音频URL (audioUrl)');
  }
  
  console.log(`\n开始处理 merge-audio-video 任务...`);
  console.log(`视频源: ${videoUrl}`);
  console.log(`音频源: ${audioUrl}`);
  console.log(`合并模式: ${position}`);
  console.log(`音频音量: ${volume}`);
  
  try {
    const inputDir = path.resolve(CONFIG_PATHS.INPUT_DIR);
    const outputDir = path.resolve(CONFIG_PATHS.OUTPUT_DIR);
    
    // 1. 处理视频文件（下载远程视频，解析本地路径）
    console.log(`\n[1/4] 准备视频文件...`);
    let videoPath;
    let tempFiles = [];
    
    if (videoUrl.startsWith('https://') || videoUrl.startsWith('http://')) {
      // 远程视频，需要下载
      videoPath = await downloadFile(videoUrl, inputDir, 'mp4');
      tempFiles.push(videoPath); // 标记为临时文件
    } else {
      // 本地视频
      videoPath = resolvePath(videoUrl);
      const exists = await fs.pathExists(videoPath);
      if (!exists) {
        throw new Error(`本地视频文件不存在: ${videoPath}`);
      }
      console.log(`使用本地视频: ${videoPath}`);
    }
    
    // 2. 处理音频文件（下载远程音频，解析本地路径）
    console.log(`\n[2/4] 准备音频文件...`);
    let audioPath;
    
    if (audioUrl.startsWith('https://') || audioUrl.startsWith('http://')) {
      // 远程音频，需要下载
      const audioExt = path.extname(audioUrl).substring(1) || 'mp3';
      audioPath = await downloadFile(audioUrl, inputDir, audioExt);
      tempFiles.push(audioPath); // 标记为临时文件
    } else {
      // 本地音频
      audioPath = resolvePath(audioUrl);
      const exists = await fs.pathExists(audioPath);
      if (!exists) {
        throw new Error(`本地音频文件不存在: ${audioPath}`);
      }
      console.log(`使用本地音频: ${audioPath}`);
    }
    
    // 3. 合并音视频
    console.log(`\n[3/4] 合并音视频文件...`);
    const mergedPath = await mergeAudioVideo(videoPath, audioPath, outputDir, {
      position,
      volume,
      fadeDuration,
      audioDelay,
      videoDelay,
      trimAudio,
      trimVideo
    });
    
    // 4. 清理临时文件（仅清理下载的远程文件）
    if (tempFiles.length > 0) {
      console.log(`\n[4/4] 清理临时文件...`);
      await cleanupTempFiles(tempFiles);
    } else {
      console.log(`\n[4/4] 无需清理临时文件`);
    }
    
    console.log(`\n✅ merge-audio-video 任务完成！`);
    console.log(`🎬 合并后视频文件: ${mergedPath}`);
    
  } catch (error) {
    console.error(`\n❌ merge-audio-video 任务失败:`, error.message);
    throw error;
  }
}

/**
 * 显示音视频合并帮助信息
 */
export function showMergeAudioVideoHelp() {
  console.log('\n🎬 merge-audio-video 音视频合并使用指南');
  console.log('═'.repeat(80));
  
  console.log('\n📖 使用方法：');
  console.log('在 config.mjs 中配置 merge-audio-video：');
  console.log('```javascript');
  console.log('"merge-audio-video": {');
  console.log('  videoUrl: "path/to/video.mp4",    // 视频文件路径或URL');
  console.log('  audioUrl: "path/to/audio.mp3",    // 音频文件路径或URL');
  console.log('  position: "overlay",              // 音频位置模式');
  console.log('  volume: 1.0,                      // 音频音量');
  console.log('  audioDelay: 0,                    // 音频延迟(秒)');
  console.log('  videoDelay: 0,                    // 视频延迟(秒)');
  console.log('  trimAudio: false,                 // 裁剪音频');
  console.log('  trimVideo: false                  // 裁剪视频');
  console.log('}');
  console.log('```');
  
  displayMergeOptions();
  
  console.log('\n💡 使用场景：');
  console.log('• 为历史人物传记视频添加背景音乐');
  console.log('• 为无声视频添加旁白或解说');
  console.log('• 替换视频原有音频轨道');
  console.log('• 在视频开头或结尾添加音频片段');
  console.log('• 音频与视频的精确时间同步');
  
  console.log('\n🎯 模式选择建议：');
  console.log('• overlay - 适合添加背景音乐，保留原有对话');
  console.log('• replace - 适合完全替换音频，如添加旁白');
  console.log('• start   - 适合开场音乐或介绍音频');
  console.log('• end     - 适合结尾音乐或总结音频');
  
  console.log('\n═'.repeat(80));
}
