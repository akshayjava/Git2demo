export interface Action {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
  target?: string; // CSS selector
  value?: string; // For 'type' actions
  duration?: number; // For 'wait' actions (in ms)
  description?: string; // Description of what this action does
}

export interface Scene {
  id: string;
  description: string; // Description of the scene
  narration: string; // Text for TTS
  actions: Action[];
  duration?: number; // Estimated duration in seconds (optional)
}

export interface DemoScript {
  title: string;
  productName: string;
  scenes: Scene[];
}

export interface RepoContext {
  name: string;
  description: string;
  files: { path: string; content: string }[];
}
