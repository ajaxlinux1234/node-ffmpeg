#!/usr/bin/env node
import 'zx/globals';
import runDownRmWatermark from '../lib/down-rm-watermark.mjs';
import runHistoryPerson from '../lib/history-person.mjs';

async function loadConfig() {
  try {
    const configPath = path.resolve('config.json');
    const configExists = await fs.pathExists(configPath);
    if (configExists) {
      const configContent = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configContent);
    }
  } catch (err) {
    console.warn('Warning: Could not load config.json:', err.message);
  }
  return {};
}

function printHelp() {
  console.log(`\nnode-ffmpeg-tools <command> [options]\n\nCommands:\n  down-rm-watermark [url]     Download mp4 and blur bottom-right watermark\n  history-person              Process history person video with titles and effects\n\nOptions for down-rm-watermark:\n  --url, -u <url>             Video URL (can also be provided positionally)\n  --bg-music, -b <file>       Path to background audio file (mp3/wav/etc).\n                              If omitted, uses config.json at down-rm-watermark.bg-music if present.\n\nOptions for history-person:\n  Uses configuration from config.json under "history-person" section.\n  Required config fields: url, title, sectionTitle, bg-music\n\nExamples:\n  node-ffmpeg-tools down-rm-watermark https://example.com/video.mp4\n  node-ffmpeg-tools down-rm-watermark -b assets/bgm.mp3 https://example.com/video.mp4\n  node-ffmpeg-tools down-rm-watermark  # Uses URL (and bg-music) from config.json if present\n  node-ffmpeg-tools history-person     # Uses config.json history-person section\n`);
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
          console.log('Using URL from config.json');
        }
        // If no bg-music provided, try to get from config
        if (!bgMusic && config['down-rm-watermark']?.['bg-music']) {
          bgMusic = config['down-rm-watermark']['bg-music'];
          console.log('Using bg-music from config.json');
        }
        
        if (!url) {
          console.error('\nUsage: node-ffmpeg-tools down-rm-watermark <url>');
          console.error('Or add URL to config.json under "down-rm-watermark.url"');
          process.exit(1);
        }
        await runDownRmWatermark(url, { bgMusic });
        break;
      }
      case 'history-person': {
        if (!config['history-person']) {
          console.error('\nError: No "history-person" configuration found in config.json');
          console.error('Please add history-person configuration with url, title, sectionTitle, and bg-music fields');
          process.exit(1);
        }
        
        console.log('Using history-person configuration from config.json');
        await runHistoryPerson(config['history-person']);
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
