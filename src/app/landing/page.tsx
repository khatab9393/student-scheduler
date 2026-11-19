"use client"

import Link from "next/link"
import { useLanguage } from "../i18n/LanguageContext"

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex flex-col items-center justify-start pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto text-center space-y-10">
        <h1 className="text-5xl font-extrabold text-gray-900">
          {t("landingTitle")}
        </h1>

        {/* Features Section */}
        <section className="mt-12 space-y-6 text-left">
          <h2 className="text-2xl font-semibold text-gray-800">{t("keyFeatures")}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <li className="p-4 bg-white rounded shadow">{t("feat1")}</li>
            <li className="p-4 bg-white rounded shadow">{t("feat2")}</li>
            <li className="p-4 bg-white rounded shadow">{t("feat3")}</li>
            <li className="p-4 bg-white rounded shadow">{t("feat4")}</li>
          </ul>
        </section>

        {/* Instructions Section */}
        <section className="mt-12 space-y-6 text-left">
          <h2 className="text-2xl font-semibold text-gray-800">{t("howToUse")}</h2>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700 bg-white p-6 rounded shadow">
            <li>
              {t("step1")}
              <div className="text-gray-500 text-xs mt-1">{t("step1Hint")}</div>
            </li>
            <li>
              {t("step2")}
              <div className="text-gray-500 text-xs mt-1">{t("step2Hint")}</div>
            </li>
            <li>{t("step3")}</li>
            <li>
              {t("step4")}
              <div className="text-gray-500 text-xs mt-1">{t("step4Hint")}</div>
            </li>
            <li>{t("step5")}</li>
          </ol>
        </section>
        <Link
          href="/schedule"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md shadow hover:bg-blue-700 transition"
        >
          {t("getStarted")}
        </Link>
      </div>
    </main>
  )
}
