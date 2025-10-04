import 'zx/globals';
import crypto from 'crypto';
import { execSync } from 'child_process';

// =============================================================================
// CONFIGURATION CONSTANTS - 音频提取相关的配置参数
// =============================================================================

/**
 * 文件路径配置
 */
const CONFIG_PATHS = {
  INPUT_DIR: 'input/extract-audio',
  OUTPUT_DIR: 'output/extract-audio',
  HASH_LENGTH: 12,               // URL哈希长度
  EXTRACTED_SUFFIX: '_extracted', // 提取后缀
};

/**
 * 音频格式配置
 */
const CONFIG_AUDIO = {
  // 支持的输出格式
  SUPPORTED_FORMATS: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'],
  
  // 默认配置
  DEFAULT_FORMAT: 'mp3',
  DEFAULT_QUALITY: 'high',
  
  // 质量配置
  QUALITY_SETTINGS: {
    high: {
      mp3: '-b:a 320k',
      aac: '-b:a 256k', 
      wav: '',  // 无损
      flac: '', // 无损
      ogg: '-q:a 8',
      m4a: '-b:a 256k'
    },
    medium: {
      mp3: '-b:a 192k',
      aac: '-b:a 128k',
      wav: '',
      flac: '',
      ogg: '-q:a 6',
      m4a: '-b:a 128k'
    },
    low: {
      mp3: '-b:a 128k',
      aac: '-b:a 96k',
      wav: '',
      flac: '',
      ogg: '-q:a 4',
      m4a: '-b:a 96k'
    }
  },
  
  // 编码器配置
  ENCODERS: {
    mp3: 'libmp3lame',
    aac: 'aac',
    wav: 'pcm_s16le',
    flac: 'flac',
    ogg: 'libvorbis',
    m4a: 'aac'
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
    audioCodec: audioStream?.codec_name || 'none',
    audioBitrate: audioStream?.bit_rate || 0,
    audioChannels: audioStream?.channels || 0,
    audioSampleRate: audioStream?.sample_rate || 0,
    format: info.format,
    videoStream,
    audioStream,
  };
}

/**
 * 提取音频文件
 * @param {string} videoPath - 视频文件路径
 * @param {string} outputDir - 输出目录
 * @param {Object} options - 提取选项
 * @returns {string} - 提取的音频文件路径
 */
async function extractAudio(videoPath, outputDir, options = {}) {
  const {
    format = CONFIG_AUDIO.DEFAULT_FORMAT,
    quality = CONFIG_AUDIO.DEFAULT_QUALITY,
    startTime = null,
    duration = null,
    channels = null,
    sampleRate = null
  } = options;
  
  // 验证格式
  if (!CONFIG_AUDIO.SUPPORTED_FORMATS.includes(format)) {
    throw new Error(`不支持的音频格式: ${format}。支持的格式: ${CONFIG_AUDIO.SUPPORTED_FORMATS.join(', ')}`);
  }
  
  await fs.mkdir(outputDir, { recursive: true });
  
  // 获取视频信息
  const videoInfo = await getVideoInfo(videoPath);
  if (!videoInfo.hasAudio) {
    throw new Error('视频文件不包含音频轨道');
  }
  
  console.log(`📊 原始音频信息:`);
  console.log(`  编码格式: ${videoInfo.audioCodec}`);
  console.log(`  比特率: ${Math.round(videoInfo.audioBitrate / 1000)}kbps`);
  console.log(`  声道数: ${videoInfo.audioChannels}`);
  console.log(`  采样率: ${videoInfo.audioSampleRate}Hz`);
  console.log(`  时长: ${videoInfo.duration.toFixed(2)}s`);
  
  // 生成输出文件名
  const originalVideoName = path.basename(videoPath, path.extname(videoPath));
  const ts = Date.now();
  const outputFileName = `${originalVideoName}${CONFIG_PATHS.EXTRACTED_SUFFIX}_${ts}.${format}`;
  const outputPath = path.join(outputDir, outputFileName);
  
  // 构建FFmpeg命令
  let ffmpegCmd = `ffmpeg -y -i "${videoPath}"`;
  
  // 添加时间范围参数
  if (startTime !== null) {
    ffmpegCmd += ` -ss ${startTime}`;
  }
  if (duration !== null) {
    ffmpegCmd += ` -t ${duration}`;
  }
  
  // 添加音频编码器
  const encoder = CONFIG_AUDIO.ENCODERS[format];
  ffmpegCmd += ` -c:a ${encoder}`;
  
  // 添加质量设置
  const qualityParams = CONFIG_AUDIO.QUALITY_SETTINGS[quality]?.[format] || '';
  if (qualityParams) {
    ffmpegCmd += ` ${qualityParams}`;
  }
  
  // 添加声道设置
  if (channels !== null) {
    ffmpegCmd += ` -ac ${channels}`;
  }
  
  // 添加采样率设置
  if (sampleRate !== null) {
    ffmpegCmd += ` -ar ${sampleRate}`;
  }
  
  // 只提取音频，不要视频
  ffmpegCmd += ` -vn`;
  
  // 输出文件
  ffmpegCmd += ` "${outputPath}"`;
  
  console.log(`🎵 开始提取音频...`);
  console.log(`输出格式: ${format.toUpperCase()}`);
  console.log(`音频质量: ${quality}`);
  if (startTime !== null) console.log(`开始时间: ${startTime}s`);
  if (duration !== null) console.log(`提取时长: ${duration}s`);
  if (channels !== null) console.log(`声道数: ${channels}`);
  if (sampleRate !== null) console.log(`采样率: ${sampleRate}Hz`);
  
  // 执行提取命令
  execCommand(ffmpegCmd);
  
  // 获取输出文件信息
  const outputInfo = await getVideoInfo(outputPath);
  const fileSizeMB = (await fs.stat(outputPath)).size / 1024 / 1024;
  console.log(`\n📊 提取后音频信息:`);
  console.log(`  文件大小: ${fileSizeMB.toFixed(2)} MB`);
  console.log(`  时长: ${outputInfo.duration.toFixed(2)}s`);
  
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
 * 显示支持的音频格式和质量选项
 */
function displayAudioFormats() {
  console.log('\n📋 支持的音频格式：');
  console.log('━'.repeat(60));
  
  console.log('\n🎵 音频格式：');
  CONFIG_AUDIO.SUPPORTED_FORMATS.forEach(format => {
    const encoder = CONFIG_AUDIO.ENCODERS[format];
    console.log(`  • ${format.toUpperCase().padEnd(6)} - 编码器: ${encoder}`);
  });
  
  console.log('\n🎚️  质量选项：');
  console.log('  • high   - 高质量 (MP3: 320kbps, AAC: 256kbps)');
  console.log('  • medium - 中等质量 (MP3: 192kbps, AAC: 128kbps)');
  console.log('  • low    - 低质量 (MP3: 128kbps, AAC: 96kbps)');
  
  console.log('\n⏱️  时间范围选项：');
  console.log('  • startTime - 开始时间 (秒)');
  console.log('  • duration  - 提取时长 (秒)');
  
  console.log('\n🔊 音频选项：');
  console.log('  • channels   - 声道数 (1=单声道, 2=立体声)');
  console.log('  • sampleRate - 采样率 (44100, 48000 等)');
  
  console.log('━'.repeat(60));
}

/**
 * 主函数：执行 extract-audio 命令
 * @param {Object} config - 配置对象
 */
export default async function runExtractAudio(config) {
  if (!config) {
    throw new Error('缺少 extract-audio 配置');
  }
  
  const { 
    url, 
    format = CONFIG_AUDIO.DEFAULT_FORMAT,
    quality = CONFIG_AUDIO.DEFAULT_QUALITY,
    startTime = null,
    duration = null,
    channels = null,
    sampleRate = null,
    showFormats = false
  } = config;
  
  // 如果请求显示格式信息
  if (showFormats) {
    displayAudioFormats();
    return;
  }
  
  if (!url) {
    throw new Error('配置中缺少视频 URL 或路径');
  }
  
  console.log(`\n开始处理 extract-audio 任务...`);
  console.log(`视频源: ${url}`);
  console.log(`输出格式: ${format.toUpperCase()}`);
  console.log(`音频质量: ${quality}`);
  
  try {
    const inputDir = path.resolve(CONFIG_PATHS.INPUT_DIR);
    const outputDir = path.resolve(CONFIG_PATHS.OUTPUT_DIR);
    
    // 1. 处理视频文件（下载远程视频，解析本地路径）
    console.log(`\n[1/3] 准备视频文件...`);
    let videoPath;
    let tempFiles = [];
    
    if (url.startsWith('https://') || url.startsWith('http://')) {
      // 远程视频，需要下载
      videoPath = await downloadVideo(url, inputDir);
      tempFiles.push(videoPath); // 标记为临时文件，用于后续清理
    } else {
      // 本地视频
      videoPath = resolvePath(url);
      const exists = await fs.pathExists(videoPath);
      if (!exists) {
        throw new Error(`本地视频文件不存在: ${videoPath}`);
      }
      console.log(`使用本地视频: ${videoPath}`);
    }
    
    // 2. 提取音频
    console.log(`\n[2/3] 提取音频文件...`);
    const audioPath = await extractAudio(videoPath, outputDir, {
      format,
      quality,
      startTime,
      duration,
      channels,
      sampleRate
    });
    
    // 3. 清理临时文件（仅清理下载的远程视频）
    if (tempFiles.length > 0) {
      console.log(`\n[3/3] 清理临时文件...`);
      await cleanupTempFiles(tempFiles);
    } else {
      console.log(`\n[3/3] 无需清理临时文件`);
    }
    
    console.log(`\n✅ extract-audio 任务完成！`);
    console.log(`🎵 提取的音频文件: ${audioPath}`);
    
  } catch (error) {
    console.error(`\n❌ extract-audio 任务失败:`, error.message);
    throw error;
  }
}

/**
 * 显示音频提取帮助信息
 */
export function showExtractAudioHelp() {
  console.log('\n🎵 extract-audio 音频提取使用指南');
  console.log('═'.repeat(80));
  
  console.log('\n📖 使用方法：');
  console.log('在 config.mjs 中配置 extract-audio：');
  console.log('```javascript');
  console.log('"extract-audio": {');
  console.log('  url: "视频文件路径或URL",');
  console.log('  format: "mp3",        // 输出格式');
  console.log('  quality: "high",      // 音频质量');
  console.log('  startTime: 10,        // 可选：开始时间(秒)');
  console.log('  duration: 30,         // 可选：提取时长(秒)');
  console.log('  channels: 2,          // 可选：声道数');
  console.log('  sampleRate: 44100     // 可选：采样率');
  console.log('}');
  console.log('```');
  
  displayAudioFormats();
  
  console.log('\n💡 使用场景：');
  console.log('• 提取历史人物传记视频的背景音乐');
  console.log('• 分离人声进行后期处理');
  console.log('• 转换音频格式以适配不同平台');
  console.log('• 提取特定时间段的音频片段');
  console.log('• 调整音频参数（声道、采样率等）');
  
  console.log('\n═'.repeat(80));
}
