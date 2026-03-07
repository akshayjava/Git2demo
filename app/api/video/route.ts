import { NextResponse } from "next/server"
import { readFile, stat } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function GET() {
  // Check for video in the video-generator output directory
  const videoPath = path.join(process.cwd(), "video-generator", "output", "demo.mp4")
  
  // Also check a local output directory
  const localVideoPath = path.join(process.cwd(), "output", "demo.mp4")
  
  let finalPath = ""
  
  if (existsSync(videoPath)) {
    finalPath = videoPath
  } else if (existsSync(localVideoPath)) {
    finalPath = localVideoPath
  } else {
    // Return a placeholder message if no video exists yet
    return NextResponse.json(
      { error: "No video found. Generate a demo first." },
      { status: 404 }
    )
  }

  try {
    const fileBuffer = await readFile(finalPath)
    const fileStat = await stat(finalPath)
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": 'inline; filename="demo.mp4"',
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error serving video:", error)
    return NextResponse.json(
      { error: "Failed to serve video" },
      { status: 500 }
    )
  }
}
