import { NextResponse } from "next/server"
import type { GenerateRequest, JobState, DemoScript } from "@/lib/types"

// In-memory job state (in production, use a database or Redis)
declare global {
  // eslint-disable-next-line no-var
  var currentJob: JobState | undefined
}

if (!global.currentJob) {
  global.currentJob = {
    status: "idle",
    message: "",
    error: null,
    script: null,
  }
}

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json()
    const { repoUrl, appUrl, skipVoice } = body

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    // Check if a job is already running
    if (
      global.currentJob!.status !== "idle" &&
      global.currentJob!.status !== "done" &&
      global.currentJob!.status !== "error"
    ) {
      return NextResponse.json({ error: "A job is already in progress" }, { status: 409 })
    }

    // Reset job state
    global.currentJob = {
      status: "starting",
      message: "Initializing video generation...",
      error: null,
      script: null,
    }

    // Start generation process in background
    generateDemo(repoUrl, appUrl, skipVoice).catch((error) => {
      console.error("Generation failed:", error)
      global.currentJob = {
        ...global.currentJob!,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    })

    return NextResponse.json({ message: "Job started successfully" })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    )
  }
}

async function generateDemo(repoUrl: string, appUrl: string, skipVoice: boolean) {
  // Simulate the generation process
  // In production, this would call the actual video-generator functions
  
  try {
    // Step 1: Generate Script
    global.currentJob = {
      ...global.currentJob!,
      status: "generating_script",
      message: "Analyzing repository and generating demo script...",
    }
    
    // Simulate script generation
    await delay(3000)
    
    const mockScript: DemoScript = {
      title: "Product Demo",
      productName: extractRepoName(repoUrl),
      scenes: [
        {
          id: "intro",
          description: "Introduction to the application",
          narration: "Welcome to our application demo. Let me show you the key features.",
          actions: [{ type: "wait", duration: 2000 }],
        },
        {
          id: "feature1",
          description: "Demonstrating main feature",
          narration: "Here you can see the main functionality of our application.",
          actions: [
            { type: "click", target: "button.primary" },
            { type: "wait", duration: 1000 },
          ],
        },
        {
          id: "conclusion",
          description: "Wrap up",
          narration: "That concludes our demo. Thank you for watching!",
          actions: [{ type: "wait", duration: 2000 }],
        },
      ],
    }
    
    global.currentJob = {
      ...global.currentJob!,
      script: mockScript,
    }

    // Step 2: Generate Voice
    if (!skipVoice) {
      global.currentJob = {
        ...global.currentJob!,
        status: "generating_voice",
        message: "Generating AI voiceover...",
      }
      await delay(2000)
    }

    // Step 3: Record Screen
    global.currentJob = {
      ...global.currentJob!,
      status: "recording",
      message: "Recording screen interactions...",
    }
    await delay(3000)

    // Step 4: Assemble Video
    global.currentJob = {
      ...global.currentJob!,
      status: "assembling",
      message: "Assembling final video...",
    }
    await delay(2000)

    // Done
    global.currentJob = {
      ...global.currentJob!,
      status: "done",
      message: "Video generated successfully!",
    }
  } catch (error) {
    throw error
  }
}

function extractRepoName(url: string): string {
  if (url.includes("github.com")) {
    const parts = url.split("/")
    return parts[parts.length - 1] || parts[parts.length - 2] || "Demo"
  }
  if (url.startsWith("/")) {
    const parts = url.split("/")
    return parts[parts.length - 1] || "Demo"
  }
  return "Demo"
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
