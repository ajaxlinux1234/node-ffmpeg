#!/usr/bin/env node
console.warn('This command is now a subcommand of node-ffmpeg-tools. Use:');
console.warn('  node-ffmpeg-tools down-rm-watermark <url>');
import { $ } from 'zx';
const url = process.argv.slice(2).find((a) => !a.startsWith('-'));
if (!url) {
  console.error('\nUsage: node-ffmpeg-tools down-rm-watermark <url>');
  process.exit(1);
}
await $`node-ffmpeg-tools down-rm-watermark ${url}`;
