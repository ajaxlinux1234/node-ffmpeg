#!/usr/bin/env node
import 'zx/globals';
import runDownRmWatermark from '../lib/down-rm-watermark.mjs';
import runHistoryPerson from '../lib/history-person.mjs';
import runAiRemoveWatermark from '../lib/ai-remove-watermark.mjs';
import runMergeVideo from '../lib/merge-video.mjs';
import runClipAudio from '../lib/clip-audio.mjs';
import runAutoDeepseekJimeng, { clearBrowserData } from '../lib/auto-deepseek-jimeng.mjs';
import runFilter, { listFilters } from '../lib/filter.mjs';
import runConvert3D, { list3DModes } from '../lib/convert-3d.mjs';
import runOptimizeImage from '../lib/optimize-image.mjs';
import config from '../config.mjs';

async function loadConfig() {
  try {
    return config;
  } catch (err) {
    console.warn('Warning: Could not load config.mjs:', err.message);
  }
  return {};
}

function printHelp() {
  console.log(`\nnode-ffmpeg-tools <command> [options]\n\nCommands:\n  down-rm-watermark [url]     Download mp4 and blur bottom-right watermark\n  history-person              Process history person video with titles and effects\n  ai-remove-watermark [url]   AI inpainting to remove watermark; keeps original resolution/fps\n  merge-video                 Merge multiple videos with transition effects\n  clip-audio                  Clip audio files from specified start time\n  auto-deepseek-jimeng        Automate DeepSeek chat to generate video prompts\n  filter                      Apply various filters to videos (cinematic, vintage, artistic, etc.)\n  convert-3d                  Convert 2D video to 3D (anaglyph, side-by-side, top-bottom)\n  optimize-image              Batch optimize images with lossless compression\n  clear-browser-data          Clear saved browser login data for DeepSeek\n\nOptions for down-rm-watermark:\n  --url, -u <url>             Video URL (can also be provided positionally)\n  --bg-music, -b <file>       Path to background audio file (mp3/wav/etc).\n                              If omitted, uses config.mjs at down-rm-watermark.bg-music if present.\n\nOptions for history-person:\n  Uses configuration from config.mjs under "history-person" section.\n  Required config fields: url, title, sectionTitle, bg-music\n\nOptions for ai-remove-watermark:\n  --url, -u <url>             Video URL (can also be provided positionally)\n  If omitted, uses config.mjs at "ai-remove-watermark.url" if present.\n\nOptions for merge-video:\n  Uses configuration from config.mjs under "merge-video" section.\n  Required config fields: urls (array of video URLs/paths), switch (transition effect)\n  Supported transitions: 叠化, 淡入淡出, 推拉, 擦除, 无转场\n\nOptions for clip-audio:\n  Uses configuration from config.mjs under "clip-audio" section.\n  Required config fields: array of {url, start?, duration?, output?}\n  - url: audio file path or URL (required)\n  - start: start time in seconds (default: 0)\n  - duration: clip duration in seconds (optional, clips to end if not specified)\n  - output: custom output filename (optional, auto-generated if not specified)\n\nOptions for auto-deepseek-jimeng:\n  Uses configuration from config.mjs under "auto-deepseek-jimeng" section.\n  Automates DeepSeek chat using headless browser to generate video prompts.\n  Required config fields: deepseek.url, deepseek.chat_selector, deepseek.send_msg_template, etc.\n\nExamples:\n  node-ffmpeg-tools down-rm-watermark https://example.com/video.mp4\n  node-ffmpeg-tools down-rm-watermark -b assets/bgm.mp3 https://example.com/video.mp4\n  node-ffmpeg-tools down-rm-watermark  # Uses URL (and bg-music) from config.mjs if present\n  node-ffmpeg-tools history-person     # Uses config.mjs history-person section\n  node-ffmpeg-tools ai-remove-watermark https://example.com/video.mp4\n  node-ffmpeg-tools ai-remove-watermark  # Uses config.mjs ai-remove-watermark.url\n  node-ffmpeg-tools merge-video         # Uses config.mjs merge-video section\n  node-ffmpeg-tools clip-audio          # Uses config.mjs clip-audio section\n  node-ffmpeg-tools auto-deepseek-jimeng # Uses config.mjs auto-deepseek-jimeng section\n`);
}

(async () => {
  const [cmd, ...rest] = argv._ ?? [];
  if (!cmd || argv.help || argv.h) {
    printHelp();
    process.exit(cmd ? 0 : 1);
  }

  const config = await loadConfig();

  try {
    switch (cmd) {
      case 'down-rm-watermark': {
        let url = argv.url || argv.u || rest[0];
        let bgMusic = argv['bg-music'] || argv.b;
        
        // If no URL provided, try to get from config
        if (!url && config['down-rm-watermark']?.url) {
          url = config['down-rm-watermark'].url;
          console.log('Using URL from config.mjs');
        }
        // If no bg-music provided, try to get from config
        if (!bgMusic && config['down-rm-watermark']?.['bg-music']) {
          bgMusic = config['down-rm-watermark']['bg-music'];
          console.log('Using bg-music from config.mjs');
        }
        
        if (!url) {
          console.error('\nUsage: node-ffmpeg-tools down-rm-watermark <url>');
          console.error('Or add URL to config.mjs under "down-rm-watermark.url"');
          process.exit(1);
        }
        await runDownRmWatermark(url, { bgMusic });
        break;
      }
      case 'history-person': {
        if (!config['history-person']) {
          console.error('\nError: No "history-person" configuration found in config.mjs');
          console.error('Please add history-person configuration with url, title, sectionTitle, and bg-music fields');
          process.exit(1);
        }
        
        console.log('Using history-person configuration from config.mjs');
        await runHistoryPerson(config['history-person']);
        break;
      }
      case 'ai-remove-watermark': {
        let url = argv.url || argv.u || rest[0];
        if (!url && config['ai-remove-watermark']?.url) {
          url = config['ai-remove-watermark'].url;
          console.log('Using URL from config.mjs (ai-remove-watermark.url)');
        }
        if (!url) {
          console.error('\nUsage: node-ffmpeg-tools ai-remove-watermark <url>');
          console.error('Or add URL to config.mjs under "ai-remove-watermark.url"');
          process.exit(1);
        }
        await runAiRemoveWatermark(url);
        break;
      }
      case 'merge-video': {
        if (!config['merge-video']) {
          console.error('\nError: No "merge-video" configuration found in config.mjs');
          console.error('Please add merge-video configuration with urls array and switch (transition effect) fields');
          process.exit(1);
        }
        
        console.log('Using merge-video configuration from config.mjs');
        await runMergeVideo(config['merge-video']);
        break;
      }
      case 'clip-audio': {
        if (!config['clip-audio']) {
          console.error('\nError: No "clip-audio" configuration found in config.mjs');
          console.error('Please add clip-audio configuration as an array of {url, start?, duration?, output?} objects');
          process.exit(1);
        }
        
        if (!Array.isArray(config['clip-audio'])) {
          console.error('\nError: "clip-audio" configuration must be an array');
          console.error('Each item should have: {url, start?, duration?, output?}');
          process.exit(1);
        }
        
        console.log('Using clip-audio configuration from config.mjs');
        await runClipAudio(config['clip-audio']);
        break;
      }
      case 'auto-deepseek-jimeng': {
        if (!config['auto-deepseek-jimeng']) {
          console.error('\nError: No "auto-deepseek-jimeng" configuration found in config.mjs');
          console.error('Please add auto-deepseek-jimeng configuration with deepseek settings');
          process.exit(1);
        }
        
        console.log('Using auto-deepseek-jimeng configuration from config.mjs');
        await runAutoDeepseekJimeng(config['auto-deepseek-jimeng']);
        break;
      }
      case 'filter': {
        // 检查是否要列出所有滤镜
        if (argv.list || argv.l) {
          listFilters();
          break;
        }
        
        // 从命令行参数或配置文件获取设置
        const filterConfig = {
          input: argv.input || argv.i || rest[0] || config.filter?.input,
          output: argv.output || argv.o || config.filter?.output,
          preset: argv.preset || argv.p || config.filter?.preset,
          customFilter: argv.custom || argv.c || config.filter?.customFilter,
          quality: argv.quality || argv.q || config.filter?.quality || 'high',
          keepAudio: argv['keep-audio'] !== false && config.filter?.keepAudio !== false
        };
        
        if (!filterConfig.input) {
          console.error('\nError: 请指定输入视频文件');
          console.error('使用方法:');
          console.error('  npx node-ffmpeg-tools filter --list                           # 列出所有滤镜');
          console.error('  npx node-ffmpeg-tools filter -i input.mp4 -p cinematic-warm  # 使用预设滤镜');
          console.error('  npx node-ffmpeg-tools filter -i input.mp4 -c "eq=contrast=1.2" # 自定义滤镜');
          console.error('  或在 config.mjs 中配置 filter 部分\n');
          process.exit(1);
        }
        
        if (!filterConfig.preset && !filterConfig.customFilter) {
          console.error('\nError: 请指定预设滤镜 (--preset) 或自定义滤镜 (--custom)');
          console.error('使用 --list 查看所有可用的预设滤镜\n');
          process.exit(1);
        }
        
        await runFilter(filterConfig);
        break;
      }
      case 'convert-3d': {
        // 检查是否要列出所有3D模式
        if (argv.list || argv.l) {
          list3DModes();
          break;
        }
        
        // 从命令行参数或配置文件获取设置
        const convert3DConfig = {
          input: argv.input || argv.i || rest[0] || config['convert-3d']?.input,
          output: argv.output || argv.o || config['convert-3d']?.output,
          mode: argv.mode || argv.m || config['convert-3d']?.mode || 'anaglyph-red-cyan',
          depth: argv.depth || argv.d || config['convert-3d']?.depth || 0.3,
          quality: argv.quality || argv.q || config['convert-3d']?.quality || 'high',
          keepAudio: argv['keep-audio'] !== false && config['convert-3d']?.keepAudio !== false
        };
        
        if (!convert3DConfig.input) {
          console.error('\nError: 请指定输入视频文件');
          console.error('使用方法:');
          console.error('  npx node-ffmpeg-tools convert-3d --list                        # 列出所有3D模式');
          console.error('  npx node-ffmpeg-tools convert-3d -i input.mp4 -m anaglyph-red-cyan  # 转换为红蓝3D');
          console.error('  npx node-ffmpeg-tools convert-3d -i input.mp4 -m side-by-side  # 转换为左右3D');
          console.error('  或在 config.mjs 中配置 convert-3d 部分\n');
          process.exit(1);
        }
        
        await runConvert3D(convert3DConfig);
        break;
      }
      case 'optimize-image': {
        if (!config['optimize-image']) {
          console.error('\nError: No "optimize-image" configuration found in config.mjs');
          console.error('Please add optimize-image configuration with inputDir, outputDir, and quality settings');
          process.exit(1);
        }
        
        console.log('Using optimize-image configuration from config.mjs');
        await runOptimizeImage(config);
        break;
      }
      case 'clear-browser-data': {
        console.log('🧹 正在清理浏览器用户数据...');
        const success = await clearBrowserData();
        if (success) {
          console.log('✅ 浏览器数据清理完成！下次运行 auto-deepseek-jimeng 时将需要重新登录');
        } else {
          console.log('❌ 浏览器数据清理失败，请检查权限或手动删除 browser-data 目录');
        }
        break;
      }
      default:
        console.error(`Unknown command: ${cmd}`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error('\nError:', err?.message || err);
    process.exit(1);
  }
})();
