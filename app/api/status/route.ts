import { NextResponse } from "next/server"
import type { JobState } from "@/lib/types"

declare global {
  // eslint-disable-next-line no-var
  var currentJob: JobState | undefined
}

export async function GET() {
  const job: JobState = global.currentJob || {
    status: "idle",
    message: "",
    error: null,
    script: null,
  }

  return NextResponse.json(job)
}
