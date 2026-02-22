import express from 'express';
import path from 'path';
import fs from 'fs';
import { generateScript } from './script';
import { generateVoice } from './voice';
import { recordDemo } from './record';
import { assembleVideo } from './assemble';
import { DemoScript } from './types';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Global state for simplicity
let currentJob = {
  status: 'idle', // idle, generating_script, generating_voice, recording, assembling, done, error
  message: '',
  outputDir: path.join(__dirname, '../output'),
  error: null as string | null,
  script: null as DemoScript | null,
};

app.post('/api/generate', async (req, res) => {
  const { repoPath, appUrl, skipVoice } = req.body;

  if (currentJob.status !== 'idle' && currentJob.status !== 'done' && currentJob.status !== 'error') {
    return res.status(409).json({ error: 'Job already in progress' });
  }

  currentJob = {
    status: 'starting',
    message: 'Starting generation...',
    outputDir: path.join(__dirname, '../output'),
    error: null,
    script: null,
  };

  // Start background process
  generateProcess(repoPath, appUrl, skipVoice).catch(err => {
    console.error('Job failed:', err);
    currentJob.status = 'error';
    currentJob.error = err.message;
  });

  res.json({ message: 'Job started' });
});

async function generateProcess(repoPath: string, appUrl: string, skipVoice: boolean) {
  try {
    if (!fs.existsSync(currentJob.outputDir)) {
      fs.mkdirSync(currentJob.outputDir, { recursive: true });
    }

    currentJob.status = 'generating_script';
    currentJob.message = 'Analyzing repo and generating script...';

    // Check if repo exists
    if (!fs.existsSync(repoPath)) {
        throw new Error(`Repo not found at ${repoPath}`);
    }

    const script = await generateScript(repoPath, appUrl);
    currentJob.script = script;
    fs.writeFileSync(path.join(currentJob.outputDir, 'latest.json'), JSON.stringify(script, null, 2));

    let audioMap = new Map<string, string>();
    if (!skipVoice) {
      currentJob.status = 'generating_voice';
      currentJob.message = 'Generating voiceover...';
      audioMap = await generateVoice(script, currentJob.outputDir);
    }

    currentJob.status = 'recording';
    currentJob.message = 'Recording screen...';
    const videoPath = await recordDemo(script, appUrl, currentJob.outputDir, audioMap);

    currentJob.status = 'assembling';
    currentJob.message = 'Assembling final video...';
    const finalVideo = await assembleVideo(script, videoPath, audioMap, currentJob.outputDir);

    currentJob.status = 'done';
    currentJob.message = 'Video generated successfully!';

  } catch (error: any) {
    console.error(error);
    currentJob.status = 'error';
    currentJob.error = error.message || String(error);
  }
}

app.get('/api/status', (req, res) => {
  res.json(currentJob);
});

app.get('/api/script', (req, res) => {
    if (currentJob.script) {
        res.json(currentJob.script);
    } else if (fs.existsSync(path.join(currentJob.outputDir, 'latest.json'))) {
        res.sendFile(path.join(currentJob.outputDir, 'latest.json'));
    } else {
        res.status(404).json({ error: 'No script found' });
    }
});

app.get('/video', (req, res) => {
  const videoPath = path.join(currentJob.outputDir, 'demo.mp4');
  if (fs.existsSync(videoPath)) {
    res.sendFile(videoPath);
  } else {
    res.status(404).send('Video not found');
  }
});

app.listen(port, () => {
  console.log(`Video Generator UI running at http://localhost:${port}`);
});
