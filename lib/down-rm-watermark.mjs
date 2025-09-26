import 'zx/globals';
import crypto from 'crypto';

export default async function runDownRmWatermark(url, options = {}) {
  // Prepare directories
  const inputDir = path.resolve('input/down-rm-watermark');
  const outputDir = path.resolve('output');
  await fs.mkdir(inputDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  // Generate timestamp filename and URL hash
  const ts = Date.now();
  const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
  const outputFileName = `${ts}_${urlHash}.mp4`;
  const outputPath = path.join(outputDir, outputFileName);

  // Check if this URL was already downloaded by looking for existing files
  const existingFiles = await fs.readdir(inputDir).catch(() => []);
  const existingFile = existingFiles.find(file => file.includes(urlHash));
  
  let actualInputPath;
  
  if (existingFile) {
    actualInputPath = path.join(inputDir, existingFile);
    console.log(`\n[1/3] Found existing download: ${actualInputPath}`);
    // Remove old output files for this URL
    const outputFiles = await fs.readdir(outputDir).catch(() => []);
    for (const file of outputFiles) {
      if (file.includes(urlHash)) {
        await fs.remove(path.join(outputDir, file));
        console.log(`Removed old output: ${file}`);
      }
    }
  } else {
    // Download with timestamp filename but include hash for future reference
    const timestampWithHash = `${ts}_${urlHash}.mp4`;
    actualInputPath = path.join(inputDir, timestampWithHash);
    console.log(`\n[1/3] Downloading to ${actualInputPath}`);
    await $`curl -L --fail --retry 3 --retry-delay 1 -o ${actualInputPath} ${url}`;
  }

  const keepWatermark = options.keepWatermark === true; // default: blur watermark
  let filter;
  if (keepWatermark) {
    console.log(`[2/3] Processing (keep bottom-right watermark, no blur) ...`);
    // Only upscale to 4K (longer side 3840) while preserving aspect ratio
    filter =
      "[0:v]scale=w='if(gte(iw,ih),3840,-2)':h='if(gte(iw,ih),-2,3840)'[vout]";
  } else {
    console.log(`[2/3] Processing (blurring bottom-right watermark) ...`);
    // Precise blur area matching the red box in the 9:16 video
    // Red box dimensions: ~22% width, ~3.5% height, positioned at ~78% from left, ~96.5% from top
    // After watermark blur/overlay, upscale to 4K (longer side 3840) while preserving aspect ratio
    filter =
      "[0:v]split=2[v0][v1];" +
      "[v1]crop=w=iw*0.22:h=ih*0.04:x=iw*0.78:y=ih*0.96,boxblur=lr=10:lp=2:cr=10:cp=2[blur];" +
      "[v0][blur]overlay=x=W-w:y=H-h,scale=w='if(gte(iw,ih),3840,-2)':h='if(gte(iw,ih),-2,3840)'[vout]";
  }
  console.log(`[2.2/3] Upscaling to 4K (longer side 3840)`);

  const bgMusic = options.bgMusic;
  let useBgMusic = false;
  if (bgMusic) {
    try {
      const exists = await fs.pathExists(bgMusic);
      if (exists) {
        useBgMusic = true;
      } else {
        console.warn(`[warn] Provided bg-music not found: ${bgMusic}. Proceeding without bg-music.`);
      }
    } catch (e) {
      console.warn(`[warn] Could not verify bg-music path: ${bgMusic}. Proceeding without bg-music.`);
    }
  }

  if (useBgMusic) {
    console.log(`[2.5/3] Merging background audio: ${bgMusic}`);
    // Map processed video from input 0 and audio from input 1, re-encode audio to AAC for mp4 compatibility
    await $`ffmpeg -y -i ${actualInputPath} -i ${bgMusic} -filter_complex ${filter} -map [vout] -map 1:a:0 -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a aac -b:a 192k -shortest ${outputPath}`;
  } else {
    // Map filtered video and copy the first audio stream from input 0 if present
    await $`ffmpeg -y -i ${actualInputPath} -filter_complex ${filter} -map [vout] -map 0:a? -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a copy ${outputPath}`;
  }

  console.log(`[3/3] Output saved to ${outputPath}`);
  console.log(`\nDone!`);
  console.log(`Input (original): ${actualInputPath}`);
  console.log(`Output (processed): ${outputPath}`);
}
