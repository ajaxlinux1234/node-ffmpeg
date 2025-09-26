import 'zx/globals';
import crypto from 'crypto';

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
  const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
  
  // 检查是否已经下载过
  const existingFiles = await fs.readdir(inputDir).catch(() => []);
  const existingFile = existingFiles.find(file => file.includes(urlHash));
  
  if (existingFile) {
    const existingPath = path.join(inputDir, existingFile);
    console.log(`[1/5] 发现已下载的视频: ${existingPath}`);
    return existingPath;
  }
  
  // 下载新视频
  const ts = Date.now();
  const fileName = `${ts}_${urlHash}.mp4`;
  const filePath = path.join(inputDir, fileName);
  
  console.log(`[1/5] 正在下载视频到: ${filePath}`);
  await $`curl -L --fail --retry 3 --retry-delay 1 -o ${filePath} ${url}`;
  
  return filePath;
}

/**
 * 生成视频封面（使用第一帧 + 标题）
 * @param {string} videoPath - 视频文件路径
 * @param {string} title - 封面标题
 * @param {string} outputDir - 输出目录
 * @returns {string} - 封面图片路径
 */
async function generateThumbnail(videoPath, title, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  
  const videoName = path.basename(videoPath, path.extname(videoPath));
  const thumbnailPath = path.join(outputDir, `${videoName}_title.png`);
  
  console.log(`[2/5] 正在生成封面图片...`);
  
  try {
    // 获取视频信息
    const videoInfoResult = await $`ffprobe -v quiet -print_format json -show_streams ${videoPath}`;
    const videoInfo = JSON.parse(videoInfoResult.stdout);
    const videoStream = videoInfo.streams.find(s => s.codec_type === 'video');
    
    if (!videoStream) {
      throw new Error('无法获取视频流信息');
    }
    
    const width = videoStream.width;
    const height = videoStream.height;
    
    console.log(`[2/5] 原视频尺寸: ${width}x${height}`);
    
    // 由于当前 FFmpeg 版本没有 drawtext 滤镜，使用 ASS 字幕方式添加标题
    const fontSize = 80; // 字体大小改为80px
    
    // 创建临时 ASS 字幕文件用于封面标题
    const tempAssPath = path.join(outputDir, `${videoName}_cover_title.ass`);
    
    let ass = '';
    ass += `[Script Info]\n`;
    ass += `ScriptType: v4.00+\n`;
    ass += `PlayResX: ${width}\n`;
    ass += `PlayResY: ${height}\n`;
    ass += `WrapStyle: 2\n`; // 启用自动换行
    ass += `ScaledBorderAndShadow: yes\n\n`;
    
    ass += `[V4+ Styles]\n`;
    ass += `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n`;
    // 橙色文字，黑色描边，居中对齐，距离顶部80px，左右边距20px确保自动换行
    ass += `Style: Title, PingFang SC, ${fontSize}, &H0000A5FF, &H0000A5FF, &H80000000, &H80000000, 0, 0, 0, 0, 100, 100, 0, 0, 1, 3, 4, 8, 20, 20, 80, 0\n\n`;
    
    ass += `[Events]\n`;
    ass += `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
    // 显示整个视频时长的标题
    const escapedTitle = title
      .replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}');
    ass += `Dialogue: 0,0:00:00.00,0:00:01.00,Title,,0,0,0,,${escapedTitle}\n`;
    
    // 写入 ASS 文件
    const BOM = "\uFEFF";
    await fs.writeFile(tempAssPath, BOM + ass, 'utf8');
    
    // 提取第一帧并使用 subtitles 滤镜添加标题
    await $`ffmpeg -y -ss 0.1 -i ${videoPath} -vf subtitles=${tempAssPath}:original_size=${width}x${height} -vframes 1 ${thumbnailPath}`;
    
    // 清理临时 ASS 文件
    await fs.remove(tempAssPath).catch(() => {});
    
    console.log(`[2/5] 使用 ASS 字幕方式添加标题`);
    
    console.log(`[2/5] 封面图片已生成: ${thumbnailPath} (${width}x${height}, 包含标题: "${title}")`);
    return thumbnailPath;
  } catch (error) {
    console.warn(`[警告] 封面生成失败: ${error.message}，尝试生成无标题封面`);
    try {
      // 降级方案：生成无标题封面
      await $`ffmpeg -y -ss 0.1 -i ${videoPath} -vframes 1 ${thumbnailPath}`;
      console.log(`[2/5] 无标题封面图片已生成: ${thumbnailPath}`);
      return thumbnailPath;
    } catch (fallbackError) {
      console.warn(`[警告] 封面生成完全失败: ${fallbackError.message}`);
      return '';
    }
  }
}

/**
 * 为视频添加镜头标题（每5秒添加一个标题）
 * @param {string} videoPath - 视频文件路径
 * @param {Array} sectionTitles - 镜头标题数组
 * @param {string} outputDir - 输出目录
 * @returns {string} - 带标题的视频路径
 */
async function addSectionTitles(videoPath, sectionTitles, outputDir, watermark) {
  if ((!sectionTitles || sectionTitles.length === 0) && !watermark) {
    console.log(`[3/5] 没有镜头标题且未配置水印，跳过字幕生成步骤`);
    return videoPath;
  }
  
  await fs.mkdir(outputDir, { recursive: true });
  
  const videoName = path.basename(videoPath, path.extname(videoPath));
  const tempVideoPath = path.join(outputDir, `${videoName}_with_titles_temp.mp4`);
  
  console.log(`[3/5] 正在添加 ${sectionTitles.length} 个镜头标题...`);
  
  try {
    // 获取视频尺寸与时长
    const probe = await $`ffprobe -v quiet -print_format json -show_streams -show_format ${videoPath}`;
    const info = JSON.parse(probe.stdout);
    const v = info.streams.find(s => s.codec_type === 'video');
    const W = v?.width || 704;
    const H = v?.height || 1248;
    const duration = parseFloat(info?.format?.duration || v?.duration || 0) || 0;
    // 固定字体大小为 40px
    const fontSize = 60;
    
    // 创建 ASS 字幕文件，完全控制样式（顶端左对齐、20px 顶部边距、左右 5px、自动换行、鲜艳颜色、淡入淡出）
    const assPath = path.join(outputDir, `${videoName}.ass`);
    let ass = '';
    ass += `[Script Info]\n`;
    ass += `ScriptType: v4.00+\n`;
    ass += `PlayResX: ${W}\n`;
    ass += `PlayResY: ${H}\n`;
    ass += `WrapStyle: 2\n`;
    ass += `ScaledBorderAndShadow: yes\n\n`;
    
    ass += `[V4+ Styles]\n`;
    ass += `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n`;
    // 说明：ASS 颜色为 &HAABBGGRR（AA=alpha, 00不透明）。选用亮黄色文字，黑色描边+阴影。
    // Outline=3, Shadow=4 提升可读性；颜色保持亮黄，半透明黑底；顶部边距固定 60px
    ass += `Style: Title, PingFang SC, ${fontSize}, &H00FFFF00, &H0000FFFF, &H80000000, &H80000000, 0, 0, 0, 0, 100, 100, 0, 0, 1, 3, 4, 7, 20, 20, 60, 0\n\n`;
    // 水印样式（普通字体白色，极低不透明度≈0.02 -> AA≈FA），起点/中段/终点；去除描边和阴影
    // 注意：ASS 颜色为 &HAABBGGRR，AA 越接近 FF 越透明
    ass += `Style: WM_BL, Arial, 80, &HD0FFFFFF, &HD0FFFFFF, &H00000000, &H00000000, 0, 0, 0, 0, 100, 100, 0, 0, 1, 0, 0, 1, 20, 20, 20, 0\n`;
    ass += `Style: WM_M,  Arial, 80, &HD0FFFFFF, &HD0FFFFFF, &H00000000, &H00000000, 0, 0, 0, 0, 100, 100, 0, 0, 1, 0, 0, 5, 20, 20, 20, 0\n`;
    ass += `Style: WM_TR, Arial, 80, &HD0FFFFFF, &HD0FFFFFF, &H00000000, &H00000000, 0, 0, 0, 0, 100, 100, 0, 0, 1, 0, 0, 9, 20, 20, 20, 0\n\n`;
    
    ass += `[Events]\n`;
    ass += `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
    
    // 时间格式化为 h:mm:ss.cs（centiseconds）
    const toAssTime = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const cs = Math.floor((seconds % 1) * 100);
      return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${cs.toString().padStart(2,'0')}`;
    };
    
    // 更合理的 CJK 换行：只在真正需要时换行，避免过早切断
    const estCharWidthFactor = 0.8; // 每字符大约占用 fontSize * 0.8 宽度
    const safePadding = Math.ceil(fontSize * 0.3); // 适度安全边距
    const usableWidth = Math.max(200, W - 20 - 20 - safePadding * 2); // 去除左右边距并留出安全区
    const maxCharsPerLine = Math.max(12, Math.floor(usableWidth / (fontSize * estCharWidthFactor)));

    const wrapCJK = (s) => {
      // 只在文本确实过长时才换行，避免不必要的切断
      const text = String(s).trim();
      if (text.length <= maxCharsPerLine) {
        return text; // 短文本不换行
      }
      
      // 长文本按合理位置换行（优先在标点符号处）
      const lines = [];
      let remaining = text;
      
      while (remaining.length > maxCharsPerLine) {
        let cutPos = maxCharsPerLine;
        // 尝试在标点符号处切断
        for (let i = Math.min(maxCharsPerLine, remaining.length - 1); i >= maxCharsPerLine * 0.7; i--) {
          if ('，。、；：！？'.includes(remaining[i])) {
            cutPos = i + 1;
            break;
          }
        }
        lines.push(remaining.substring(0, cutPos).trim());
        remaining = remaining.substring(cutPos).trim();
      }
      
      if (remaining.length > 0) {
        lines.push(remaining);
      }
      
      return lines.join('\\N');
    };

    for (let i = 0; i < sectionTitles.length; i++) {
      const start = i * 5;
      const end = start + 3.0; // 3 秒展示时间（可被外部改动）
      // 先进行 ASS 转义，再换行处理
      const escaped = sectionTitles[i]
        .replace(/\\/g, '\\\\')  // 转义反斜杠
        .replace(/{/g, '\\{')    // 转义大括号
        .replace(/}/g, '\\}');
      const text = wrapCJK(escaped);
      // 炫酷特效：0.2s 淡入，0.2s 淡出，轻微缩放回弹
      const effect = `{\\fad(200,200)\\t(0,300,\\fscx120\\fscy120)}`;
      ass += `Dialogue: 0,${toAssTime(start)},${toAssTime(end)},Title,,0,0,0,,${effect}${text}\n`;
    }

    // 添加水印动画（如果配置提供）：第1秒左下角，最后1秒右上角，中间走弧线（两段直线近似）
    if (watermark && duration > 0) {
      const wmEsc = String(watermark)
        .replace(/\\/g, "\\\\")
        .replace(/{/g, "\\{")
        .replace(/}/g, "\\}");
      const wmLen = Array.from(String(watermark)).length;
      const fsz = 80;
      const estW = Math.max(1, wmLen * fsz * 0.6);
      const estH = fsz;
      // 以中心对齐估算移动路径，保证大致 20px 边距
      const cx1 = Math.max(20 + estW / 2, 0);
      const cy1 = Math.max(H - 20 - estH / 2, 0);
      const cx2 = Math.max(W - 20 - estW / 2, 0);
      const cy2 = Math.max(20 + estH / 2, 0);
      // 取中点，向上抬高形成弧线效果
      const mx = Math.floor(W / 2);
      const my = Math.floor(H * 0.3); // 折线中点更靠上，形成弧线观感
      const t1 = 1000; // 1s 开始移动
      const tEnd = Math.max(0, Math.floor(duration * 1000) - 1000); // 倒数1s 开始停留
      const travelMs = Math.max(0, tEnd - t1);
      const halfMs = Math.floor(travelMs / 2);
      // 0-1s：左下角停留（精确 20px）
      ass += `Dialogue: 0,${toAssTime(0)},${toAssTime(1)},WM_BL,,0,0,0,,{\\pos(20,${H - 20})}${wmEsc}\n`;
      // 1s-中点：BL -> Mid
      ass += `Dialogue: 0,${toAssTime(1)},${toAssTime(1 + travelMs/2000)},WM_M,,0,0,0,,{\\move(${cx1},${cy1},${mx},${my},0,${halfMs})}${wmEsc}\n`;
      // 中点-最后1s：Mid -> TR
      ass += `Dialogue: 0,${toAssTime(1 + travelMs/2000)},${toAssTime(Math.max(1, duration - 1))},WM_M,,0,0,0,,{\\move(${mx},${my},${cx2},${cy2},0,${Math.max(0, travelMs - halfMs)})}${wmEsc}\n`;
      // 最后1s：右上角停留（精确 20px）
      const endStart = Math.max(0, duration - 1.0);
      ass += `Dialogue: 0,${toAssTime(endStart)},${toAssTime(duration)},WM_TR,,0,0,0,,{\\pos(${W - 20},20)}${wmEsc}\n`;
    }
    
    // 加入 UTF-8 BOM，确保中文在所有环境下正确渲染
    const BOM = "\uFEFF";
    await fs.writeFile(assPath, BOM + ass, 'utf8');
    console.log(`[3/5] 字幕文件已创建: ${assPath} （ASS样式）`);
    
    // 叠加 ASS 字幕；original_size 确保按视频分辨率渲染
    await $`ffmpeg -y -i ${videoPath} -vf subtitles=${assPath}:original_size=${W}x${H} -c:a copy ${tempVideoPath}`;
    console.log(`[3/5] 镜头标题已添加: ${tempVideoPath}`);
    
    // 清理字幕源文件
    await fs.remove(assPath).catch(() => {});
    return tempVideoPath;
  } catch (error) {
    console.warn(`[警告] 标题处理失败: ${error.message}，跳过标题添加步骤`);
    return videoPath;
  }
}

/**
 * 合成背景音乐，保持原始比例
 * @param {string} videoPath - 视频文件路径
 * @param {string} bgMusicPath - 背景音乐路径
 * @param {string} outputDir - 输出目录
 * @returns {string} - 最终输出视频路径
 */
async function compositeWithMusic(videoPath, bgMusicPath, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  
  const originalVideoName = path.basename(videoPath, path.extname(videoPath));
  // 移除临时文件标识，使用原始视频名称
  const cleanVideoName = originalVideoName.replace(/_with_titles_temp$/, '').replace(/_\d+_[a-f0-9]+$/, '');
  const finalVideoPath = path.join(outputDir, `${cleanVideoName}.mp4`);
  
  console.log(`[4/5] 正在合成背景音乐，保持原始视频比例...`);
  
  // 获取原始视频信息
  try {
    const videoInfoResult = await $`ffprobe -v quiet -print_format json -show_streams ${videoPath}`;
    const videoInfo = JSON.parse(videoInfoResult.stdout);
    const videoStream = videoInfo.streams.find(s => s.codec_type === 'video');
    
    if (videoStream) {
      console.log(`[4/5] 保持原始尺寸: ${videoStream.width}x${videoStream.height}`);
    }
  } catch (e) {
    console.warn(`[警告] 无法获取视频信息: ${e.message}`);
  }
  
  const resolvedBgMusicPath = resolvePath(bgMusicPath);
  
  // 检查背景音乐文件是否存在
  let useBgMusic = false;
  if (resolvedBgMusicPath && !resolvedBgMusicPath.startsWith('http')) {
    try {
      const exists = await fs.pathExists(resolvedBgMusicPath);
      if (exists) {
        useBgMusic = true;
      } else {
        console.warn(`[警告] 背景音乐文件不存在: ${resolvedBgMusicPath}，将只处理视频`);
      }
    } catch (e) {
      console.warn(`[警告] 无法验证背景音乐路径: ${resolvedBgMusicPath}，将只处理视频`);
    }
  }
  
  if (useBgMusic) {
    console.log(`[4/5] 使用背景音乐: ${resolvedBgMusicPath}`);
    // 保持原始比例，不进行缩放
    await $`ffmpeg -y -i ${videoPath} -i ${resolvedBgMusicPath} -map 0:v -map 1:a:0 -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a aac -b:a 192k -shortest ${finalVideoPath}`;
  } else {
    console.log(`[4/5] 不使用背景音乐，仅处理视频`);
    await $`ffmpeg -y -i ${videoPath} -map 0:v -map 0:a? -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a copy ${finalVideoPath}`;
  }
  
  console.log(`[4/5] 最终视频已生成: ${finalVideoPath}`);
  return finalVideoPath;
}

/**
 * 清理临时文件
 * @param {Array} tempFiles - 临时文件路径数组
 */
async function cleanupTempFiles(tempFiles) {
  console.log(`[5/5] 正在清理临时文件...`);
  for (const file of tempFiles) {
    try {
      if (file.includes('_temp.mp4') && await fs.pathExists(file)) {
        await fs.remove(file);
        console.log(`已删除临时文件: ${file}`);
      }
    } catch (e) {
      console.warn(`清理临时文件失败: ${file}`, e.message);
    }
  }
}

/**
 * 主函数：执行 history-person 命令
 * @param {Object} config - 配置对象
 */
export default async function runHistoryPerson(config) {
  if (!config) {
    throw new Error('缺少 history-person 配置');
  }
  
  const { url, title, sectionTitle, 'bg-music': bgMusic, watermark } = config;
  
  if (!url) {
    throw new Error('配置中缺少视频 URL');
  }
  
  console.log(`\n开始处理 history-person 任务...`);
  console.log(`视频URL: ${url}`);
  console.log(`标题: ${title || '未设置'}`);
  console.log(`镜头标题数量: ${sectionTitle ? sectionTitle.length : 0}`);
  console.log(`水印: ${watermark || '未设置'}`);
  console.log(`背景音乐: ${bgMusic || '未设置'}`);
  
  try {
    // 1. 下载视频
    const inputDir = path.resolve('input/history-person');
    const outputDir = path.resolve('output/history-person');
    const videoPath = await downloadVideo(url, inputDir);
    
    // 2. 生成封面
    let thumbnailPath = '';
    if (title) {
      thumbnailPath = await generateThumbnail(videoPath, title, outputDir);
    }
    
    // 3. 添加镜头标题
    const videoWithTitles = await addSectionTitles(videoPath, sectionTitle, outputDir, watermark);
    
    // 4. 合成背景音乐并应用滤镜
    const finalVideoPath = await compositeWithMusic(videoWithTitles, bgMusic, outputDir);
    
    // 5. 清理临时文件
    await cleanupTempFiles([videoWithTitles]);
    
    console.log(`\n✅ history-person 任务完成！`);
    console.log(`📁 输入视频: ${videoPath}`);
    if (thumbnailPath) {
      console.log(`🖼️  封面图片: ${thumbnailPath}`);
    }
    console.log(`🎬 最终视频: ${finalVideoPath}`);
    
  } catch (error) {
    console.error(`\n❌ history-person 任务失败:`, error.message);
    throw error;
  }
}
