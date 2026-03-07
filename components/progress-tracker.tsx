"use client"

import { Check, Loader2, Circle, AlertCircle, FileText, Mic, Monitor, Film } from "lucide-react"
import type { JobStatus } from "@/lib/types"

interface ProgressTrackerProps {
  status: JobStatus
  error?: string | null
}

const steps = [
  { key: "generating_script", label: "Generating Script", icon: FileText, description: "Analyzing code and creating demo narrative" },
  { key: "generating_voice", label: "Generating Voice", icon: Mic, description: "Creating AI voiceover audio" },
  { key: "recording", label: "Recording", icon: Monitor, description: "Capturing screen interactions" },
  { key: "assembling", label: "Assembling", icon: Film, description: "Combining video and audio" },
]

function getStepStatus(stepKey: string, currentStatus: JobStatus): "pending" | "active" | "completed" {
  const statusOrder: JobStatus[] = ["idle", "starting", "generating_script", "generating_voice", "recording", "assembling", "done"]
  const stepIndex = statusOrder.indexOf(stepKey as JobStatus)
  const currentIndex = statusOrder.indexOf(currentStatus)

  if (currentStatus === "error" || currentStatus === "done") {
    return stepIndex <= currentIndex - 1 ? "completed" : "pending"
  }

  if (stepIndex < currentIndex) return "completed"
  if (stepIndex === currentIndex) return "active"
  return "pending"
}

export function ProgressTracker({ status, error }: ProgressTrackerProps) {
  if (status === "idle") return null

  const isError = status === "error"
  const isDone = status === "done"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Generation Progress</h3>
        {isDone && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
            <Check className="h-3.5 w-3.5" />
            Complete
          </span>
        )}
        {isError && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed
          </span>
        )}
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.key, status)
          const Icon = step.icon

          return (
            <div
              key={step.key}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                stepStatus === "active"
                  ? "border-foreground/20 bg-secondary"
                  : stepStatus === "completed"
                  ? "border-border bg-secondary/30"
                  : "border-border/50 bg-transparent opacity-50"
              }`}
            >
              <div
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                  stepStatus === "completed"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : stepStatus === "active"
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {stepStatus === "completed" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : stepStatus === "active" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    stepStatus === "pending" ? "text-muted-foreground" : ""
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {isError && error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
