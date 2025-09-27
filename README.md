# node-ffmpeg-tools

ZX-based CLI tools for working with videos via globally installed `ffmpeg`.

Currently includes commands: `down-rm-watermark`, `history-person`, `ai-remove-watermark`.

## Prerequisites

- Node.js 18+ and npm
- A global `ffmpeg` available in your PATH
  - **Windows**: Install from [ffmpeg.org](https://ffmpeg.org/download.html#build-windows) or using [Chocolatey](https://chocolatey.org/): `choco install ffmpeg`
  - **macOS**: Install via [Homebrew](https://brew.sh/): `brew install ffmpeg`
  - **Linux**: Install via your package manager, e.g., `sudo apt install ffmpeg` (Ubuntu/Debian)
- For `ai-remove-watermark`:
  - `python3` with `venv` and `pip`
  - Internet access to install Python packages on first run (PyTorch CPU wheels and `lama-cleaner`)
  - Optional but recommended: ImageMagick (`convert`) for fast mask generation; otherwise it falls back to ffmpeg drawbox

## Platform Compatibility

This tool is designed to work cross-platform on Windows, macOS, and Linux with the following considerations:

- **File permissions**: The `prepare` script automatically handles platform-specific file permission requirements
- **Path handling**: All file paths are handled cross-platform using Node.js path module
- **Command execution**: Uses zx library for cross-platform shell command execution
- **Dependencies**: Requires globally installed `ffmpeg` and optionally `python3`

## Install

Inside this project directory:

```bash
npm install
```

Optionally link the CLI globally for convenience:

```bash
npm link
```

This will make the CLI available on your PATH.

## Usage

### 1) down-rm-watermark

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

---

### 2) history-person

Uses `config.json` to drive the workflow (download, add titles/subtitles via ASS, compose background music). See the template in `config.json` under `"history-person"`.

Run:

```bash
node-ffmpeg-tools history-person
```

---

### 3) ai-remove-watermark (AI inpainting)

AI-based watermark removal that keeps the original video resolution, aspect ratio, frame rate, and color info as much as possible. The pipeline is:

1. Download or resolve input video into `input/ai-remove-watermark/` (remote URLs are deduped via a manifest; files named as `<milliseconds>.mp4`).
2. Extract frames with ffmpeg (no scaling), preserving frame rate.
3. Generate a static mask at the bottom-right area (default heuristic). You can replace the mask with your custom `mask.png` in the working cache if needed.
4. Run LaMa inpainting (via `lama-cleaner`) on each frame to remove watermark pixels.
5. Reassemble frames into a video and mux original audio back. We attempt to keep pixel format and color metadata; codec defaults to `libx264` if original codec not mapped.

First run will set up a Python virtual environment under `.cache/ai-remove-watermark/venv` and install dependencies (PyTorch CPU wheels, `lama-cleaner`). This can take several minutes.

Command line usage:

```bash
node-ffmpeg-tools ai-remove-watermark "https://example.com/video.mp4"
# or
node-ffmpeg-tools ai-remove-watermark --url "https://example.com/video.mp4"
```

Config file usage:

```json
{
  "ai-remove-watermark": {
    "url": "https://example.com/video.mp4"
  }
}
```

Then run without parameters:

```bash
node-ffmpeg-tools ai-remove-watermark
```

Output directory structure (simplified):

```
input/
  ai-remove-watermark/
    1758868423130.mp4
output/
  ai-remove-watermark/
    1758868423130_ai_rmwm.mp4
.cache/
  ai-remove-watermark/
    venv/                 # python venv for LaMa
    <video-id>/
      frames/             # extracted frames
      inpainted/          # AI cleaned frames
      mask.png            # generated default mask
```

Notes:

- The tool does not change the original resolution or aspect ratio.
- Frame rate is preserved when rebuilding the video.
- Original audio is copied back (`-c:a copy`).
- If you prefer a custom watermark region, replace the generated `mask.png` in the cache working directory before processing, or update the implementation to accept a custom mask path.