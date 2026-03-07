export interface Action {
  type: "click" | "type" | "wait" | "scroll" | "hover"
  target?: string
  value?: string
  duration?: number
  description?: string
}

export interface Scene {
  id: string
  description: string
  narration: string
  actions: Action[]
  duration?: number
}

export interface DemoScript {
  title: string
  productName: string
  scenes: Scene[]
}

export type JobStatus =
  | "idle"
  | "starting"
  | "generating_script"
  | "generating_voice"
  | "recording"
  | "assembling"
  | "done"
  | "error"

export interface JobState {
  status: JobStatus
  message: string
  error: string | null
  script: DemoScript | null
  progress?: number
}

export interface GenerateRequest {
  repoUrl: string
  appUrl: string
  skipVoice: boolean
}
