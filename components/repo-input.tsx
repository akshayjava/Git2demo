"use client"

import { useState } from "react"
import { GitBranch, Link2, Settings2, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface RepoInputProps {
  onSubmit: (data: { repoUrl: string; appUrl: string; skipVoice: boolean }) => void
  isLoading: boolean
}

export function RepoInput({ onSubmit, isLoading }: RepoInputProps) {
  const [repoUrl, setRepoUrl] = useState("")
  const [appUrl, setAppUrl] = useState("http://localhost:3000")
  const [skipVoice, setSkipVoice] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl.trim()) return
    onSubmit({ repoUrl: repoUrl.trim(), appUrl: appUrl.trim(), skipVoice })
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const isRepoValid = repoUrl.trim().length > 0 && (
    repoUrl.includes("github.com") || 
    repoUrl.startsWith("/") ||
    repoUrl.includes("/")
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="repo" className="flex items-center gap-2 text-sm font-medium">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          GitHub Repository
        </Label>
        <Input
          id="repo"
          type="text"
          placeholder="https://github.com/owner/repo or /path/to/local/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="h-11 bg-secondary/50 border-input transition-colors focus:bg-secondary"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Enter a GitHub URL or local file path to analyze your codebase
        </p>
      </div>

      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex w-full items-center justify-between px-0 hover:bg-transparent"
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              Advanced Options
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="space-y-3">
            <Label htmlFor="appUrl" className="flex items-center gap-2 text-sm font-medium">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              Running App URL
            </Label>
            <Input
              id="appUrl"
              type="url"
              placeholder="http://localhost:3000"
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              className="h-11 bg-secondary/50 border-input transition-colors focus:bg-secondary"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              URL where your application is running for screen recording
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="skipVoice" className="text-sm font-medium">
                Skip Voice Generation
              </Label>
              <p className="text-xs text-muted-foreground">
                Generate silent video without AI voiceover
              </p>
            </div>
            <Switch
              id="skipVoice"
              checked={skipVoice}
              onCheckedChange={setSkipVoice}
              disabled={isLoading}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button
        type="submit"
        className="h-11 w-full font-medium"
        disabled={!isRepoValid || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Demo Video"
        )}
      </Button>
    </form>
  )
}
