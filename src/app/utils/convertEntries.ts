import type { ClassItem } from "../components/ClassList"
import type { TimetableEntry } from "../components/ExcelReader"
import { normalizeDay } from "./days"

export function normalizeTime(time: string): string {
  if (!time) return ""
  const parts = time.trim().split(":")
  if (parts.length < 2) return time.trim()
  return `${parts[0].padStart(2, "0")}:${parts[1].slice(0, 2).padStart(2, "0")}`
}

function addOneHour(start: string): string {
  const [h, m] = start.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return start
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

// PDF timetables only give a start time, so the parser leaves the end as "00:00".
// Classes are 1 hour long, so use start + 1h whenever the end is missing or not after the start.
export function fixEndTime(start: string, end: string): string {
  if (!end || end === "00:00" || end <= start) return addOneHour(start)
  return end
}

// Turns the raw rows from the uploaded Excel/PDF into ClassItems the schedule table understands.
export function convertToClassItems(data: TimetableEntry[]): ClassItem[] {
  return data.map((entry) => {
    const [rangeStart = "", rangeEnd = ""] = (entry.Time || "").split("-")
    const timeStart = normalizeTime(entry.timeStart || rangeStart)
    const timeEnd = fixEndTime(timeStart, normalizeTime(entry.timeEnd || rangeEnd))
    return {
      name: entry.name || "Unknown",
      day: normalizeDay(entry.day || entry.Day),
      timeStart,
      timeEnd,
      location: entry.location || "Unknown Location",
      group: entry.group || undefined,
    }
  })
}
