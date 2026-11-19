"use client"

import { useLanguage } from "./LanguageContext"

// Small EN | TR switch, styled for the dark-red header.
export default function LanguageToggle() {
  const { lang, setLang } = useLanguage()
  const isTR = lang === "tr"

  const label = (active: boolean): React.CSSProperties => ({
    position: "relative",
    textAlign: "center",
    color: active ? "#7f1d1d" : "#ffffff",
    transition: "color 0.2s ease",
  })

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isTR}
      aria-label="Language: English / Türkçe"
      title={isTR ? "Switch to English" : "Türkçe'ye geç"}
      onClick={() => setLang(isTR ? "en" : "tr")}
      style={{
        position: "relative",
        display: "inline-grid",
        gridTemplateColumns: "1fr 1fr",
        alignItems: "center",
        width: 64,
        height: 28,
        padding: 0,
        border: "1px solid rgba(255,255,255,0.45)",
        borderRadius: 999,
        background: "rgba(255,255,255,0.14)",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 700,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 2,
          left: isTR ? "calc(50% - 1px)" : 2,
          width: "calc(50% - 1px)",
          height: 22,
          borderRadius: 999,
          background: "#ffffff",
          transition: "left 0.2s ease",
        }}
      />
      <span style={label(!isTR)}>EN</span>
      <span style={label(isTR)}>TR</span>
    </button>
  )
}
