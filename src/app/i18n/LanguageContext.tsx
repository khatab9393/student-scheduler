"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { translations, Lang, TranslationKey } from "./translations"

type Vars = Record<string, string | number>

type LanguageContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  /** t("key") or t("key", { name: "x" }) to fill {name} placeholders */
  t: (key: TranslationKey, vars?: Vars) => string
  /** Canonical English day name ("Monday") -> label in the current language */
  day: (name: string) => string
  /** Table header code ("MON") -> label in the current language */
  dayShort: (code: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en")

  // Read the saved choice after mount (avoids a Next.js hydration mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang")
      if (saved === "en" || saved === "tr") {
        setLangState(saved)
        document.documentElement.lang = saved
      }
    } catch {
      /* storage unavailable — stay on English */
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    document.documentElement.lang = l
    try {
      localStorage.setItem("lang", l)
    } catch {
      /* ignore */
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Vars) => {
      let s = translations[lang][key] as string
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.split(`{${k}}`).join(String(v))
        }
      }
      return s
    },
    [lang]
  )

  const day = useCallback(
    (name: string) =>
      (translations[lang].days as Record<string, string>)[name] ?? name,
    [lang]
  )

  const dayShort = useCallback(
    (code: string) =>
      (translations[lang].daysShort as Record<string, string>)[code] ?? code,
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, day, dayShort }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>")
  return ctx
}
