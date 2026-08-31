"use client"

import React, { useRef, useState } from "react"
import ExcelJS from "exceljs"
import { useTimetableStore } from "../store/useTimetableStore"

export type TimetableEntry = {
  Room: string
  Day: string
  Time: string
  CourseInfo: string
  name?: string
  location?: string
  day?: string
  timeStart?: string
  timeEnd?: string
}

type ExcelUploadProps = {
  onUpload?: (data: TimetableEntry[]) => void
}

const ExcelReader: React.FC<ExcelUploadProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hasUploaded, setHasUploaded] = useState(false)
  const dragCounter = useRef(0)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
    // reset so selecting the same file again still fires onChange
    e.target.value = ""
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items?.length) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const isExcel =
      /\.(xlsx|xls)$/i.test(file.name) ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel"

    if (!isExcel) {
      setMessage("Please drop a valid .xlsx or .xls file.")
      return
    }

    await processFile(file)
  }

  const processFile = async (file: File) => {
    try {
      const workbook = new ExcelJS.Workbook()
      const buffer = await file.arrayBuffer()
      await workbook.xlsx.load(buffer)

      const worksheet = workbook.worksheets[0]

      const lastColumn = worksheet.columnCount
      const lastRow = worksheet.rowCount

      const data: TimetableEntry[] = []

      for (let col = 5; col <= lastColumn; col++) { // skip columns B, C, D
        const dayCell = worksheet.getRow(2).getCell(col)
        const timeCell = worksheet.getRow(3).getCell(col)
        const dayRaw = String(dayCell.value || "").trim()
        const timeRaw = String(timeCell.value || "").trim()

        for (let row = 4; row <= lastRow; row++) {
          const roomCell = worksheet.getRow(row).getCell(1)
          const courseCell = worksheet.getRow(row).getCell(col)

          const room = String(roomCell.value || "").trim()
          const courseId = String(courseCell.value || "").trim()

          if (!courseId) continue // skip empty

          data.push({
            Room: room,
            Day: dayRaw,
            Time: timeRaw,
            CourseInfo: courseId,
          })
        }
      }

      // Now clean and transform data:
      const processedData = data.map((entry) => {
        // Name is full CourseInfo string without splitting
        const nameRaw = entry.CourseInfo.trim() || "Unknown"

        // Location is set exactly as Room
        const locationRaw = entry.Room || "Unknown Location"

        // Extract day inside parentheses or fallback
        const dayMatch = entry.Day.match(/\(([^)]+)\)/)
        const day = dayMatch ? dayMatch[1].trim() : entry.Day.trim()

        // Split time into start and end
        const [timeStartRaw, timeEndRaw] = entry.Time.split("-").map(t => t.trim())
        const timeStart = timeStartRaw || "00:00"
        const timeEnd = timeEndRaw || "00:00"

        return {
          ...entry,
          name: nameRaw,
          location: locationRaw,
          day,
          timeStart,
          timeEnd,
        }
      })

      setTimetableData(processedData)
      useTimetableStore.getState().setTimetable(processedData)
      setMessage("upload successful.")
      setHasUploaded(true)

      if (onUpload) {
        onUpload(processedData)
      }
    } catch (error) {
      console.error("Excel parse error:", error)
      setMessage("Failed to read Excel file.")
    }
  }

  const handleExport = () => {
    const json = JSON.stringify(timetableData, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "timetable.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFile}
        className="hidden"
      />

      <div className="flex flex-col gap-3 items-start w-full">
        {/* Drag & drop zone — hidden once a file has been uploaded */}
        {!hasUploaded && (
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            className="cursor-pointer flex flex-col items-center justify-center text-center transition-colors w-full"
            style={{
              maxWidth: "520px",
              height: "220px",
              borderRadius: "16px",
              border: `2px dashed ${isDragging ? "#2563eb" : "#93c5fd"}`,
              backgroundColor: isDragging ? "#eff6ff" : "#f8fafc",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginBottom: "10px" }}
            >
              <path
                d="M12 16V4M12 4L7 9M12 4l5 5"
                stroke={isDragging ? "#2563eb" : "#3b82f6"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                stroke={isDragging ? "#2563eb" : "#3b82f6"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-base font-medium" style={{ color: isDragging ? "#2563eb" : "#374151" }}>
              {isDragging ? "Drop it here" : "Drag & drop your Excel file"}
            </p>
            <p className="text-sm text-gray-400 mt-1">.xlsx or .xls</p>
          </div>
        )}

        {hasUploaded && (
          <button
            onClick={() => setHasUploaded(false)}
            className="text-sm text-blue-600 hover:underline"
          >
            Upload a different file
          </button>
        )}
      </div>

      {message && <p className="text-sm text-center">{message}</p>}
    </div>
  )
}

export default ExcelReader