// parsePdfTimetable.ts
//
// Verified against your real export (OGRENCILER.pdf, NEU / FET-generated) by
// extracting actual word coordinates and checking the output against many
// tables across the document. This PDF is NOT the same shape as your Excel
// file — it's not a per-room grid at all:
//
//   YAKIN DOĞU ÜNİVERSİTESİ / NEAR EAST UNIVERSITY   <- repeats per table
//   1AAS                                              <- student GROUP name
//   Pazartesi   Salı   Çarşamba   Perşembe   Cuma      <- day header row
//   08:30   ---   PHY101B   ---   ---   ---            <- time row
//                 FMIREKHTIARY                         <- teacher, same cell
//                 Inovasyon 106                        <- room, same cell
//   09:30   ...
//   Timetable generated with FET 6.22.1 on ...          <- footer, table end
//
// One page holds multiple group-tables stacked back to back (e.g. "1AAS"
// immediately followed by "1ABI"). Each filled cell stacks 2+ lines: course
// code(s) first, then teacher(s), then room. Empty slots render literally as
// the text "---".
//
// IMPORTANT DISCOVERY: a cell's course/teacher/room lines do NOT reliably sit
// within that time row's own vertical band — when a row's other cells are
// "---" (empty), FET lets a neighboring row's tall cell overflow into that
// empty space. So this does NOT bucket text by row position (that was my
// first attempt and it silently misattributed teacher/room lines to the
// wrong time slot on real data). Instead it works per DAY COLUMN: walk each
// column's text top-to-bottom, treat a line matching a course-code pattern
// (e.g. "PHY101B", "EAS103B+GCE410B+THM115") as the start of a new class
// entry, and assign that entry's TIME by finding the nearest time-marker to
// just the course-code line's own y position (which stays reliably close to
// its true row, even when the teacher/room lines below it don't).
//
// Known limitation: very long combined course codes that wrap onto a second
// line (rare — seen a couple of times in ~2,000 test entries) won't match
// the course-code pattern and get folded into the previous entry's
// teacher/room lines instead of starting a new one. If you spot these in
// your data, the fix is loosening COURSE_LINE_RE below or increasing the
// token length caps in COURSE_TOKEN.
//
// This is a per-GROUP schedule, not a per-ROOM schedule like your Excel
// file. There's no single "Room" column — room is the LAST captured line
// inside each entry, taken on a best-effort basis (it's not always present,
// e.g. entries with only a teacher line and no room). I added an optional
// `group` field to TimetableEntry (see ExcelReader.tsx) to carry the group
// name (e.g. "1AAS"), since that's this PDF's real organizing key and has
// no equivalent in the Excel export.
import type { TimetableEntry } from "./ExcelReader"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

type PositionedItem = {
  text: string
  x: number
  y: number
  page: number
}

type Line = {
  y: number
  page: number
  items: PositionedItem[]
}

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
const UNIVERSITY_HEADER = "YAKIN DOĞU ÜNİVERSİTESİ / NEAR EAST UNIVERSITY"
const FOOTER_PREFIX = "Timetable generated"
const TIME_PATTERN = /^\d{1,2}:\d{2}$/

// A course-code line looks like "PHY101B" or "EAS103B+GCE410B+THM115":
// one or more letter+digit tokens joined by "+". Includes Turkish letters.
const COURSE_TOKEN = "[A-Za-zÇĞİÖŞÜçğıöşü]{2,6}\\d{2,4}[A-Za-z]?"
const COURSE_LINE_RE = new RegExp(`^${COURSE_TOKEN}(\\+${COURSE_TOKEN})*$`)

// How close two items' y-coordinates must be to count as the same line.
const LINE_Y_TOLERANCE = 3

async function extractPositionedItems(file: File): Promise<PositionedItem[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const items: PositionedItem[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    for (const raw of textContent.items) {
      const item = raw as { str: string; transform: number[] }
      const text = item.str.trim()
      if (!text) continue

      items.push({
        text,
        x: item.transform[4],
        // pdfjs-dist gives raw PDF y (origin bottom-left, increases upward).
        // Flip it to a top-down "distance from top" value so "descending
        // page order" reads the same direction as the page visually.
        y: -item.transform[5],
        page: pageNum,
      })
    }
  }

  return items
}

function groupIntoLines(items: PositionedItem[]): Line[] {
  const sorted = [...items].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page
    return a.y - b.y
  })

  const lines: Line[] = []

  for (const item of sorted) {
    const currentLine = lines[lines.length - 1]
    if (
      currentLine &&
      currentLine.page === item.page &&
      Math.abs(currentLine.y - item.y) <= LINE_Y_TOLERANCE
    ) {
      currentLine.items.push(item)
    } else {
      lines.push({ y: item.y, page: item.page, items: [item] })
    }
  }

  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x)
  }

  return lines
}

function lineText(line: Line): string {
  return line.items.map((it) => it.text).join(" ")
}

type TableSection = {
  group: string
  dayLine: Line
  bodyLines: Line[] // everything between the day header and the footer/next table
}

function splitIntoTables(lines: Line[]): TableSection[] {
  const tables: TableSection[] = []

  for (let i = 0; i < lines.length; i++) {
    const text = lineText(lines[i])
    const isDayHeader = DAY_NAMES.filter((d) => text.includes(d)).length >= 3
    if (!isDayHeader) continue

    // Group name is the nearest preceding line that isn't the university
    // header, another day header, or a footer line.
    let group = "Unknown group"
    for (let j = i - 1; j >= 0; j--) {
      const t = lineText(lines[j])
      if (t === UNIVERSITY_HEADER || t.startsWith(FOOTER_PREFIX)) continue
      group = t
      break
    }

    const bodyLines: Line[] = []
    for (let j = i + 1; j < lines.length; j++) {
      const t = lineText(lines[j])
      if (t.startsWith(FOOTER_PREFIX)) break
      const nextIsDayHeader = DAY_NAMES.filter((d) => t.includes(d)).length >= 3
      if (nextIsDayHeader) break
      bodyLines.push(lines[j])
    }

    tables.push({ group, dayLine: lines[i], bodyLines })
  }

  return tables
}

function nearestIndex(value: number, candidates: number[]): number {
  let bestIndex = 0
  let bestDistance = Infinity
  candidates.forEach((c, index) => {
    const distance = Math.abs(c - value)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  })
  return bestIndex
}

function parseTable(table: TableSection): TimetableEntry[] {
  const dayAnchors = table.dayLine.items.map((item) => item.x)
  const dayLabels = table.dayLine.items.map((item) => item.text)
  if (dayAnchors.length === 0) return []

  const markers: { y: number; label: string }[] = []
  for (const line of table.bodyLines) {
    if (line.items.length > 0 && TIME_PATTERN.test(line.items[0].text)) {
      markers.push({ y: line.y, label: line.items[0].text })
    }
  }
  if (markers.length === 0) return []
  const markerYs = markers.map((m) => m.y)

  // Bucket every item (skipping the time-label token itself) into its
  // nearest day column, in top-to-bottom / left-to-right order.
  const columnItems: PositionedItem[][] = dayLabels.map(() => [])
  for (const line of table.bodyLines) {
    const isTimeLine = line.items.length > 0 && TIME_PATTERN.test(line.items[0].text)
    line.items.forEach((item, k) => {
      if (isTimeLine && k === 0) return // skip the time label
      const col = nearestIndex(item.x, dayAnchors)
      columnItems[col].push(item)
    })
  }

  const entries: TimetableEntry[] = []

  columnItems.forEach((items, colIndex) => {
    // Merge items on (almost) the same y back into per-column lines.
    const colLines: { y: number; text: string }[] = []
    for (const item of items) {
      if (item.text === "---") continue
      const last = colLines[colLines.length - 1]
      if (last && Math.abs(last.y - item.y) <= LINE_Y_TOLERANCE) {
        last.text += " " + item.text
      } else {
        colLines.push({ y: item.y, text: item.text })
      }
    }

    type Draft = { time: string; course: string; extraLines: string[] }
    let current: Draft | null = null

    const flush = () => {
      if (!current) return
      const room = current.extraLines.length > 0 ? current.extraLines[current.extraLines.length - 1] : ""
      entries.push({
        Room: room,
        Day: dayLabels[colIndex],
        Time: current.time,
        CourseInfo: current.course,
        // @ts-ignore - see the `group` addition to TimetableEntry in ExcelReader.tsx
        group: table.group,
      })
    }

    for (const { y, text } of colLines) {
      if (COURSE_LINE_RE.test(text)) {
        flush()
        const time = markers[nearestIndex(y, markerYs)].label
        current = { time, course: text, extraLines: [] }
      } else if (current) {
        current.extraLines.push(text)
      }
    }
    flush()
  })

  return entries
}

export async function parsePdf(file: File): Promise<TimetableEntry[]> {
  const items = await extractPositionedItems(file)
  const lines = groupIntoLines(items)

  // Debug aid: uncomment to inspect the reconstructed line stream while
  // checking a new export against this logic.
  // console.table(lines.map((l, i) => ({ line: i, page: l.page, y: Math.round(l.y), text: lineText(l) })))

  const tables = splitIntoTables(lines)
  const data = tables.flatMap(parseTable)

  // Same cleanup ExcelReader.tsx applies to the Excel path, so both produce
  // the same shape. Note: PDF "Time" is a single point (e.g. "08:30"), not a
  // range, so timeEnd falls back to "00:00" — there's no range to split.
  const processedData = data.map((entry) => {
    const nameRaw = entry.CourseInfo.trim() || "Unknown"
    const locationRaw = entry.Room || "Unknown Location"

    const dayMatch = entry.Day.match(/\(([^)]+)\)/)
    const day = dayMatch ? dayMatch[1].trim() : entry.Day.trim()

    const [timeStartRaw, timeEndRaw] = entry.Time.split("-").map((t) => t.trim())
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

  return processedData
}
