# Git2Demo 🎥

Automatically generate high-quality product demo videos from your codebase. Git2Demo scans your repository, generates a professional narration script using Claude, records a screen demo using Playwright, and assembles the final video with AI-generated voiceovers.

## Features

- **AI-Powered Scripting**: Analyzes your code to create a natural, engaging demo narrative.
- **Automated Interaction**: Uses Playwright to perform real clicks and typing in your app.
- **Voice Synthesis**: Generates clear narration from the script.
- **Zero-Effort Assembly**: Combines video and audio into a final production-ready MP4.

## Quick Start

### 1. Prerequisites

- **Node.js** (v18+)
- **FFmpeg**: Required for video assembly.
  ```bash
  # macOS
  brew install ffmpeg
  ```
- **Anthropic API Key**: Required for script generation. Copy `video-generator/.env.example` to `video-generator/.env` and fill in your key.

### 2. Setup

```bash
cd video-generator
npm install
npx playwright install --with-deps chromium
```

### 3. Generate a Demo

Ensure your application is running locally (e.g., at `http://localhost:3000`).

```bash
npx ts-node src/index.ts \
  --repo /path/to/your/project \
  --url http://localhost:3000 \
  --output ./my-demo
```

## CLI Options

| Option | Description |
| :--- | :--- |
| `--repo` | **(Required)** Absolute path to the repository to scan. |
| `--url` | The URL where your application is running (default: `http://localhost:3000` or `APP_URL` env). |
| `--output` | Directory for artifacts (default: `output`). |
| `--script-only` | Only generate the JSON script (skip recording/audio). |
| `--skip-voice` | Skip Text-to-Speech generation. |
| `--skip-record` | Skip screen recording. |
| `--script` | Use an existing JSON script instead of generating one. |

## License

ISC
