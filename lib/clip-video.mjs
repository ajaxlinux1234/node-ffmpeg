import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置常量
const CONFIG_PATHS = {
  INPUT_DIR: 'input/clip-video',
  OUTPUT_DIR: 'output/clip-video',
  CLIPPED_SUFFIX: '_clipped'
};

const CONFIG_VIDEO = {
  VIDEO_CODEC: 'libx264',
  PIXEL_FORMAT: 'yuv420p',
  CRF_VALUE: 12, // 高质量编码
  PRESET: 'slow', // 更好的压缩效率
  AUDIO_CODEC_AAC: 'aac',
  AUDIO_BITRATE: '320k'
};

/**
 * 执行 FFmpeg 命令
 * @param {string} command - FFmpeg 命令
 */
function execCommand(command) {
  console.log(`执行命令: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    throw new Error(`FFmpeg 命令执行失败: ${error.message}`);
  }
}

/**
 * 获取视频信息
 * @param {string} videoPath - 视频文件路径
 * @returns {Object} - 视频信息
 */
async function getVideoInfo(videoPath) {
  try {
    const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
    const result = execSync(command, { encoding: 'utf8' });
    const info = JSON.parse(result);
    
    const videoStream = info.streams.find(stream => stream.codec_type === 'video');
    const audioStream = info.streams.find(stream => stream.codec_type === 'audio');
    
    return {
      duration: parseFloat(info.format.duration),
      width: videoStream?.width || 0,
      height: videoStream?.height || 0,
      fps: eval(videoStream?.r_frame_rate || '30/1'),
      hasAudio: !!audioStream,
      format: info.format.format_name,
      size: parseInt(info.format.size || 0)
    };
  } catch (error) {
    throw new Error(`获取视频信息失败: ${error.message}`);
  }
}

/**
 * 下载远程视频文件
 * @param {string} url - 视频URL
 * @param {string} outputPath - 输出路径
 */
async function downloadVideo(url, outputPath) {
  console.log(`正在下载视频到: ${outputPath}`);
  const command = `curl -L -o "${outputPath}" "${url}"`;
  execCommand(command);
}

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} - 文件是否存在
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 裁剪单个视频
 * @param {string} inputPath - 输入视频路径
 * @param {Array} timeRange - 时间范围 [开始秒数, 结束秒数]
 * @param {string} outputPath - 输出路径
 * @param {Object} videoInfo - 视频信息
 */
async function clipSingleVideo(inputPath, timeRange, outputPath, videoInfo) {
  const [startTime, endTime] = timeRange;
  const duration = endTime - startTime;
  
  // 验证时间范围
  if (startTime < 0) {
    throw new Error(`开始时间不能小于0: ${startTime}`);
  }
  if (endTime > videoInfo.duration) {
    console.warn(`⚠️ 结束时间 ${endTime}s 超过视频总时长 ${videoInfo.duration.toFixed(2)}s，将调整为视频结束`);
    timeRange[1] = videoInfo.duration;
  }
  if (startTime >= endTime) {
    throw new Error(`开始时间 ${startTime}s 必须小于结束时间 ${endTime}s`);
  }
  
  const adjustedDuration = timeRange[1] - startTime;
  
  console.log(`裁剪视频: ${startTime}s - ${timeRange[1]}s (时长: ${adjustedDuration.toFixed(2)}s)`);
  
  // 构建FFmpeg命令
  let command = `ffmpeg -y -ss ${startTime} -i "${inputPath}" -t ${adjustedDuration}`;
  
  // 添加视频编码参数
  command += ` -c:v ${CONFIG_VIDEO.VIDEO_CODEC} -pix_fmt ${CONFIG_VIDEO.PIXEL_FORMAT} -crf ${CONFIG_VIDEO.CRF_VALUE} -preset ${CONFIG_VIDEO.PRESET}`;
  
  // 添加音频编码参数（如果有音频）
  if (videoInfo.hasAudio) {
    command += ` -c:a ${CONFIG_VIDEO.AUDIO_CODEC_AAC} -b:a ${CONFIG_VIDEO.AUDIO_BITRATE}`;
  }
  
  command += ` "${outputPath}"`;
  
  execCommand(command);
  
  // 验证输出文件
  if (!(await fileExists(outputPath))) {
    throw new Error(`裁剪失败，输出文件不存在: ${outputPath}`);
  }
  
  // 获取输出文件信息
  const outputInfo = await getVideoInfo(outputPath);
  console.log(`✅ 裁剪完成: ${outputPath}`);
  console.log(`   原始时长: ${videoInfo.duration.toFixed(2)}s → 裁剪时长: ${outputInfo.duration.toFixed(2)}s`);
  console.log(`   文件大小: ${(videoInfo.size / 1024 / 1024).toFixed(2)}MB → ${(outputInfo.size / 1024 / 1024).toFixed(2)}MB`);
  
  return outputPath;
}

/**
 * 清理临时文件
 * @param {string[]} tempFiles - 临时文件列表
 */
async function cleanupTempFiles(tempFiles) {
  for (const file of tempFiles) {
    try {
      if (await fileExists(file)) {
        await fs.remove(file);
        console.log(`已删除临时文件: ${file}`);
      }
    } catch (e) {
      console.warn(`清理临时文件失败: ${file}`, e.message);
    }
  }
}

/**
 * 主函数：执行 clip-video 命令
 * @param {Object} config - 配置对象
 */
export default async function runClipVideo(config) {
  if (!config) {
    throw new Error('缺少 clip-video 配置');
  }
  
  const { videos } = config;
  
  if (!videos || !Array.isArray(videos) || videos.length === 0) {
    throw new Error('配置中缺少 videos 数组或数组为空');
  }
  
  console.log(`\n开始处理 clip-video 任务...`);
  console.log(`视频数量: ${videos.length}`);
  
  // 显示所有视频的裁剪配置
  console.log(`\n裁剪配置:`);
  videos.forEach((video, index) => {
    const { url, timeRange } = video;
    const [start, end] = timeRange;
    const duration = end - start;
    console.log(`  ${index + 1}. ${path.basename(url)} → ${start}s-${end}s (时长: ${duration}s)`);
  });
  
  try {
    const inputDir = path.resolve(CONFIG_PATHS.INPUT_DIR);
    const outputDir = path.resolve(CONFIG_PATHS.OUTPUT_DIR);
    
    // 确保目录存在
    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    
    const tempFiles = [];
    const clippedVideos = [];
    
    // 处理每个视频
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const { url, timeRange } = video;
      
      if (!url) {
        throw new Error(`视频 ${i + 1} 缺少 url 参数`);
      }
      
      if (!timeRange || !Array.isArray(timeRange) || timeRange.length !== 2) {
        throw new Error(`视频 ${i + 1} 的 timeRange 必须是包含两个数字的数组 [开始秒数, 结束秒数]`);
      }
      
      console.log(`\n[${i + 1}/${videos.length}] 处理视频: ${url}`);
      
      let videoPath;
      
      // 判断是URL还是本地路径
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // 远程视频，需要下载
        const ts = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const tempVideoPath = path.join(inputDir, `${ts}_${randomId}.mp4`);
        
        await downloadVideo(url, tempVideoPath);
        tempFiles.push(tempVideoPath);
        videoPath = tempVideoPath;
      } else {
        // 本地视频
        const localPath = path.resolve(url);
        const exists = await fileExists(localPath);
        if (!exists) {
          throw new Error(`本地视频文件不存在: ${localPath}`);
        }
        videoPath = localPath;
        console.log(`使用本地视频: ${localPath}`);
      }
      
      // 获取视频信息
      const videoInfo = await getVideoInfo(videoPath);
      console.log(`视频信息: ${videoInfo.width}x${videoInfo.height}, ${videoInfo.fps.toFixed(2)}fps, 时长: ${videoInfo.duration.toFixed(2)}s`);
      
      // 生成输出文件名
      const videoBasename = path.basename(url, path.extname(url));
      const [startTime, endTime] = timeRange;
      const outputFilename = `${videoBasename}_${startTime}s-${endTime}s${CONFIG_PATHS.CLIPPED_SUFFIX}.mp4`;
      const outputPath = path.join(outputDir, outputFilename);
      
      // 裁剪视频
      const clippedPath = await clipSingleVideo(videoPath, timeRange, outputPath, videoInfo);
      clippedVideos.push(clippedPath);
    }
    
    // 清理临时文件
    if (tempFiles.length > 0) {
      console.log(`\n清理临时文件...`);
      await cleanupTempFiles(tempFiles);
    }
    
    console.log(`\n✅ clip-video 任务完成！`);
    console.log(`🎬 裁剪完成的视频:`);
    clippedVideos.forEach((video, index) => {
      console.log(`  ${index + 1}. ${video}`);
    });
    
    return clippedVideos;
    
  } catch (error) {
    console.error(`❌ clip-video 任务失败: ${error.message}`);
    throw error;
  }
}
