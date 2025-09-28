#!/usr/bin/env node
import 'zx/globals';
import runDownRmWatermark from '../lib/down-rm-watermark.mjs';
import runHistoryPerson from '../lib/history-person.mjs';
import runAiRemoveWatermark from '../lib/ai-remove-watermark.mjs';
import runMergeVideo from '../lib/merge-video.mjs';
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
  console.log(`\nnode-ffmpeg-tools <command> [options]\n\nCommands:\n  down-rm-watermark [url]     Download mp4 and blur bottom-right watermark\n  history-person              Process history person video with titles and effects\n  ai-remove-watermark [url]   AI inpainting to remove watermark; keeps original resolution/fps\n  merge-video                 Merge multiple videos with transition effects\n\nOptions for down-rm-watermark:\n  --url, -u <url>             Video URL (can also be provided positionally)\n  --bg-music, -b <file>       Path to background audio file (mp3/wav/etc).\n                              If omitted, uses config.mjs at down-rm-watermark.bg-music if present.\n\nOptions for history-person:\n  Uses configuration from config.mjs under "history-person" section.\n  Required config fields: url, title, sectionTitle, bg-music\n\nOptions for ai-remove-watermark:\n  --url, -u <url>             Video URL (can also be provided positionally)\n  If omitted, uses config.mjs at "ai-remove-watermark.url" if present.\n\nOptions for merge-video:\n  Uses configuration from config.mjs under "merge-video" section.\n  Required config fields: urls (array of video URLs/paths), switch (transition effect)\n  Supported transitions: 叠化, 淡入淡出, 推拉, 擦除, 无转场\n\nExamples:\n  node-ffmpeg-tools down-rm-watermark https://example.com/video.mp4\n  node-ffmpeg-tools down-rm-watermark -b assets/bgm.mp3 https://example.com/video.mp4\n  node-ffmpeg-tools down-rm-watermark  # Uses URL (and bg-music) from config.mjs if present\n  node-ffmpeg-tools history-person     # Uses config.mjs history-person section\n  node-ffmpeg-tools ai-remove-watermark https://example.com/video.mp4\n  node-ffmpeg-tools ai-remove-watermark  # Uses config.mjs ai-remove-watermark.url\n  node-ffmpeg-tools merge-video         # Uses config.mjs merge-video section\n`);
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
