#!/usr/bin/env node
import "zx/globals";
import runDownRmWatermark from "../lib/down-rm-watermark.mjs";
import runHistoryPerson from "../lib/history-person/history-person.mjs";
import runAiRemoveWatermark from "../lib/ai-remove-watermark.mjs";
import runMergeVideo from "../lib/merge-video.mjs";
import runClipAudio from "../lib/clip-audio.mjs";
import runClipVideo from "../lib/clip-video.mjs";
import runAutoDeepseekJimeng, {
  clearBrowserData,
} from "../lib/auto-deepseek-jimeng/auto-deepseek-jimeng.mjs";
import { runJimengVideoFlow } from "../lib/auto-deepseek-jimeng/jimeng-video-generator.mjs";
import runFilter, { listFilters } from "../lib/filter.mjs";
import runConvert3D, { list3DModes } from "../lib/convert-3d.mjs";
import runBatchCropImages from "../lib/batch-crop-images.mjs";
import runExtractAudio, {
  showExtractAudioHelp,
} from "../lib/extract-audio.mjs";
import runMergeAudioVideo, {
  showMergeAudioVideoHelp,
} from "../lib/merge-audio-video.mjs";
import { cleanOutputHistory } from "../lib/utils.mjs";
import { runGetPromotImageByVideo } from "../lib/get-promot-image-by-video.mjs";
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
  console.log(
    `\nnode-ffmpeg-tools <command> [options]\n\nCommands:\n  down-rm-watermark [url]     Download mp4 and blur bottom-right watermark\n  history-person              Process history person video with titles and effects\n  ai-remove-watermark [url]   AI inpainting to remove watermark; keeps original resolution/fps\n  merge-video                 Merge multiple videos with transition effects\n  clip-audio                  Clip audio files from specified start time\n  clip-video                  Clip video files with time range batch processing\n  extract-audio               Extract audio from video files with format conversion\n  merge-audio-video           Merge audio and video files with position control\n  auto-deepseek-jimeng        Automate DeepSeek chat to generate video prompts\n  jimeng-video-generator      Generate videos using Jimeng with batch image upload and shot descriptions\n  get-promot-image-by-video   Extract video frames, OCR text recognition, and generate prompts using AI\n  filter                      Apply various filters to videos (cinematic, vintage, artistic, etc.)\n  optimize-image                  Convert 2D video to 3D (anaglyph, side-by-side, top-bottom)\n  batch-crop-images           Batch crop images to 9:16 aspect ratio for social media\n  clear-browser-data          Clear saved browser login data for DeepSeek\n\nGlobal Options:\n  cleanOutputHistory          Automatically clean output directory before running commands (default: true)\n                              Set to false in config.mjs to disable: cleanOutputHistory: false\n\nOptions for batch-crop-images:\n  Uses configuration from config.mjs under "batch-crop-images" section.\n  Required config fields: inputDir (source directory), outputDir (destination directory)\n  Optional config fields: targetAspectRatio (default: "9:16"), cropMode (center/smart/entropy),\n                         quality (1-100, default: 90), outputFormat (auto/jpg/png/webp)\n\nExamples:\n  node-ffmpeg-tools down-rm-watermark https://example.com/video.mp4\n  node-ffmpeg-tools down-rm-watermark -b assets/bgm.mp3 https://example.com/video.mp4\n  node-ffmpeg-tools get-promot-image-by-video\n`
  );
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
    "clip-video",
    "extract-audio",
    "merge-audio-video",
    "auto-deepseek-jimeng",
    "jimeng-video-generator",
    "get-promot-image-by-video",
    "filter",
    "optimize-image",
    "batch-crop-images",
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
        const aiConfig = config["ai-remove-watermark"];
        let url = argv.url || argv.u || rest[0];
        
        // 支持批量处理模式
        if (aiConfig && Array.isArray(aiConfig.videos)) {
          console.log("Using batch processing mode from config.mjs");
          await runAiRemoveWatermark(aiConfig);
          break;
        }
        
        // 向后兼容：单视频模式
        if (!url && aiConfig?.url) {
          url = aiConfig.url;
          console.log("Using URL from config.mjs (ai-remove-watermark.url)");
        }
        
        if (!url) {
          console.error("\nUsage: node-ffmpeg-tools ai-remove-watermark <url>");
          console.error('Or configure in config.mjs under "ai-remove-watermark"');
          console.error('  Single video: { url: "path/to/video.mp4", mask: {...}, title: "...", titleAnimation: "..." }');
          console.error('  Batch mode: { videos: [{url: "...", mask: {...}}, ...], globalTitle: "...", globalTitleAnimation: "..." }');
          process.exit(1);
        }
        
        await runAiRemoveWatermark(aiConfig || url);
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
      case "clip-video": {
        if (!config["clip-video"]) {
          console.error(
            '\nError: No "clip-video" configuration found in config.mjs'
          );
          console.error(
            "Please add clip-video configuration with videos array"
          );
          process.exit(1);
        }

        console.log("Using clip-video configuration from config.mjs");
        await runClipVideo(config["clip-video"]);
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
      case "get-promot-image-by-video": {
        if (!config["get-promot-image-by-video"]) {
          console.error(
            '\nError: No "get-promot-image-by-video" configuration found in config.mjs'
          );
          console.error(
            "Please add get-promot-image-by-video configuration with videoPath, videoName, seconds, and other required settings"
          );
          process.exit(1);
        }

        console.log("Using get-promot-image-by-video configuration from config.mjs");
        await runGetPromotImageByVideo(config["get-promot-image-by-video"]);
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
      case "optimize-image": {
        // 检查是否要列出所有3D模式
        if (argv.list || argv.l) {
          list3DModes();
          break;
        }

        // 从命令行参数或配置文件获取设置
        const convert3DConfig = {
          input:
            argv.input || argv.i || rest[0] || config["optimize-image"]?.input,
          output: argv.output || argv.o || config["optimize-image"]?.output,
          mode:
            argv.mode ||
            argv.m ||
            config["optimize-image"]?.mode ||
            "anaglyph-red-cyan",
          depth: argv.depth || argv.d || config["optimize-image"]?.depth || 0.3,
          quality:
            argv.quality ||
            argv.q ||
            config["optimize-image"]?.quality ||
            "high",
          keepAudio:
            argv["keep-audio"] !== false &&
            config["optimize-image"]?.keepAudio !== false,
        };

        if (!convert3DConfig.input) {
          console.error("\nError: 请指定输入视频文件");
          console.error("使用方法:");
          console.error(
            "  npx node-ffmpeg-tools optimize-image --list                        # 列出所有3D模式"
          );
          console.error(
            "  npx node-ffmpeg-tools optimize-image -i input.mp4 -m anaglyph-red-cyan  # 转换为红蓝3D"
          );
          console.error(
            "  npx node-ffmpeg-tools optimize-image -i input.mp4 -m side-by-side  # 转换为左右3D"
          );
          console.error("  或在 config.mjs 中配置 optimize-image 部分\n");
          process.exit(1);
        }

        await runConvert3D(convert3DConfig);
        break;
      }
      case "batch-crop-images": {
        if (!config["batch-crop-images"]) {
          console.error(
            '\nError: No "batch-crop-images" configuration found in config.mjs'
          );
          console.error(
            "Please add batch-crop-images configuration with inputDir and outputDir fields"
          );
          process.exit(1);
        }

        console.log("Using batch-crop-images configuration from config.mjs");
        await runBatchCropImages(config);
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
