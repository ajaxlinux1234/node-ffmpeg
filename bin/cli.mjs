#!/usr/bin/env node
import "zx/globals";
import runDownRmWatermark from "../lib/down-rm-watermark.mjs";
import runHistoryPerson from "../lib/history-person/history-person.mjs";
import runAiRemoveWatermark from "../lib/ai-remove-watermark.mjs";
import runMergeVideo from "../lib/merge-video.mjs";
import runClipAudio from "../lib/clip-audio.mjs";
import runAutoDeepseekJimeng, {
  clearBrowserData,
} from "../lib/auto-deepseek-jimeng/auto-deepseek-jimeng.mjs";
import { runJimengVideoFlow } from "../lib/auto-deepseek-jimeng/jimeng-video-generator.mjs";
import runFilter, { listFilters } from "../lib/filter.mjs";
import runConvert3D, { list3DModes } from "../lib/convert-3d.mjs";
import runOptimizeImage from "../lib/optimize-image.mjs";
import runExtractAudio, {
  showExtractAudioHelp,
} from "../lib/extract-audio.mjs";
import runMergeAudioVideo, {
  showMergeAudioVideoHelp,
} from "../lib/merge-audio-video.mjs";
import { cleanOutputHistory } from "../lib/utils.mjs";
import config from "../config.mjs";

async function loadConfig() {
  try {
    return config;
  } catch (err) {
    console.warn("Warning: Could not load config.mjs:", err.message);
  }
  return {};
}

function printHelp() {
  console.log(`\nnode-ffmpeg-tools <command> [options]\n\nCommands:\n  down-rm-watermark [url]     Download mp4 and blur bottom-right watermark\n  history-person              Process history person video with titles and effects\n  ai-remove-watermark [url]   AI inpainting to remove watermark; keeps original resolution/fps\n  merge-video                 Merge multiple videos with transition effects\n  clip-audio                  Clip audio files from specified start time\n  extract-audio               Extract audio from video files with format conversion
  merge-audio-video           Merge audio and video files with position control\n  auto-deepseek-jimeng        Automate DeepSeek chat to generate video prompts\n  jimeng-video-generator      Generate videos using Jimeng with batch image upload and shot descriptions\n  filter                      Apply various filters to videos (cinematic, vintage, artistic, etc.)\n  convert-3d                  Convert 2D video to 3D (anaglyph, side-by-side, top-bottom)\n  optimize-image              Batch optimize images with lossless compression\n  clear-browser-data          Clear saved browser login data for DeepSeek\n\nGlobal Options:\n  cleanOutputHistory          Automatically clean output directory before running commands (default: true)\n                              Set to false in config.mjs to disable: cleanOutputHistory: false\n\nOptions for down-rm-watermark:\n  --url, -u <url>             Video URL (can also be provided positionally)\n  --bg-music, -b <file>       Path to background audio file (mp3/wav/etc).\n                              If omitted, uses config.mjs at down-rm-watermark.bg-music if present.\n\nOptions for history-person:\n  Uses configuration from config.mjs under "history-person" section.\n  Required config fields: url, title, sectionTitle, bg-music\n\nOptions for ai-remove-watermark:\n  --url, -u <url>             Video URL (can also be provided positionally)\n  If omitted, uses config.mjs at "ai-remove-watermark.url" if present.\n\nOptions for merge-video:\n  Uses configuration from config.mjs under "merge-video" section.\n  Required config fields: urls (array of video URLs/paths), switch (transition effect)\n  Supported transitions: 叠化, 淡入淡出, 推拉, 擦除, 无转场\n\nOptions for clip-audio:\n  Uses configuration from config.mjs under "clip-audio" section.\n  Required config fields: array of {url, start?, duration?, output?}\n  - url: audio file path or URL (required)\n  - start: start time in seconds (default: 0)\n  - duration: clip duration in seconds (optional, clips to end if not specified)\n  - output: custom output filename (optional, auto-generated if not specified)\n\nOptions for extract-audio:\n  Uses configuration from config.mjs under "extract-audio" section.\n  Required config fields: url (video file path or URL)\n  Optional fields: format, quality, startTime, duration, channels, sampleRate\n  - format: output audio format (mp3, wav, aac, flac, ogg, m4a) - default: mp3\n  - quality: audio quality (high, medium, low) - default: high\n  - startTime: start time in seconds (optional)\n  - duration: extract duration in seconds (optional)\n  - channels: number of audio channels (1=mono, 2=stereo) (optional)\n  - sampleRate: audio sample rate (44100, 48000, etc.) (optional)\n\nOptions for merge-audio-video:\n  Uses configuration from config.mjs under "merge-audio-video" section.\n  Required config fields: videoUrl, audioUrl (video and audio file paths or URLs)\n  Optional fields: position, volume, audioDelay, videoDelay, trimAudio, trimVideo\n  - position: audio position mode (overlay, replace, start, end) - default: overlay\n  - volume: audio volume (0.0-2.0) - default: 1.0\n  - audioDelay: audio delay in seconds (optional)\n  - videoDelay: video delay in seconds (optional)\n  - trimAudio: trim audio to video length (true/false)\n  - trimVideo: trim video to audio length (true/false)\n\nOptions for auto-deepseek-jimeng:\n  Uses configuration from config.mjs under "auto-deepseek-jimeng" section.\n  Automates DeepSeek chat using headless browser to generate video prompts.\n  Required config fields: deepseek.url, deepseek.chat_selector, deepseek.send_msg_template, etc.\n\nExamples:\n  node-ffmpeg-tools down-rm-watermark https://example.com/video.mp4\n  node-ffmpeg-tools down-rm-watermark -b assets/bgm.mp3 https://example.com/video.mp4\n  node-ffmpeg-tools down-rm-watermark  # Uses URL (and bg-music) from config.mjs if present\n  node-ffmpeg-tools history-person     # Uses config.mjs history-person section\n  node-ffmpeg-tools ai-remove-watermark https://example.com/video.mp4\n  node-ffmpeg-tools ai-remove-watermark  # Uses config.mjs ai-remove-watermark.url\n  node-ffmpeg-tools merge-video         # Uses config.mjs merge-video section\n  node-ffmpeg-tools clip-audio          # Uses config.mjs clip-audio section\n  node-ffmpeg-tools auto-deepseek-jimeng # Uses config.mjs auto-deepseek-jimeng section\n`);
}

(async () => {
  const [cmd, ...rest] = argv._ ?? [];
  if (!cmd || argv.help || argv.h) {
    printHelp();
    process.exit(cmd ? 0 : 1);
  }

  const config = await loadConfig();

  // 需要清理output历史数据的命令列表
  const commandsNeedCleanup = [
    "down-rm-watermark",
    "history-person",
    "ai-remove-watermark",
    "merge-video",
    "clip-audio",
    "extract-audio",
    "merge-audio-video",
    "auto-deepseek-jimeng",
    "jimeng-video-generator",
    "filter",
    "convert-3d",
    "optimize-image",
  ];

  // 如果是需要清理的命令，先执行清理
  if (commandsNeedCleanup.includes(cmd)) {
    await cleanOutputHistory(config.cleanOutputHistory);
  }

  try {
    switch (cmd) {
      case "down-rm-watermark": {
        let url = argv.url || argv.u || rest[0];
        let bgMusic = argv["bg-music"] || argv.b;

        // If no URL provided, try to get from config
        if (!url && config["down-rm-watermark"]?.url) {
          url = config["down-rm-watermark"].url;
          console.log("Using URL from config.mjs");
        }
        // If no bg-music provided, try to get from config
        if (!bgMusic && config["down-rm-watermark"]?.["bg-music"]) {
          bgMusic = config["down-rm-watermark"]["bg-music"];
          console.log("Using bg-music from config.mjs");
        }

        if (!url) {
          console.error("\nUsage: node-ffmpeg-tools down-rm-watermark <url>");
          console.error(
            'Or add URL to config.mjs under "down-rm-watermark.url"'
          );
          process.exit(1);
        }
        await runDownRmWatermark(url, { bgMusic });
        break;
      }
      case "history-person": {
        if (!config["history-person"]) {
          console.error(
            '\nError: No "history-person" configuration found in config.mjs'
          );
          console.error(
            "Please add history-person configuration with url, title, sectionTitle, and bg-music fields"
          );
          process.exit(1);
        }

        console.log("Using history-person configuration from config.mjs");
        await runHistoryPerson(config["history-person"]);
        break;
      }
      case "ai-remove-watermark": {
        let url = argv.url || argv.u || rest[0];
        if (!url && config["ai-remove-watermark"]?.url) {
          url = config["ai-remove-watermark"].url;
          console.log("Using URL from config.mjs (ai-remove-watermark.url)");
        }
        if (!url) {
          console.error("\nUsage: node-ffmpeg-tools ai-remove-watermark <url>");
          console.error(
            'Or add URL to config.mjs under "ai-remove-watermark.url"'
          );
          process.exit(1);
        }
        await runAiRemoveWatermark(url);
        break;
      }
      case "merge-video": {
        if (!config["merge-video"]) {
          console.error(
            '\nError: No "merge-video" configuration found in config.mjs'
          );
          console.error(
            "Please add merge-video configuration with urls array and switch (transition effect) fields"
          );
          process.exit(1);
        }

        console.log("Using merge-video configuration from config.mjs");
        await runMergeVideo(config["merge-video"]);
        break;
      }
      case "clip-audio": {
        if (!config["clip-audio"]) {
          console.error(
            '\nError: No "clip-audio" configuration found in config.mjs'
          );
          console.error(
            "Please add clip-audio configuration as an array of {url, start?, duration?, output?} objects"
          );
          process.exit(1);
        }

        if (!Array.isArray(config["clip-audio"])) {
          console.error('\nError: "clip-audio" configuration must be an array');
          console.error(
            "Each item should have: {url, start?, duration?, output?}"
          );
          process.exit(1);
        }

        console.log("Using clip-audio configuration from config.mjs");
        await runClipAudio(config["clip-audio"]);
        break;
      }
      case "auto-deepseek-jimeng": {
        if (!config["auto-deepseek-jimeng"]) {
          console.error(
            '\nError: No "auto-deepseek-jimeng" configuration found in config.mjs'
          );
          console.error(
            "Please add auto-deepseek-jimeng configuration with deepseek settings"
          );
          process.exit(1);
        }

        console.log("Using auto-deepseek-jimeng configuration from config.mjs");
        await runAutoDeepseekJimeng(config["auto-deepseek-jimeng"]);
        break;
      }
      case "jimeng-video-generator": {
        if (!config["jimeng-video-generator"]) {
          console.error(
            '\nError: No "jimeng-video-generator" configuration found in config.mjs'
          );
          console.error(
            "Please add jimeng-video-generator configuration with required settings"
          );
          process.exit(1);
        }

        // 检查是否有 processed_data.json 文件
        const processedDataPath =
          "./output/" +
          (config["jimeng-video-generator"].name || "default") +
          "/processed_data.json";
        let processedData;
        try {
          const fs = await import("fs/promises");
          const data = await fs.readFile(processedDataPath, "utf8");
          processedData = JSON.parse(data);
          console.log(
            `✅ 找到 processed_data.json 文件，包含 ${processedData.segments?.length || 0} 个段落`
          );
        } catch (error) {
          console.error(
            `\nError: 无法读取 processed_data.json 文件: ${processedDataPath}`
          );
          console.error(
            "请先运行 auto-deepseek-jimeng 命令生成数据，或检查文件路径是否正确"
          );
          process.exit(1);
        }

        console.log(
          "Using jimeng-video-generator configuration from config.mjs"
        );
        await runJimengVideoFlow(
          config["jimeng-video-generator"],
          processedData,
          config["jimeng-video-generator"].name || "default"
        );
        break;
      }
      case "filter": {
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
          quality: argv.quality || argv.q || config.filter?.quality || "high",
          keepAudio:
            argv["keep-audio"] !== false && config.filter?.keepAudio !== false,
        };

        if (!filterConfig.input) {
          console.error("\nError: 请指定输入视频文件");
          console.error("使用方法:");
          console.error(
            "  npx node-ffmpeg-tools filter --list                           # 列出所有滤镜"
          );
          console.error(
            "  npx node-ffmpeg-tools filter -i input.mp4 -p cinematic-warm  # 使用预设滤镜"
          );
          console.error(
            '  npx node-ffmpeg-tools filter -i input.mp4 -c "eq=contrast=1.2" # 自定义滤镜'
          );
          console.error("  或在 config.mjs 中配置 filter 部分\n");
          process.exit(1);
        }

        if (!filterConfig.preset && !filterConfig.customFilter) {
          console.error(
            "\nError: 请指定预设滤镜 (--preset) 或自定义滤镜 (--custom)"
          );
          console.error("使用 --list 查看所有可用的预设滤镜\n");
          process.exit(1);
        }

        await runFilter(filterConfig);
        break;
      }
      case "convert-3d": {
        // 检查是否要列出所有3D模式
        if (argv.list || argv.l) {
          list3DModes();
          break;
        }

        // 从命令行参数或配置文件获取设置
        const convert3DConfig = {
          input: argv.input || argv.i || rest[0] || config["convert-3d"]?.input,
          output: argv.output || argv.o || config["convert-3d"]?.output,
          mode:
            argv.mode ||
            argv.m ||
            config["convert-3d"]?.mode ||
            "anaglyph-red-cyan",
          depth: argv.depth || argv.d || config["convert-3d"]?.depth || 0.3,
          quality:
            argv.quality || argv.q || config["convert-3d"]?.quality || "high",
          keepAudio:
            argv["keep-audio"] !== false &&
            config["convert-3d"]?.keepAudio !== false,
        };

        if (!convert3DConfig.input) {
          console.error("\nError: 请指定输入视频文件");
          console.error("使用方法:");
          console.error(
            "  npx node-ffmpeg-tools convert-3d --list                        # 列出所有3D模式"
          );
          console.error(
            "  npx node-ffmpeg-tools convert-3d -i input.mp4 -m anaglyph-red-cyan  # 转换为红蓝3D"
          );
          console.error(
            "  npx node-ffmpeg-tools convert-3d -i input.mp4 -m side-by-side  # 转换为左右3D"
          );
          console.error("  或在 config.mjs 中配置 convert-3d 部分\n");
          process.exit(1);
        }

        await runConvert3D(convert3DConfig);
        break;
      }
      case "optimize-image": {
        if (!config["optimize-image"]) {
          console.error(
            '\nError: No "optimize-image" configuration found in config.mjs'
          );
          console.error(
            "Please add optimize-image configuration with inputDir, outputDir, and quality settings"
          );
          process.exit(1);
        }

        console.log("Using optimize-image configuration from config.mjs");
        await runOptimizeImage(config);
        break;
      }
      case "extract-audio": {
        // 检查是否要显示帮助信息
        if (argv.help || argv.h) {
          showExtractAudioHelp();
          break;
        }

        if (!config["extract-audio"]) {
          console.error(
            '\nError: No "extract-audio" configuration found in config.mjs'
          );
          console.error(
            "Please add extract-audio configuration with url and optional format/quality settings"
          );
          console.error("Or use --help to see configuration examples");
          process.exit(1);
        }

        console.log("Using extract-audio configuration from config.mjs");
        await runExtractAudio(config["extract-audio"]);
        break;
      }
      case "merge-audio-video": {
        // 检查是否要显示帮助信息
        if (argv.help || argv.h) {
          showMergeAudioVideoHelp();
          break;
        }

        if (!config["merge-audio-video"]) {
          console.error(
            '\nError: No "merge-audio-video" configuration found in config.mjs'
          );
          console.error(
            "Please add merge-audio-video configuration with videoUrl and audioUrl"
          );
          console.error("Or use --help to see configuration examples");
          process.exit(1);
        }

        console.log("Using merge-audio-video configuration from config.mjs");
        await runMergeAudioVideo(config["merge-audio-video"]);
        break;
      }
      case "clear-browser-data": {
        console.log("🧹 正在清理浏览器用户数据...");
        const success = await clearBrowserData();
        if (success) {
          console.log(
            "✅ 浏览器数据清理完成！下次运行 auto-deepseek-jimeng 时将需要重新登录"
          );
        } else {
          console.log(
            "❌ 浏览器数据清理失败，请检查权限或手动删除 browser-data 目录"
          );
        }
        break;
      }
      default:
        console.error(`Unknown command: ${cmd}`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error("\nError:", err?.message || err);
    process.exit(1);
  }
})();
