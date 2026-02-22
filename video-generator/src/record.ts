import { chromium, BrowserContext, Page } from 'playwright';
import { DemoScript, Scene, Action } from './types';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

export async function recordDemo(script: DemoScript, url: string, outputDir: string, audioMap: Map<string, string>): Promise<string> {
  console.log(`Starting recording session on ${url}`);

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
  });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Initial wait to let page settle
    await page.waitForTimeout(2000);

    for (const scene of script.scenes) {
      console.log(`Recording scene: ${scene.id}`);
      const audioPath = audioMap.get(scene.id);
      let sceneDuration = 0;

      if (audioPath) {
        sceneDuration = await getAudioDuration(audioPath);
        console.log(`Scene duration (audio): ${sceneDuration}s`);
      } else {
        sceneDuration = scene.duration || 5; // Default 5s if no audio
      }

      const startTime = Date.now();

      // Execute actions
      for (const action of scene.actions) {
        await executeAction(page, action);
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = sceneDuration - elapsed;

      if (remaining > 0) {
        console.log(`Waiting ${remaining.toFixed(2)}s to match audio...`);
        await page.waitForTimeout(remaining * 1000);
      } else {
        console.warn(`Scene ${scene.id} actions took longer than audio by ${Math.abs(remaining).toFixed(2)}s`);
      }
    }

    // Give a little buffer at the end
    await page.waitForTimeout(1000);

  } catch (e) {
    console.error('Recording failed:', e);
    throw e;
  } finally {
    await context.close();
    await browser.close();
  }

  // Find the video file
  const files = await fs.promises.readdir(outputDir);
  // Playwright saves as <random>.webm. We need to find the most recent one or the only one created.
  // Since we passed `dir: outputDir`, it puts it there.
  // But if we run multiple times, there might be multiple files.
  // We should look for the one created just now.
  // However, `context.close()` saves the file.

  // A better way is to get the page video object.
  const video = page.video();
  if (video) {
      const videoPath = await video.path();
      const newPath = path.join(outputDir, 'recording.webm');
      // video.path() returns the full path. We can rename it.
      // Wait, `video.path()` might be inside `outputDir`.
      // Let's just rename it to be safe and consistent.
      // But we need to make sure `video.saveAs` or `fs.rename` works.
      // Since `video.path()` exists, we can rename.

      // Note: `video.path()` needs the context to be closed?
      // Documentation says: "The video file is guaranteed to be fully written when the browser context is closed."
      // We closed the context above. So the file should be ready.
      // But we can't call `video.path()` after context is closed?
      // Actually `video` object persists?
      // No, `page` is closed. `video` object might not work.

      // Strategy: Capture the path *before* closing context?
      // "path(): Promise<string>" - "Wait for the video to finish being recorded and saved... The video file is guaranteed to be saved after page.close() is called."
      // So we should call `video.path()` after `page.close()` but before `context.close()`?
      // Actually, if we close context, page closes.

      // Let's refine the close sequence.
      // The video is saved to `outputDir` with a random name.
      // We can find the latest .webm file in `outputDir`.
  }

  // Let's find the latest webm file in outputDir.
  const webmFiles = files.filter(f => f.endsWith('.webm'));
  // Sort by mtime
  const sorted = webmFiles.map(f => ({
      name: f,
      time: fs.statSync(path.join(outputDir, f)).mtime.getTime()
  })).sort((a, b) => b.time - a.time);

  if (sorted.length === 0) throw new Error('No recording found');

  const latest = sorted[0].name;
  const oldPath = path.join(outputDir, latest);
  const newPath = path.join(outputDir, 'recording.webm');

  // If we are re-running, `recording.webm` might be the old one or the new one if we renamed it previously.
  // We should be careful not to overwrite if it's the same file?
  // We will always overwrite `recording.webm` with the latest random file.
  if (oldPath !== newPath) {
      await fs.promises.rename(oldPath, newPath);
  }

  return newPath;
}

async function executeAction(page: Page, action: Action) {
  console.log(`Executing action: ${action.type} ${action.target || ''}`);
  try {
    switch (action.type) {
      case 'click':
        if (action.target) await page.click(action.target);
        break;
      case 'type':
        if (action.target && action.value) await page.fill(action.target, action.value);
        break;
      case 'wait':
        if (action.duration) await page.waitForTimeout(action.duration);
        break;
      case 'hover':
        if (action.target) await page.hover(action.target);
        break;
      case 'scroll':
         // Scroll down a bit
         await page.mouse.wheel(0, 300);
         break;
    }
    // implicit wait after actions?
    await page.waitForTimeout(500);
  } catch (e) {
    console.warn(`Action failed: ${action.type} ${action.target}`, e);
    // Continue despite error?
  }
}

function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}
