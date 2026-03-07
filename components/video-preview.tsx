"use client"

import { Download, ExternalLink, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DemoScript } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface VideoPreviewProps {
  videoUrl: string
  script?: DemoScript | null
}

export function VideoPreview({ videoUrl, script }: VideoPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Generated Demo</h3>
        <div className="flex items-center gap-2">
          {script && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <FileJson className="h-3.5 w-3.5" />
                  View Script
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
                <DialogHeader>
                  <DialogTitle>{script.title}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-secondary p-4">
                  <pre className="text-xs text-muted-foreground">
                    {JSON.stringify(script, null, 2)}
                  </pre>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
            <a href={videoUrl} download="demo.mp4">
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-black">
        <video
          src={videoUrl}
          controls
          className="aspect-video w-full"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {script && (
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <h4 className="mb-2 text-sm font-medium">{script.productName}</h4>
          <p className="text-xs text-muted-foreground">
            {script.scenes.length} scenes generated
          </p>
        </div>
      )}
    </div>
  )
}
