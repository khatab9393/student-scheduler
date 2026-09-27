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

      // iOS Safari (and most mobile in-app browsers) ignore the `download`
      // attribute on anchor tags entirely for data: URLs — tapping the link
      // just tries to navigate instead of saving anything. The reliable
      // cross-device fix is to detect that case and open the image in a new
      // tab instead, so the user can long-press it and choose "Save Image."
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      const isMobile = isIOS || /Android/i.test(navigator.userAgent)

      if (isMobile) {
        const newTab = window.open()
        if (newTab) {
          newTab.document.write(
            `<html><head><title>${filename}</title></head><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">` +
            `<img src="${dataUrl}" style="max-width:100%;height:auto;" alt="${filename}" />` +
            `<p style="position:fixed;bottom:12px;left:0;right:0;text-align:center;color:#fff;font-family:sans-serif;font-size:14px;">Press and hold the image, then choose "Save Image"</p>` +
            `</body></html>`
          )
        } else {
          alert("Please allow pop-ups to save the schedule image.")
        }
      } else {
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = filename
        link.click()
      }
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