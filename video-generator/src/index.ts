#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import fs from 'fs';
import { generateScript } from './script';
import { generateVoice } from './voice';
import { recordDemo } from './record';
import { assembleVideo } from './assemble';
import { DemoScript } from './types';
import dotenv from 'dotenv';

dotenv.config();

interface Arguments {
  repo: string;
  url: string;
  output: string;
  'script-only': boolean;
  'skip-voice': boolean;
  'skip-record': boolean;
  script?: string;
}

const argv = yargs(hideBin(process.argv))
  .option('repo', { type: 'string', demandOption: true, description: 'Path to repository' })
  .option('url', { type: 'string', demandOption: true, description: 'URL of the running app' })
  .option('output', { type: 'string', default: 'output', description: 'Output directory' })
  .option('script-only', { type: 'boolean', default: false, description: 'Generate script only' })
  .option('skip-voice', { type: 'boolean', default: false, description: 'Skip voice generation' })
  .option('skip-record', { type: 'boolean', default: false, description: 'Skip recording' })
  .option('script', { type: 'string', description: 'Path to existing script JSON' })
  .parseSync();

async function main() {
  const repoPath = path.resolve(argv.repo);
  const outputDir = path.resolve(argv.output);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Repository: ${repoPath}`);
  console.log(`App URL: ${argv.url}`);
  console.log(`Output: ${outputDir}`);

  let script: DemoScript;

  // 1. Script Generation
  if (argv.script) {
    const scriptPath = path.resolve(argv.script);
    console.log(`Loading script from ${scriptPath}`);
    script = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));
  } else {
    console.log('Generating script...');
    script = await generateScript(repoPath, argv.url);
    const scriptPath = path.join(outputDir, 'latest-script.json');
    fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
    console.log(`Script saved to ${scriptPath}`);
  }

  if (argv['script-only']) {
    console.log('Script generation complete. Exiting.');
    return;
  }

  // 2. Voice Generation
  let audioMap = new Map<string, string>();
  if (!argv['skip-voice']) {
    console.log('Generating voiceover...');
    audioMap = await generateVoice(script, outputDir);
  } else {
    console.log('Skipping voice generation.');
    // If skipped, we might have existing files? Or none.
  }

  // 3. Screen Recording
  let videoPath = '';
  if (!argv['skip-record']) {
    console.log('Recording screen...');
    videoPath = await recordDemo(script, argv.url, outputDir, audioMap);
    console.log(`Recording saved to ${videoPath}`);
  } else {
      // Look for existing recording
      videoPath = path.join(outputDir, 'recording.webm');
      if (!fs.existsSync(videoPath)) {
          console.error('No recording found, and --skip-record was set. Cannot assemble.');
          return; // Exit if no video
      }
      console.log('Using existing recording.');
  }

  // 4. Assembly
  if (videoPath) {
    console.log('Assembling video...');
    const finalVideo = await assembleVideo(script, videoPath, audioMap, outputDir);
    console.log(`\nSuccess! Video generated at: ${finalVideo}`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
