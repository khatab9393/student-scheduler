"use client"

import React, { useState, useRef, useEffect } from "react"
import type { ClassItem } from "./ClassList"
import type { TimetableEntry } from "./ExcelReader"

function AIIcon({ size = 20 }: { size?: number }) {
  const [burst, setBurst] = useState(false)

  const trigger = () => {
    setBurst(true)
    window.setTimeout(() => setBurst(false), 600)
  }

  return (
    <span
      onMouseEnter={trigger}
      onTouchStart={trigger}
      onClick={trigger}
      style={{ display: "inline-flex", lineHeight: 0, cursor: "pointer" }}
    >
      <style>{`
        @keyframes aiStarFloat {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-2px) rotate(8deg) scale(1.05); }
        }
        @keyframes aiStarBurstBig {
          0% { transform: scale(1) rotate(0deg); }
          35% { transform: scale(1.35) rotate(90deg); }
          60% { transform: scale(0.9) rotate(135deg); }
          100% { transform: scale(1) rotate(180deg); }
        }
        @keyframes aiSparkleTwinkle {
          0%, 100% { opacity: 0.35; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes aiSparklePop {
          0% { opacity: 0; transform: scale(0) translate(0, 0); }
          40% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.2) translate(var(--tx), var(--ty)); }
        }
        .ai-star-main {
          transform-origin: 50% 50%;
          animation: aiStarFloat 2.6s ease-in-out infinite;
        }
        .ai-star-main.burst {
          animation: aiStarBurstBig 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ai-star-mini {
          transform-origin: 50% 50%;
          animation: aiSparkleTwinkle 1.8s ease-in-out infinite;
        }
        .ai-star-mini.burst {
          animation: aiSparklePop 0.6s ease-out;
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className={`ai-star-main${burst ? " burst" : ""}`}
          d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z"
          fill="currentColor"
        />
        <path
          className={`ai-star-mini${burst ? " burst" : ""}`}
          style={{ ["--tx" as any]: "3px", ["--ty" as any]: "-4px", animationDelay: "0s" }}
          d="M18.5 3.7L19.2 5.3L20.8 6L19.2 6.7L18.5 8.3L17.8 6.7L16.2 6L17.8 5.3L18.5 3.7Z"
          fill="currentColor"
        />
        <path
          className={`ai-star-mini${burst ? " burst" : ""}`}
          style={{ ["--tx" as any]: "-4px", ["--ty" as any]: "3px", animationDelay: "0.3s" }}
          d="M5.2 15.5L5.7 16.7L6.9 17.2L5.7 17.7L5.2 18.9L4.7 17.7L3.5 17.2L4.7 16.7L5.2 15.5Z"
          fill="currentColor"
        />
      </svg>
    </span>
  )
}

interface Message {
  role: "user" | "assistant"
  content: string
}

interface PendingDelete {
  cls: ClassItem
}

export interface AIAssistantProps {
  onAddClasses: (classes: ClassItem[]) => void
  onRemoveClass: (cls: ClassItem) => void
  onRemoveCourse: (courseName: string) => void
  uploadedData: TimetableEntry[]
  currentClasses: ClassItem[]
}

// ─── helpers ────────────────────────────────────────────────────────────────

function normalizeDay(day: string): string {
  if (!day) return ""
  const d = day.trim().toLowerCase()
  return d.charAt(0).toUpperCase() + d.slice(1)
}

function normalizeTime(time: string): string {
  if (!time) return ""
  const parts = time.trim().split(":")
  if (parts.length < 2) return time
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`
}

function timeToFloat(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h + m / 60
}

function timesOverlap(a: ClassItem, b: ClassItem): boolean {
  if (a.day !== b.day) return false
  return timeToFloat(a.timeStart) < timeToFloat(b.timeEnd) &&
    timeToFloat(a.timeEnd) > timeToFloat(b.timeStart)
}

function getAllClashes(classes: ClassItem[]): Array<[ClassItem, ClassItem]> {
  const result: Array<[ClassItem, ClassItem]> = []
  for (let i = 0; i < classes.length; i++)
    for (let j = i + 1; j < classes.length; j++)
      if (timesOverlap(classes[i], classes[j]))
        result.push([classes[i], classes[j]])
  return result
}

/**
 * Extract a group label ONLY from patterns like:
 *   "AII108 A INSTRUCTOR"  → won't match (instructor is multiple chars)
 *   "AII108 A"             → group "A"  (single letter at end)
 *   "AII108 (B)"           → group "B"
 *   "AII108 Group C"       → group "C"
 * We deliberately do NOT match trailing instructor names (multi-char uppercase words)
 */
function extractGroup(name: string): string {
  // Group keyword pattern: "Group X" or "(X)"
  const m =
    name.match(/\bgroup\s+([A-Za-z0-9])\b/i) ||
    name.match(/\(([A-Za-z0-9])\)/)
  if (m) return m[1].toUpperCase()

  // Single capital letter separated by space just before instructor name
  // Pattern: CODE SINGLELETTER INSTRUCTOR  e.g. "AII108 A ABDELBARI"
  // The group letter comes right after the course code digits
  const parts = name.trim().split(/\s+/)
  // parts[0] = course code like "AII108", parts[1] = possible group letter, rest = instructor
  if (parts.length >= 3) {
    const second = parts[1]
    if (/^[A-Z]$/.test(second)) return second
  }

  return ""
}

// ─── system prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(
  uploadedData: TimetableEntry[],
  currentClasses: ClassItem[],
  contextText: string
): string {
  if (!uploadedData || uploadedData.length === 0) {
    return `You are a friendly timetable assistant for Near East University. Talk like ChatGPT — warm and natural.
No Excel file uploaded yet. Ask the user to upload one first, then type course codes like: AII 108, MTH 201.`
  }

  // Look for course codes across the recent conversation (not just this message) —
  // so a reply like "Group A" still resolves to the course asked about earlier.
  const codes = contextText.match(/[A-Z]{2,4}\s*\d{3}/gi) || []
  const filtered = codes.length > 0
    ? uploadedData.filter(e =>
        codes.some(code =>
          (e.name || e.CourseInfo || "").toLowerCase().replace(/\s/g, "").includes(
            code.toLowerCase().replace(/\s/g, "")
          )
        )
      )
    : uploadedData.slice(0, 120)

  // Build data string — include full name so AI returns exact names
  const dataStr = filtered.map(e => {
    const name = (e.name || e.CourseInfo || "").trim()
    const day = normalizeDay(e.day || e.Day || "")
    const timeStart = normalizeTime(e.timeStart || (e.Time ? e.Time.split("-")[0] : "") || "")
    const timeEnd = normalizeTime(e.timeEnd || (e.Time ? e.Time.split("-")[1] : "") || "")
    const location = (e.location || e.Room || "").trim()
    const group = extractGroup(name)
    return `${name} | Group:${group || "—"} | ${day} | ${timeStart}–${timeEnd} | ${location}`
  }).join("\n")

  const scheduleSummary = currentClasses.length === 0
    ? "Schedule is empty."
    : currentClasses.map(c => {
        const g = extractGroup(c.name)
        return `${c.name}${g ? ` [Grp ${g}]` : ""} | ${c.day} | ${c.timeStart}–${c.timeEnd}`
      }).join("\n")

  const clashes = getAllClashes(currentClasses)
  const clashSummary = clashes.length === 0
    ? "No clashes."
    : clashes.map(([a, b]) => {
        const ga = extractGroup(a.name)
        const gb = extractGroup(b.name)
        return `"${a.name}"${ga ? ` (Grp ${ga})` : ""} ↔ "${b.name}"${gb ? ` (Grp ${gb})` : ""} on ${a.day} ${a.timeStart}–${a.timeEnd}`
      }).join("\n")

  return `You are a smart, friendly timetable assistant for Near East University (AII dept).
Talk naturally like ChatGPT — warm, concise, helpful. Never be robotic.

━━━ CURRENT SCHEDULE ━━━
${scheduleSummary}

━━━ CLASH STATUS ━━━
${clashSummary}

━━━ AVAILABLE CLASSES (name | group | day | time | location) ━━━
${dataStr}

━━━ RULES ━━━

IMPORTANT: Course names in the data include instructor names like "AII108 A ABDELBARI".
The group letter is the SINGLE CAPITAL LETTER between the course code and instructor name.
Example: "AII108 A ABDELBARI" → course AII108, Group A, instructor ABDELBARI.
Always use the FULL name exactly as shown in the data (including instructor).

1. ADD COURSES — when user gives course codes:
   - Identify all groups available for each course from the data
   - If a course has MORE THAN ONE group:
       - Do NOT output a json block yet
       - Reply in plain text listing the available groups (e.g. "AII108 has Group A (ABDELBARI) and Group B (SMITH) — which one do you want?")
       - Wait for the user to answer before adding anything
   - If a course has ONLY ONE group, or the user has just told you which group they want (in this message or the previous one):
       - Reply briefly confirming what you're adding
       - Many courses meet MORE THAN ONCE a week (e.g. twice on different days, or a lecture + a lab). Look through EVERY row in the data for that exact course code AND that exact group letter — there may be 2 or 3 separate day/time rows for the same group. You MUST include ALL of them.
       - Then output EXACTLY ONE \`\`\`json code block (hidden from display) containing a SINGLE array with EVERY session row that belongs to that one specific group — never just the first one you find, and never omit a session because it looks similar to one you already added
       - Do NOT include sessions belonging to a different group letter, even if they're the same course code — only the exact group the user asked for
       - Never ask the user to confirm each individual session one at a time — add the whole group's weekly sessions together in one reply
   - Max 3 sessions per group (courses do not meet more than 3 times a week — if you see more than 3 rows for one group, double-check you're not accidentally mixing in another group's rows)
   - JSON format: [{ "name": "exact full name from data", "day": "Monday", "timeStart": "08:30", "timeEnd": "09:30", "location": "..." }]
   - Example: if the data shows "AII108 A ABDELBARI | Group:A | Monday | 08:30–09:30 | LAB1" AND "AII108 A ABDELBARI | Group:A | Wednesday | 10:30–11:30 | LAB1", and the user asked for AII108 group A, your json array must contain BOTH of those rows as two separate objects — not just one.
   - Use EXACT names from the data above — do not shorten or modify them
   - The JSON array must be valid JSON: double-quoted keys/strings, no trailing commas, no comments
   - NEVER tell the user something was added, or say "done"/"added"/"I've added", unless your reply also contains the json block with those exact sessions in it. If you have not included the json block, do not claim the schedule was updated.

2. REMOVE A COURSE — if user says "remove X", "delete X", "I don't want X":
   Output a remove block (no questions asked):
   \`\`\`remove
   { "courseName": "exact full name as in current schedule" }
   \`\`\`
   Then confirm casually.

3. REMOVE A SESSION — specific day/time removal:
   \`\`\`remove-session
   { "name": "...", "day": "Monday", "timeStart": "08:30" }
   \`\`\`

4. CLASH INFO — report clashes clearly with group names when relevant.

5. GENERAL — answer naturally.

Days must be full English names: Monday Tuesday Wednesday Thursday Friday.
Never invent classes not in the data.`
}

// ─── typewriter ──────────────────────────────────────────────────────────────

function useTypewriter(text: string, active: boolean, speed = 14) {
  const [displayed, setDisplayed] = useState("")
  const idx = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!active) { setDisplayed(text); return }
    setDisplayed("")
    idx.current = 0
    timerRef.current = setInterval(() => {
      idx.current++
      setDisplayed(text.slice(0, idx.current))
      if (idx.current >= text.length && timerRef.current) {
        clearInterval(timerRef.current)
      }
    }, speed)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [text, active, speed])

  return active ? displayed : text
}

function MessageBubble({ msg, animate }: { msg: Message; animate: boolean }) {
  const text = useTypewriter(msg.content, animate && msg.role === "assistant")
  return (
    <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
      <div style={{
        maxWidth: "88%", padding: "9px 13px", fontSize: "13px", lineHeight: "1.6",
        borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        backgroundColor: msg.role === "user" ? "#7f1d1d" : "#ffffff",
        color: msg.role === "user" ? "white" : "#111827",
        border: msg.role === "assistant" ? "1px solid #e5e7eb" : "none",
        whiteSpace: "pre-wrap",
      }}>
        {text}
      </div>
    </div>
  )
}

// ─── main ────────────────────────────────────────────────────────────────────

export default function AIAssistant({
  onAddClasses,
  onRemoveClass,
  onRemoveCourse,
  uploadedData,
  currentClasses,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hi 👋 Upload your Excel file, then type your course codes and I'll build your timetable!\n\nI understand groups — just say:\n\"AII 108, MTH 201\"\nand I'll show you all available groups.",
  }])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastMsgIndex, setLastMsgIndex] = useState(-1)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const pushAssistant = (content: string) => {
    setMessages(prev => {
      const next = [...prev, { role: "assistant" as const, content }]
      setLastMsgIndex(next.length - 1)
      return next
    })
  }

  // Strip ALL code blocks from display text
  const cleanForDisplay = (text: string): string =>
    text
      .replace(/```json[\s\S]*?```/g, "")
      .replace(/```remove-session[\s\S]*?```/g, "")
      .replace(/```remove[\s\S]*?```/g, "")
      .replace(/```[\s\S]*?```/g, "")   // catch any other code blocks
      .replace(/\*\*(.*?)\*\*/g, "$1")   // strip markdown bold **text**
      .replace(/\*(.*?)\*/g, "$1")       // strip markdown italic *text*
      .replace(/\n{3,}/g, "\n\n")        // collapse extra blank lines
      .trim()

  // Best-effort cleanup for near-valid JSON (trailing commas, smart quotes)
  const sanitizeJsonish = (raw: string): string =>
    raw
      .replace(/,\s*([\]}])/g, "$1")       // trailing commas before ] or }
      .replace(/[“”]/g, '"')                // smart double quotes
      .replace(/[‘’]/g, "'")                // smart single quotes

  const parseClasses = (text: string): ClassItem[] => {
    // Collect EVERY ```json block, not just the first — models sometimes
    // emit one block per group when a course has multiple groups.
    const blocks = [...text.matchAll(/```json\s*([\s\S]*?)```/g)]
    if (blocks.length === 0) return []

    const all: ClassItem[] = []
    for (const m of blocks) {
      let arr: any
      try {
        arr = JSON.parse(m[1])
      } catch {
        try {
          arr = JSON.parse(sanitizeJsonish(m[1]))
        } catch {
          continue // skip this malformed block, keep processing the rest
        }
      }
      if (!Array.isArray(arr)) continue
      const parsed = arr.map((item: any) => ({
        name: String(item.name || "").trim(),
        day: normalizeDay(String(item.day || "")),
        timeStart: normalizeTime(String(item.timeStart || "")),
        timeEnd: normalizeTime(String(item.timeEnd || "")),
        location: String(item.location || "TBA").trim(),
      })).filter(c => c.name && c.day && c.timeStart && c.timeEnd)
      all.push(...parsed)
    }

    // De-dupe in case the same session appears in more than one block
    const seen = new Set<string>()
    return all.filter(c => {
      const key = `${c.name}|${c.day}|${c.timeStart}|${c.timeEnd}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const parseRemoveCourse = (text: string): string | null => {
    const m = text.match(/```remove\s*([\s\S]*?)```/)
    if (!m) return null
    try { return JSON.parse(m[1]).courseName || null } catch { return null }
  }

  const parseRemoveSession = (text: string): Partial<ClassItem> | null => {
    const m = text.match(/```remove-session\s*([\s\S]*?)```/)
    if (!m) return null
    try { return JSON.parse(m[1]) } catch { return null }
  }

  const checkClashesAfterAdd = (added: ClassItem[], allAfter: ClassItem[]) => {
    const clashes = getAllClashes(allAfter)
    if (!clashes.length) return
    const newNames = new Set(added.map(c => c.name))
    const relevant = clashes.filter(([a, b]) => newNames.has(a.name) || newNames.has(b.name))
    if (!relevant.length) return

    const [a, b] = relevant[0]
    const toSuggest = newNames.has(a.name) ? a : b
    const other = toSuggest === a ? b : a
    const ga = extractGroup(toSuggest.name)
    const gb = extractGroup(other.name)

    const msg = `⚠️ Clash detected!\n\n"${toSuggest.name}"${ga ? ` (Group ${ga})` : ""} on ${toSuggest.day} ${toSuggest.timeStart}–${toSuggest.timeEnd} overlaps with "${other.name}"${gb ? ` (Group ${gb})` : ""} on ${other.day} ${other.timeStart}–${other.timeEnd}.\n\nWould you like me to remove "${toSuggest.name}" to fix this?`

    setPendingDelete({ cls: toSuggest })
    setTimeout(() => pushAssistant(msg), 400)
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const lower = trimmed.toLowerCase()

    // Handle yes/no for clash resolution
    if (pendingDelete) {
      const isYes = ["yes", "yes please", "do it", "sure", "ok", "okay", "remove it", "delete it", "remove", "yep", "yeah"].some(w => lower === w || lower.startsWith(w + " "))
      const isNo = ["no", "nope", "keep it", "cancel", "nevermind", "never mind", "nah"].some(w => lower === w || lower.startsWith(w + " "))

      if (isYes) {
        setMessages(prev => [...prev, { role: "user", content: trimmed }])
        setInput("")
        const removed = pendingDelete.cls
        onRemoveClass(removed)
        setPendingDelete(null)
        setTimeout(() => pushAssistant(`✅ Done! "${removed.name}" has been removed. Your schedule is clash-free now 🎉`), 200)
        return
      }
      if (isNo) {
        setMessages(prev => [...prev, { role: "user", content: trimmed }])
        setInput("")
        setPendingDelete(null)
        setTimeout(() => pushAssistant("Got it! The class stays. Let me know if you need anything else."), 200)
        return
      }
    }

    const newMessages = [...messages, { role: "user" as const, content: trimmed }]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    // Include the last few turns so a follow-up like "Group A" still
    // resolves to whichever course was being discussed.
    const recentContext = newMessages.slice(-6).map(m => m.content).join("\n")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1200,
          system: buildSystemPrompt(uploadedData, currentClasses, recentContext),
          messages: newMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      const fullText = data.content?.map((b: any) => b.text || "").join("") || "Sorry, something went wrong."

      // Parse actions BEFORE cleaning text
      const classes = parseClasses(fullText)
      const removeCourse = parseRemoveCourse(fullText)
      const removeSession = parseRemoveSession(fullText)

      // Clean display text — strips ALL code blocks
      const displayText = cleanForDisplay(fullText)

      setIsLoading(false)
      if (displayText) pushAssistant(displayText)

      // Execute remove course
      if (removeCourse) {
        const match = currentClasses.find(c =>
          c.name.toLowerCase() === removeCourse.toLowerCase()
        )
        if (match) onRemoveCourse(match.name)
      }

      // Execute remove session
      if (removeSession?.name && removeSession?.day && removeSession?.timeStart) {
        const match = currentClasses.find(c =>
          c.name === removeSession.name &&
          c.day === normalizeDay(removeSession.day!) &&
          c.timeStart === normalizeTime(removeSession.timeStart!)
        )
        if (match) onRemoveClass(match)
      }

      // Add classes
      if (classes.length > 0) {
        const deduped = classes.filter(cls =>
          !currentClasses.some(e =>
            e.name === cls.name && e.day === cls.day && e.timeStart === cls.timeStart
          )
        )
        if (deduped.length > 0) {
          onAddClasses(deduped)
          checkClashesAfterAdd(deduped, [...currentClasses, ...deduped])
        }
      }
    } catch {
      setIsLoading(false)
      pushAssistant("Something went wrong. Please try again.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const hasData = uploadedData && uploadedData.length > 0
  const clashCount = getAllClashes(currentClasses).length

  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      {/* Anchor button (inline on desktop; floats fixed on mobile so it's always reachable) */}
      <button
        onClick={() => setIsOpen(o => !o)}
        title="AI Timetable Assistant"
        className="ai-assistant-anchor"
        style={{
          position: "relative", zIndex: 1000, flexShrink: 0,
          width: "44px", height: "44px", borderRadius: "50%",
          backgroundColor: "#7f1d1d", color: "white", border: "none",
          cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", transition: "background-color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#991b1b")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#7f1d1d")}
      >
        {isOpen ? "✕" : <AIIcon size={20} />}
        {!isOpen && clashCount > 0 && (
          <div style={{
            position: "absolute", top: "-4px", right: "-4px",
            backgroundColor: "#ef4444", color: "white", borderRadius: "50%",
            width: "18px", height: "18px", fontSize: "10px", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid white",
          }}>
            {clashCount}
          </div>
        )}
      </button>

      <style>{`
        @media (max-width: 640px) {
          .ai-assistant-anchor {
            position: fixed !important;
            bottom: 18px !important;
            right: 18px !important;
            z-index: 1000 !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.35) !important;
          }
        }
      `}</style>

      {isOpen && (
        <div
          className="ai-assistant-panel"
          style={{
            position: "absolute", top: 0, right: "calc(100% + 10px)", zIndex: 999,
            width: "370px", maxWidth: "min(370px, calc(100vw - 32px))", maxHeight: "560px", borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)", backgroundColor: "#fff",
            display: "flex", flexDirection: "column", overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          <style>{`
            @media (max-width: 640px) {
              .ai-assistant-panel {
                position: fixed !important;
                top: auto !important;
                bottom: 82px !important;
                left: 12px !important;
                right: 12px !important;
                width: auto !important;
                max-width: none !important;
                max-height: 65vh !important;
              }
            }
          `}</style>
          {/* Header */}
          <div style={{ backgroundColor: "#7f1d1d", color: "white", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "flex" }}><AIIcon size={20} /></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>AI Timetable Assistant</div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>Near East University · AII Department</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              <div style={{
                fontSize: "10px", padding: "3px 8px", borderRadius: "20px",
                backgroundColor: hasData ? "rgba(134,239,172,0.25)" : "rgba(255,255,255,0.15)",
                color: hasData ? "#86efac" : "rgba(255,255,255,0.6)",
              }}>
                {hasData ? `✓ ${uploadedData.length} classes` : "No file yet"}
              </div>
              {clashCount > 0 && (
                <div style={{
                  fontSize: "10px", padding: "3px 8px", borderRadius: "20px",
                  backgroundColor: "rgba(239,68,68,0.3)", color: "#fca5a5",
                }}>
                  ⚠️ {clashCount} clash{clashCount > 1 ? "es" : ""}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#f9fafb" }}>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} animate={i === lastMsgIndex} />
            ))}

            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "12px 16px", borderRadius: "14px 14px 14px 4px", backgroundColor: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "5px" }}>
                  <style>{`
                    @keyframes typingBounce{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-6px);opacity:1}}
                    .tdot{width:8px;height:8px;border-radius:50%;background:#9ca3af;animation:typingBounce 1.2s infinite ease-in-out}
                    .tdot:nth-child(2){animation-delay:.2s}.tdot:nth-child(3){animation-delay:.4s}
                  `}</style>
                  <div className="tdot" /><div className="tdot" /><div className="tdot" />
                </div>
              </div>
            )}

            {pendingDelete && !isLoading && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    const removed = pendingDelete.cls
                    onRemoveClass(removed)
                    setPendingDelete(null)
                    setMessages(prev => [...prev, { role: "user", content: "Yes, remove it" }])
                    setTimeout(() => pushAssistant(`✅ Done! "${removed.name}" has been removed. Your schedule is clash-free now 🎉`), 200)
                  }}
                  style={{ backgroundColor: "#166534", color: "white", border: "none", borderRadius: "20px", padding: "6px 16px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#14532d")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#166534")}
                >✅ Yes, remove it</button>
                <button
                  onClick={() => {
                    setPendingDelete(null)
                    setMessages(prev => [...prev, { role: "user", content: "No, keep it" }])
                    setTimeout(() => pushAssistant("Got it! The class stays. Let me know if you need anything else."), 200)
                  }}
                  style={{ backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "20px", padding: "6px 16px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#4b5563")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#6b7280")}
                >❌ No, keep it</button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #e5e7eb", backgroundColor: "#fff", display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasData ? "e.g. AII 108, MTH 201  or  remove PHY 102" : "Upload Excel file first..."}
              rows={2}
              style={{
                flex: 1, resize: "none", border: "1px solid #d1d5db", borderRadius: "10px",
                padding: "8px 11px", fontSize: "13px", fontFamily: "inherit", outline: "none", lineHeight: "1.4",
              }}
              onFocus={e => (e.target.style.borderColor = "#7f1d1d")}
              onBlur={e => (e.target.style.borderColor = "#d1d5db")}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              style={{
                backgroundColor: isLoading || !input.trim() ? "#d1d5db" : "#7f1d1d",
                color: "white", border: "none", borderRadius: "10px",
                padding: "10px 13px", cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                fontSize: "15px", flexShrink: 0,
              }}
            >➤</button>
          </div>
        </div>
      )}
    </div>
  )
}
