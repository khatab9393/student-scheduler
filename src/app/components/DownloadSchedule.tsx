"use client"

import React from "react"
import { toPng } from "html-to-image"

interface DownloadScheduleProps {
  targetId: string
  filename?: string
}

export default function DownloadSchedule({
  targetId,
  filename = "schedule.png",
}: DownloadScheduleProps) {
  const handleDownload = async () => {
    const element = document.getElementById(targetId)
    if (!element) {
      alert("Schedule area not found.")
      return
    }

    // Temporarily remove scrollbars
    const originalOverflow = element.style.overflow
    const originalWidth = element.style.width

    element.style.overflow = "hidden"
    element.style.width = element.scrollWidth + "px" // prevent horizontal scroll

    try {
      const dataUrl = await toPng(element, {
        backgroundColor: "#ffffff",
        cacheBust: true,
      })

      const link = document.createElement("a")
      link.href = dataUrl
      link.download = filename
      link.click()
    } catch (error) {
      console.error("Failed to capture image:", error)
      alert("Something went wrong while capturing the schedule.")
    } finally {
      // Restore styles
      element.style.overflow = originalOverflow
      element.style.width = originalWidth
    }
  }

  return (
    <button
      onClick={handleDownload}
      className="text-sm px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
    >
      Download Schedule
    </button>
  )
}