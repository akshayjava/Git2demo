import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { DemoScript } from './types';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function generateVoice(script: DemoScript, outputDir: string): Promise<Map<string, string>> {
  const audioMap = new Map<string, string>();
  // Default to none if not specified
  const provider = process.env.TTS_PROVIDER || 'none';

  console.log(`Generating voiceover using provider: ${provider}`);

  for (const scene of script.scenes) {
    const fileName = `audio-${scene.id}.mp3`;
    const filePath = path.join(outputDir, fileName);

    // If we already have the file, maybe skip?
    // But user might want to regenerate. Let's check a flag?
    // Assuming always regenerate or user handles cleaning.

    if (fs.existsSync(filePath)) {
        console.log(`Audio for scene ${scene.id} already exists. Using existing file.`);
        audioMap.set(scene.id, filePath);
        continue;
    }

    const text = scene.narration;

    // If no text, generate silence for scene duration (default 2s)
    if (!text) {
        console.log(`Scene ${scene.id} has no narration. Generating silence.`);
        const duration = scene.duration || 2;
        await generateSilence(duration, filePath);
        audioMap.set(scene.id, filePath);
        continue;
    }

    try {
      if (provider === 'openai') {
        if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text,
        });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.promises.writeFile(filePath, buffer);
      } else if (provider === 'elevenlabs') {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel

        if (!apiKey) throw new Error('ELEVENLABS_API_KEY missing');

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_monolingual_v1",
                voice_settings: { stability: 0.5, similarity_boost: 0.5 }
            })
        });

        if (!response.ok) throw new Error(`ElevenLabs API error: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.promises.writeFile(filePath, buffer);
      } else {
        // 'none' or fallback: generate silent audio based on text length
        const duration = Math.max(2, text.length / 15); // Approx speaking rate (chars per sec)
        await generateSilence(duration, filePath);
      }
      audioMap.set(scene.id, filePath);
    } catch (error) {
      console.error(`Failed to generate audio for scene ${scene.id} with provider ${provider}:`, error);
      console.log('Falling back to silence.');
      // Fallback to silence
      const duration = Math.max(2, text.length / 15);
      await generateSilence(duration, filePath);
      audioMap.set(scene.id, filePath);
    }
  }

  return audioMap;
}

async function generateSilence(duration: number, filePath: string) {
    // ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t <duration> -q:a 9 -acodec libmp3lame <filePath>
    // Ensure duration is formatted correctly (e.g. integer or float)
    const cmd = `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${duration} -q:a 9 -acodec libmp3lame "${filePath}"`;
    try {
        await execPromise(cmd);
    } catch (e) {
        console.error('Failed to generate silence:', e);
        throw e;
    }
}
