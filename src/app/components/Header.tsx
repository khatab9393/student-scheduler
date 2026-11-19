"use client"

import LanguageToggle from "../i18n/LanguageToggle"
import { useLanguage } from "../i18n/LanguageContext"

export default function Header() {
  const { t } = useLanguage()

  return (
    <header className="bg-red-950 text-white py-6 shadow-md overflow-hidden">
      <div className="flex flex-col items-center px-4">
        {/* Language switch (top right) */}
        <div className="self-end mb-3">
          <LanguageToggle />
        </div>

        {/* Logo Row */}
        <div className="flex flex-row flex-wrap justify-center items-center gap-3 sm:gap-6 mb-3 sm:mb-4">
          <img
            src="/reserch center.png"
            alt="Logo"
            className="h-8 sm:h-16 w-auto max-w-[42%] sm:max-w-none object-contain"
            loading="lazy"
            decoding="async"
          />
          <img
            src="/Ai and informatics.png"
            alt="Logo 2"
            className="h-8 sm:h-16 w-auto max-w-[42%] sm:max-w-none object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-center tracking-tight">
          {t("headerTitle")}
        </h1>
      </div>
    </header>
  )
}
