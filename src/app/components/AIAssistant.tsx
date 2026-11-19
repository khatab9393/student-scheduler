"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import type { ClassItem } from "./ClassList"
import type { TimetableEntry } from "./ExcelReader"
import { useLanguage } from "../i18n/LanguageContext"
import type { Lang } from "../i18n/translations"
import { normalizeDay } from "../utils/days"
import {
  buildSections, describeForPrompt, extractGroup, relevantSections, resolvePicks, splitByFamily,
} from "../utils/sections"
import type { RawPick, Section } from "../utils/sections"

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

// Words that confirm / decline the "remove this clashing class?" question.
// Both languages are always accepted, whichever language is selected.
const YES_WORDS = ["yes", "yes please", "do it", "sure", "ok", "okay", "remove it", "delete it", "remove", "yep", "yeah",
  "evet", "evet lütfen", "tamam", "olur", "sil", "kaldır", "tabii", "tabi", "peki"]
const NO_WORDS = ["no", "nope", "keep it", "cancel", "nevermind", "never mind", "nah",
  "hayır", "hayir", "yok", "kalsın", "kalsin", "vazgeç", "vazgec", "iptal", "olmaz", "dokunma"]

// ─── system prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(
  sections: Section[],
  currentClasses: ClassItem[],
  contextText: string,
  lang: Lang = "en"
): string {
  // Appended to the end of the prompt so the reply language follows the EN/TR switch.
  // The json / remove blocks must stay untouched because the app parses them.
  const langRule = lang === "tr"
    ? "\n\n━━━ LANGUAGE ━━━\nThe user has chosen TURKISH. Write ALL conversational text in natural, friendly Turkish (informal \"sen\" form): confirmations, group questions, clash explanations and general answers.\nDo NOT translate or change anything inside the ```json, ```remove and ```remove-session code blocks: keep the keys, exact course names, ENGLISH day names (Monday–Friday), times and locations exactly as in the data.\nKeep course codes as they are (e.g. AII108) and call groups \"Grup A\", \"Grup B\"."
    : "\n\n━━━ LANGUAGE ━━━\nThe user has chosen ENGLISH. Write all conversational text in English, even if earlier messages were in another language."

  if (sections.length === 0) {
    return `You are a friendly timetable assistant for Near East University. Talk like ChatGPT — warm and natural.
No Excel file uploaded yet. Ask the user to upload one first, then type course codes like: AII 108, MTH 201.${langRule}`
  }

  // Only the courses the user is talking about (looked up across the recent messages,
  // so a reply like "Group A" still resolves to the course asked about earlier)
  const dataStr = describeForPrompt(relevantSections(sections, contextText))

  const scheduleSummary = currentClasses.length === 0
    ? "Schedule is empty."
    : currentClasses.map(c => {
        const g = c.group || extractGroup(c.name)
        return `${c.name}${g ? ` [Grp ${g}]` : ""} | ${c.day} | ${c.timeStart}–${c.timeEnd}`
      }).join("\n")

  const clashes = getAllClashes(currentClasses)
  const clashSummary = clashes.length === 0
    ? "No clashes."
    : clashes.map(([a, b]) => {
        const ga = a.group || extractGroup(a.name)
        const gb = b.group || extractGroup(b.name)
        return `"${a.name}"${ga ? ` (Grp ${ga})` : ""} ↔ "${b.name}"${gb ? ` (Grp ${gb})` : ""} on ${a.day} ${a.timeStart}–${a.timeEnd}`
      }).join("\n")

  return `You are a smart, friendly timetable assistant for Near East University (AII dept).
Talk naturally like ChatGPT — warm, concise, helpful. Never be robotic.

━━━ CURRENT SCHEDULE ━━━
${scheduleSummary}

━━━ CLASH STATUS ━━━
${clashSummary}

━━━ AVAILABLE COURSES (each group has an [id] and ALL its sessions of the week) ━━━
${dataStr}

━━━ RULES ━━━

IMPORTANT: Course names in the data include instructor names like "AII108 A ABDELBARI".
The group letter is the SINGLE CAPITAL LETTER between the course code and instructor name.
Example: "AII108 A ABDELBARI" → course AII108, Group A, instructor ABDELBARI.
Always use the FULL name exactly as shown in the data (including instructor).
In PDF timetables a group can also be a student group such as 1AAS.

1. ADD COURSES — when the user gives one OR MORE course codes (e.g. "AII 108, MTH 201, PHY 102"):
   - Every course in the data lists its GROUPS. Each group has an [id] and ALL of its sessions of the week.
   - Handle ALL the courses the user mentioned in the SAME reply. Never deal with just one course and ignore the others.
   - A course is READY if it has only ONE group, or the user already said which group they want (in this message or an earlier one). A course with MORE THAN ONE group and no choice yet is NOT READY.
   - The user must pick exactly ONE group per course. NEVER add two groups of the same course.
   - Put the READY courses into ONE single \`\`\`json code block (hidden from display) that contains ONLY the chosen ids, one per course, like: [{ \"id\": 12 }, { \"id\": 31 }]. Do NOT write days, times or rooms — the app adds every session of the chosen group automatically.
   - For NOT READY courses, ask in that same reply, in ONE question, listing each course's groups with their sessions (e.g. \"AII108: Group A (ABDELBARI) Monday 08:30, Wednesday 10:30 — or Group B (SMITH) Tuesday 09:30. Which one?\"). Do not put them in the json yet. When the user answers, output the ids of all the chosen groups together in one json block.
   - If no course is ready, do not output a json block at all.
   - Reply briefly confirming which courses you're adding now (and which ones you're still waiting on).
   - Use ONLY ids that appear in the data above. Never invent classes or ids.
   - The JSON array must be valid JSON: double-quoted keys, no trailing commas, no comments
   - NEVER tell the user something was added, or say \"done\"/\"added\"/\"I've added\", unless your reply also contains the json block with the chosen ids. If you have not included the json block, do not claim the schedule was updated.

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
Never invent classes not in the data.${langRule}`
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
  const { lang, t, day: dayName } = useLanguage()
  // Every course group in the uploaded file, with all of its weekly sessions
  const sections = useMemo(() => buildSections(uploadedData), [uploadedData])
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: t("aiGreeting"),
  }])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastMsgIndex, setLastMsgIndex] = useState(-1)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // If the chat hasn't started yet, switch the greeting when the language changes
  useEffect(() => {
    setMessages(prev =>
      prev.length === 1 && prev[0].role === "assistant"
        ? [{ role: "assistant", content: t("aiGreeting") }]
        : prev
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

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

  // Reads every ```json block and returns the picks the AI made ({ id } or { name })
  const parsePicks = (text: string): RawPick[] => {
    const all: RawPick[] = []
    for (const m of text.matchAll(/```json\s*([\s\S]*?)```/g)) {
      let arr: unknown
      try {
        arr = JSON.parse(m[1])
      } catch {
        try {
          arr = JSON.parse(sanitizeJsonish(m[1]))
        } catch {
          continue // skip a malformed block, keep processing the rest
        }
      }
      if (Array.isArray(arr)) all.push(...(arr as RawPick[]))
    }
    return all
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

    const grp = (g: string) => (g ? t("groupSuffix", { g }) : "")
    const msg = t("aiClashMsg", {
      a: toSuggest.name, ga: grp(ga), da: dayName(toSuggest.day), sa: toSuggest.timeStart, ea: toSuggest.timeEnd,
      b: other.name, gb: grp(gb), db: dayName(other.day), sb: other.timeStart, eb: other.timeEnd,
    })

    setPendingDelete({ cls: toSuggest })
    setTimeout(() => pushAssistant(msg), 400)
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    // Turkish lower-casing differs for "I"/"İ", so check both
    const lowers = [trimmed.toLowerCase(), trimmed.toLocaleLowerCase("tr")]
    const matchWord = (words: string[]) =>
      words.some(w => lowers.some(l => l === w || l.startsWith(w + " ")))

    // Handle yes/no for clash resolution
    if (pendingDelete) {
      const isYes = matchWord(YES_WORDS)
      const isNo = matchWord(NO_WORDS)

      if (isYes) {
        setMessages(prev => [...prev, { role: "user", content: trimmed }])
        setInput("")
        const removed = pendingDelete.cls
        onRemoveClass(removed)
        setPendingDelete(null)
        setTimeout(() => pushAssistant(t("aiRemoved", { name: removed.name })), 200)
        return
      }
      if (isNo) {
        setMessages(prev => [...prev, { role: "user", content: trimmed }])
        setInput("")
        setPendingDelete(null)
        setTimeout(() => pushAssistant(t("aiKept")), 200)
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
          max_tokens: 2500,
          system: buildSystemPrompt(sections, currentClasses, recentContext, lang),
          lang,
          messages: newMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      const fullText = data.content?.map((b: any) => b.text || "").join("") || t("aiSorry")

      // Parse actions BEFORE cleaning text.
      // The AI only picks WHICH group of each course; the sessions (day/time/room) come from the file.
      const { picked, unresolved } = resolvePicks(parsePicks(fullText), sections)
      const { ok, conflicts } = splitByFamily(picked)
      const classes = ok.flatMap(sec => sec.rows)
      const removeCourse = parseRemoveCourse(fullText)
      const removeSession = parseRemoveSession(fullText)

      // Clean display text — strips ALL code blocks
      let displayText = cleanForDisplay(fullText)

      if (conflicts.length > 0) {
        // The AI picked two groups of one course — don't add them, ask the user to choose one
        const sessionsOf = (sec: Section) =>
          sec.rows.map(r => `${dayName(r.day)} ${r.timeStart}`).join(", ")
        const question = conflicts.map(list =>
          t("aiPickGroup", {
            course: list[0].family,
            options: list
              .map(sec => `• ${t("groupWord")} ${sec.label || sec.name} (${sec.name}): ${sessionsOf(sec)}`)
              .join("\n"),
          })
        ).join("\n\n")
        displayText = (ok.length > 0 ? `${t("aiAddedNow", { list: ok.map(sec => sec.name).join(", ") })}\n\n` : "") + question
      } else if (unresolved.length > 0 && classes.length === 0) {
        displayText = `${displayText}\n\n${t("aiNotFound", { list: unresolved.join(", ") })}`.trim()
      }

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
      pushAssistant(t("aiError"))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const hasData = uploadedData && uploadedData.length > 0
  const clashCount = getAllClashes(currentClasses).length

  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      {/* Anchor button (inline, sits next to the search bar) */}
      <button
        onClick={() => setIsOpen(o => !o)}
        title={t("aiTitle")}
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
        <div style={{
          position: "absolute", top: 0, right: "calc(100% + 10px)", zIndex: 999,
          width: "370px", maxHeight: "560px", borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)", backgroundColor: "#fff",
          display: "flex", flexDirection: "column", overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}>
          {/* Header */}
          <div style={{ backgroundColor: "#7f1d1d", color: "white", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "flex" }}><AIIcon size={20} /></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>{t("aiTitle")}</div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>{t("aiSubtitle")}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              <div style={{
                fontSize: "10px", padding: "3px 8px", borderRadius: "20px",
                backgroundColor: hasData ? "rgba(134,239,172,0.25)" : "rgba(255,255,255,0.15)",
                color: hasData ? "#86efac" : "rgba(255,255,255,0.6)",
              }}>
                {hasData ? t("aiClasses", { n: uploadedData.length }) : t("aiNoFile")}
              </div>
              {clashCount > 0 && (
                <div style={{
                  fontSize: "10px", padding: "3px 8px", borderRadius: "20px",
                  backgroundColor: "rgba(239,68,68,0.3)", color: "#fca5a5",
                }}>
                  {clashCount > 1 ? t("aiClashMany", { n: clashCount }) : t("aiClashOne", { n: clashCount })}
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
                    setMessages(prev => [...prev, { role: "user", content: t("aiUserYes") }])
                    setTimeout(() => pushAssistant(t("aiRemoved", { name: removed.name })), 200)
                  }}
                  style={{ backgroundColor: "#166534", color: "white", border: "none", borderRadius: "20px", padding: "6px 16px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#14532d")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#166534")}
                >{t("aiYesRemove")}</button>
                <button
                  onClick={() => {
                    setPendingDelete(null)
                    setMessages(prev => [...prev, { role: "user", content: t("aiUserNo") }])
                    setTimeout(() => pushAssistant(t("aiKept")), 200)
                  }}
                  style={{ backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "20px", padding: "6px 16px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#4b5563")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#6b7280")}
                >{t("aiNoKeep")}</button>
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
              placeholder={hasData ? t("aiPlaceholderData") : t("aiPlaceholderNoData")}
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
