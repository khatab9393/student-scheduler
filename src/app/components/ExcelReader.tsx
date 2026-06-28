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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
      <button
        onClick={() => inputRef.current?.click()}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
      >
        Upload Excel File
      </button>
      {message && <p className="text-sm text-center">{message}</p>}
    
      
    </div>
  )
}

export default ExcelReader