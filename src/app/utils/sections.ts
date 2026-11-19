import type { ClassItem } from "../components/ClassList"
import type { TimetableEntry } from "../components/ExcelReader"
import { convertToClassItems } from "./convertEntries"

/**
 * Extract a group label ONLY from patterns like:
 *   "AII108 A ABDELBARI" → "A"  (single letter after the course code)
 *   "AII108 (B)"         → "B"
 *   "AII108 Group C"     → "C"
 */
export function extractGroup(name: string): string {
  const m =
    name.match(/\bgroup\s+([A-Za-z0-9])\b/i) ||
    name.match(/\(([A-Za-z0-9])\)/)
  if (m) return m[1].toUpperCase()

  const parts = name.trim().split(/\s+/)
  if (parts.length >= 3) {
    const second = parts[1]
    if (/^[A-Z]$/.test(second)) return second
  }
  return ""
}

/** "AII 108 A ABDELBARI" / "AII108B" → "AII108" (the course the groups belong to) */
export function courseFamily(name: string): string {
  const m = name.trim().match(/^([A-Za-zÇĞİÖŞÜçğıöşü]{2,6})\s*(\d{2,4})/)
  return m ? `${m[1]}${m[2]}`.toUpperCase() : name.trim().split(/\s+/)[0].toUpperCase()
}

/** One group of one course, with ALL of its sessions across the week. */
export interface Section {
  id: number
  family: string
  name: string
  group: string // PDF student group (e.g. "1AAS") if the file has one
  label: string // what to show for the group: PDF group, or the letter in the name
  rows: ClassItem[]
}

export interface RawPick {
  id?: number | string
  name?: string
  group?: string
}

const nameKey = (n: string) => n.toLowerCase().replace(/\s+/g, " ").trim()

/** Groups every row of the uploaded file into sections (same name + same student group). */
export function buildSections(data: TimetableEntry[]): Section[] {
  const map = new Map<string, Section>()
  for (const row of convertToClassItems(data)) {
    const group = row.group ?? ""
    const key = `${nameKey(row.name)}||${group}`
    let sec = map.get(key)
    if (!sec) {
      sec = {
        id: map.size + 1,
        family: courseFamily(row.name),
        name: row.name,
        group,
        label: group || extractGroup(row.name),
        rows: [],
      }
      map.set(key, sec)
    }
    sec.rows.push(row)
  }
  return [...map.values()]
}

/** Sections for the courses mentioned in the recent conversation (or the first few if none). */
export function relevantSections(sections: Section[], contextText: string): Section[] {
  const codes = (contextText.match(/[A-Z]{2,4}\s*\d{3}/gi) || []).map((c) =>
    c.toLowerCase().replace(/\s/g, "")
  )
  if (codes.length === 0) return sections.slice(0, 60)
  const hit = sections.filter((s) => {
    const n = s.name.toLowerCase().replace(/\s/g, "")
    return codes.some((c) => n.includes(c))
  })
  return hit
}

/** Text block for the AI prompt: every course, its groups, and each group's weekly sessions. */
export function describeForPrompt(sections: Section[]): string {
  const byFamily = new Map<string, Section[]>()
  for (const s of sections) byFamily.set(s.family, [...(byFamily.get(s.family) ?? []), s])

  const blocks: string[] = []
  for (const [family, list] of byFamily) {
    const header =
      list.length > 1
        ? `${family} — ${list.length} groups (the user must choose exactly ONE)`
        : `${family} — 1 group`
    const lines = list.map((s) => {
      const sessions = s.rows
        .map((r) => {
          const room = r.location && r.location !== "Unknown Location" ? ` (${r.location})` : ""
          return `${r.day} ${r.timeStart}–${r.timeEnd}${room}`
        })
        .join(", ")
      return `  [${s.id}] ${s.name} | Group: ${s.label || "—"} | ${sessions}`
    })
    blocks.push([header, ...lines].join("\n"))
  }
  return blocks.join("\n\n")
}

/** Turns the AI's picks ({id} or {name}) into sections. Ambiguous names return every candidate. */
export function resolvePicks(
  items: RawPick[],
  sections: Section[]
): { picked: Section[]; unresolved: string[] } {
  const picked: Section[] = []
  const unresolved: string[] = []
  const seen = new Set<number>()
  const add = (s: Section) => {
    if (!seen.has(s.id)) {
      seen.add(s.id)
      picked.push(s)
    }
  }

  for (const it of items) {
    if (!it || typeof it !== "object") continue
    let hit: Section | undefined

    if (it.id !== undefined && it.id !== null && it.id !== "") {
      const id = Number(it.id)
      hit = sections.find((s) => s.id === id)
    }

    if (!hit && typeof it.name === "string") {
      const k = nameKey(it.name)
      const matches = sections.filter((s) => nameKey(s.name) === k)
      if (matches.length === 1) {
        hit = matches[0]
      } else if (matches.length > 1) {
        const g = String(it.group ?? "").trim().toLowerCase()
        const byGroup = g
          ? matches.filter((s) => s.group.toLowerCase() === g || s.label.toLowerCase() === g)
          : []
        if (byGroup.length === 1) hit = byGroup[0]
        else {
          matches.forEach(add) // ambiguous → will be treated as "needs a choice"
          continue
        }
      }
    }

    if (hit) add(hit)
    else unresolved.push(String(it.name ?? it.id ?? "?"))
  }
  return { picked, unresolved }
}

/** One group per course is fine; two groups of the same course means the user still has to choose. */
export function splitByFamily(picked: Section[]): { ok: Section[]; conflicts: Section[][] } {
  const byFamily = new Map<string, Section[]>()
  for (const s of picked) byFamily.set(s.family, [...(byFamily.get(s.family) ?? []), s])
  const ok: Section[] = []
  const conflicts: Section[][] = []
  for (const list of byFamily.values()) {
    if (list.length === 1) ok.push(list[0])
    else conflicts.push(list)
  }
  return { ok, conflicts }
}
