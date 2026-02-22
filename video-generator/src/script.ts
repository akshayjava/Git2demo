import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { DemoScript, RepoContext, Scene, Action } from './types';
import dotenv from 'dotenv';

dotenv.config();

const MAX_FILE_SIZE = 100 * 1024; // 100KB limit per file
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage'];
const ALLOWED_EXTS = ['.ts', '.js', '.tsx', '.jsx', '.html', '.css', '.md', '.json'];

async function scanRepo(repoPath: string): Promise<RepoContext> {
  const files: { path: string; content: string }[] = [];
  const repoName = path.basename(repoPath);

  async function walk(dir: string) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(repoPath, fullPath);

      if (entry.isDirectory()) {
        if (IGNORE_DIRS.includes(entry.name)) continue;
        await walk(fullPath);
      } else if (entry.isFile()) {
        if (!ALLOWED_EXTS.includes(path.extname(entry.name))) continue;
        const stats = await fs.promises.stat(fullPath);
        if (stats.size > MAX_FILE_SIZE) continue;

        try {
          const content = await fs.promises.readFile(fullPath, 'utf-8');
          files.push({ path: relativePath, content });
        } catch (e) {
          console.warn(`Failed to read file ${relativePath}:`, e);
        }
      }
    }
  }

  await walk(repoPath);
  return { name: repoName, description: 'Auto-scanned repo', files };
}

export async function generateScript(repoPath: string, productUrl: string): Promise<DemoScript> {
  const context = await scanRepo(repoPath);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not found. Returning mock script for sample-app.');
    return getMockScript(productUrl);
  }

  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `
You are a product demo expert. Your task is to generate a JSON script for a product demo video based on the provided repository code.
The output must strictly follow the JSON schema for DemoScript.
The demo should be about 90 seconds long.
The demo will be recorded using Playwright on the provided product URL: ${productUrl}.
The script must include:
1. Scenes with narration text for TTS.
2. Playwright actions (click, type, wait) with CSS selectors derived from the code (e.g., HTML/JSX).
   - Use 'id' attributes or unique classes for selectors where possible.
   - If you see <button id="login-btn">, use '#login-btn'.
   - If you see <input placeholder="Username">, try 'input[placeholder="Username"]'.
   - Ensure wait times are sufficient for TTS narration.

Output ONLY valid JSON. No markdown formatting.
`;

  const userMessage = `
Repo Name: ${context.name}
Files:
${context.files.slice(0, 20).map(f => `--- ${f.path} ---\n${f.content.slice(0, 2000)}`).join('\n\n')}

Generate a DemoScript JSON.
`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    // Extract JSON from response (it might be wrapped in ```json ... ```)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DemoScript;
    }
    throw new Error('Failed to parse JSON from Claude response');

  } catch (error) {
    console.error('Error generating script:', error);
    console.log('Falling back to mock script.');
    return getMockScript(productUrl);
  }
}

function getMockScript(productUrl: string): DemoScript {
  return {
    title: 'CyberTip Triage Demo',
    productName: 'CyberTip Triage',
    scenes: [
      {
        id: 'intro',
        description: 'Introduction to the login screen',
        narration: 'Welcome to CyberTip Triage. Let\'s start by logging in to the dashboard.',
        actions: [
          { type: 'wait', duration: 1000 },
          { type: 'type', target: '#username', value: 'admin' },
          { type: 'wait', duration: 500 },
          { type: 'type', target: '#password', value: 'securepass' },
          { type: 'wait', duration: 500 },
          { type: 'click', target: '#login-button' },
          { type: 'wait', duration: 2000 }
        ]
      },
      {
        id: 'dashboard',
        description: 'Overview of the dashboard alerts',
        narration: 'Here is the main dashboard. We can see a list of active security alerts requiring attention.',
        actions: [
          { type: 'wait', duration: 1000 },
          { type: 'hover', target: '#alert-1' },
          { type: 'wait', duration: 1000 },
          { type: 'hover', target: '#alert-2' },
          { type: 'wait', duration: 1000 }
        ]
      },
      {
        id: 'resolution',
        description: 'Resolving an alert',
        narration: 'Let\'s resolve the first suspicious activity alert. With just one click, the threat is neutralized.',
        actions: [
            { type: 'click', target: '.resolve-btn[data-id="1"]' },
            { type: 'wait', duration: 2000 }
        ]
      },
      {
        id: 'outro',
        description: 'Conclusion',
        narration: 'And that\'s how easy it is to manage threats with CyberTip Triage. Thanks for watching.',
        actions: [
            { type: 'wait', duration: 3000 }
        ]
      }
    ]
  };
}
