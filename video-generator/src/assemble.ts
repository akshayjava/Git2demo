import fs from 'fs';
import path from 'path';
import { DemoScript } from './types';
import util from 'util';
import { exec } from 'child_process';

const execPromise = util.promisify(exec);

export async function assembleVideo(script: DemoScript, videoPath: string, audioMap: Map<string, string>, outputDir: string): Promise<string> {
  console.log('Assembling final video...');

  const concatListPath = path.join(outputDir, 'audio-files.txt');
  const audioFiles = script.scenes.map(scene => {
    const p = audioMap.get(scene.id);
    // Escape single quotes in filename for ffmpeg concat list
    return p ? `file '${path.resolve(p).replace(/'/g, "'\\''")}'` : null;
  }).filter(Boolean);

  if (audioFiles.length === 0) {
    console.warn('No audio files found. Using silent video.');
    const outputPath = path.join(outputDir, 'demo.mp4');
    // Just copy video to mp4, no audio
    // We use -c:v libx264 to ensure compatibility
    await execPromise(`ffmpeg -y -i "${videoPath}" -c:v libx264 -an "${outputPath}"`);
    return outputPath;
  }

  await fs.promises.writeFile(concatListPath, audioFiles.join('\n'));

  // 2. Concatenate audio
  const combinedAudioPath = path.join(outputDir, 'voiceover.mp3');
  console.log(`Concatenating audio to ${combinedAudioPath}`);
  await execPromise(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${combinedAudioPath}"`);

  // 3. Mux video and audio
  const finalOutputPath = path.join(outputDir, 'demo.mp4');
  console.log(`Muxing to ${finalOutputPath}`);

  // Use shorter of the two streams? No, we want full video content usually.
  // Actually, -shortest cuts to shortest stream.
  // Default is keep going until all streams end (audio might continue after video ends, or vice versa).
  // If we timed correctly, they should end together.

  const cmd = `ffmpeg -y -i "${videoPath}" -i "${combinedAudioPath}" -c:v libx264 -c:a aac -map 0:v:0 -map 1:a:0 "${finalOutputPath}"`;

  await execPromise(cmd);

  return finalOutputPath;
}
