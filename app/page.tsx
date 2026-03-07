"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { RepoInput } from "@/components/repo-input"
import { ProgressTracker } from "@/components/progress-tracker"
import { VideoPreview } from "@/components/video-preview"
import type { JobState, GenerateRequest } from "@/lib/types"

export default function HomePage() {
  const [jobState, setJobState] = useState<JobState>({
    status: "idle",
    message: "",
    error: null,
    script: null,
  })
  const [isPolling, setIsPolling] = useState(false)

  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/status")
      if (!response.ok) throw new Error("Failed to fetch status")
      const data: JobState = await response.json()
      setJobState(data)

      if (data.status === "done" || data.status === "error") {
        setIsPolling(false)
      }
    } catch (error) {
      console.log("[v0] Polling error:", error)
    }
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (isPolling) {
      intervalId = setInterval(pollStatus, 2000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isPolling, pollStatus])

  const handleSubmit = async (data: GenerateRequest) => {
    setJobState({
      status: "starting",
      message: "Initializing...",
      error: null,
      script: null,
    })

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to start generation")
      }

      setIsPolling(true)
    } catch (error) {
      setJobState({
        status: "error",
        message: "Failed to start generation",
        error: error instanceof Error ? error.message : "Unknown error",
        script: null,
      })
    }
  }

  const isGenerating =
    jobState.status !== "idle" &&
    jobState.status !== "done" &&
    jobState.status !== "error"

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-balance">
            Generate Product Demo Videos
          </h1>
          <p className="text-base text-muted-foreground text-pretty">
            Transform your codebase into professional demo videos with AI-powered
            narration and automated screen recording.
          </p>
        </div>

        <div className="space-y-8">
          <div className="rounded-xl border border-border bg-card p-6">
            <RepoInput onSubmit={handleSubmit} isLoading={isGenerating} />
          </div>

          {jobState.status !== "idle" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <ProgressTracker status={jobState.status} error={jobState.error} />
            </div>
          )}

          {jobState.status === "done" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <VideoPreview
                videoUrl={`/api/video?t=${Date.now()}`}
                script={jobState.script}
              />
            </div>
          )}
        </div>

        <footer className="mt-16 border-t border-border pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Git2Demo analyzes your repository, generates a professional script using
            AI, records screen interactions, and assembles the final video with
            voiceover.
          </p>
        </footer>
      </main>
    </div>
  )
}
