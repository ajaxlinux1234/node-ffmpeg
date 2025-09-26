# node-ffmpeg-tools

ZX-based CLI tools for working with videos via globally installed `ffmpeg`.

Currently includes one command: `down-rm-watermark`.

## Prerequisites

- Node.js 18+ and npm
- A global `ffmpeg` available in your PATH

## Install

Inside this project directory:

```bash
npm install
```

Optionally link the CLI globally for convenience:

```bash
npm link
```

This will make `down-rm-watermark` available on your PATH.

## Usage

Download an mp4 from a URL into `input/down-rm-watermark/` with a millisecond timestamp filename, blur a patch at the bottom-right to cover watermark text, and output to `output/`:

### Command line usage:

```bash
node-ffmpeg-tools down-rm-watermark "https://example.com/video.mp4"
# or with flags
node-ffmpeg-tools down-rm-watermark --url "https://example.com/video.mp4"
node-ffmpeg-tools down-rm-watermark -u "https://example.com/video.mp4"
```

### Config file usage:

Create or edit `config.json` in the project root:

```json
{
  "down-rm-watermark": {
    "url": "https://example.com/video.mp4"
  }
}
```

Then run without parameters:

```bash
node-ffmpeg-tools down-rm-watermark
```

The CLI will automatically use the URL from config.json when no URL is provided via command line.

Output directory structure:

```
input/
  down-rm-watermark/
    1695891234567_c58f53744bfd.mp4  # original downloaded file
output/
    1695891234568_c58f53744bfd.mp4  # processed file with blurred watermark
config.json                         # configuration file
```

## How it works

The script:

1. Creates `input/down-rm-watermark/` and `output/` directories if missing
2. Checks if the URL was already downloaded (by URL hash) to avoid duplicates
3. Downloads the video as `<timestamp>_<urlhash>.mp4` if not already present
4. Runs `ffmpeg` with a precise filter that blurs only the bottom-right watermark area
5. Outputs the processed video to `output/` with a new timestamp

The blur region is defined as a percentage of the video dimensions and should work for typical bottom-right watermarks. You can tweak the crop and blur parameters in `bin/down-rm-watermark.mjs` if needed.

## Notes

- The command preserves audio by copying it (`-c:a copy`).
- If the URL is not reachable or the download fails, `curl` will retry up to 3 times.