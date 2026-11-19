"use client"
import AIAssistant from "../components/AIAssistant"
import React, { useState, useRef, useEffect } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

import ScheduleTable from "../components/ScheduleTable"
import SearchBar from "../components/SearchBar"
import ClassList, { ClassItem } from "../components/ClassList"
import { filterByName } from "../utils/FilterClasses"
import { isClashing } from "../utils/clashDetector"
import ExcelReader, { TimetableEntry } from "../components/ExcelReader"
import DownloadSchedule from "../components/DownloadSchedule"
import { useLanguage } from "../i18n/LanguageContext"
import { convertToClassItems } from "../utils/convertEntries"

export default function SchedulePage() {
  const { t, day: dayName } = useLanguage()
  const clashMsg = (cls: ClassItem, conflict: ClassItem) =>
    t("clashConflict", {
      name: cls.name,
      day: dayName(cls.day),
      time: cls.timeStart,
      other: conflict.name,
      start: conflict.timeStart,
      end: conflict.timeEnd,
    })
  const [allClasses, setAllClasses] = useState<ClassItem[]>([])
  const [uploadedData, setUploadedData] = useState<TimetableEntry[]>([])
  const [warning, setWarning] = useState<string | null>(null)
  const warningTimeout = useRef<NodeJS.Timeout | null>(null)

  const clearWarning = () => {
    setWarning(null)
    if (warningTimeout.current) {
      clearTimeout(warningTimeout.current)
      warningTimeout.current = null
    }
  }

  const showWarning = (message: string) => {
    clearWarning()
    setWarning(message)
    warningTimeout.current = setTimeout(() => setWarning(null), 10000)
  }

  const handleAddClass = (newClasses: ClassItem[]) => {
    const added: ClassItem[] = []
    const clashMessages: string[] = []

    newClasses.forEach((cls) => {
      const isDuplicate = allClasses.some(
        (existing) =>
          existing.name === cls.name &&
          existing.day === cls.day &&
          existing.timeStart === cls.timeStart
      )
      if (!isDuplicate) {
        const clashes = isClashing(cls, allClasses)
        if (clashes.length > 0) {
          clashes.forEach((conflict) => {
            clashMessages.push(
              clashMsg(cls, conflict)
            )
          })
        }
        added.push(cls)
      }
    })

    if (clashMessages.length > 0) showWarning(clashMessages.join("; "))
    setAllClasses((prev) => [...prev, ...added])
  }

  const handleAddSingleClass = (cls: ClassItem) => {
    const isDuplicate = allClasses.some(
      (existing) =>
        existing.name === cls.name &&
        existing.day === cls.day &&
        existing.timeStart === cls.timeStart
    )
    if (!isDuplicate) {
      const clashes = isClashing(cls, allClasses)
      if (clashes.length > 0) {
        showWarning(clashes.map(
          (conflict) => clashMsg(cls, conflict)
        ).join("; "))
      }
      setAllClasses((prev) => [...prev, cls])
    }
  }

  const handleRemoveClass = (clsToRemove: ClassItem) => {
    clearWarning()
    setAllClasses((prev) =>
      prev.filter(
        (cls) =>
          !(cls.name === clsToRemove.name &&
            cls.day === clsToRemove.day &&
            cls.timeStart === clsToRemove.timeStart)
      )
    )
  }

  const handleRemoveCourse = (courseName: string) => {
    clearWarning()
    setAllClasses((prev) => prev.filter((cls) => cls.name !== courseName))
  }

  const handleUpdateClass = (original: ClassItem, updated: ClassItem) => {
    clearWarning()
    setAllClasses((prev) =>
      prev.map((cls) =>
        cls.name === original.name &&
        cls.day === original.day &&
        cls.timeStart === original.timeStart
          ? updated : cls
      )
    )
  }

  const handleMoveClass = (from: ClassItem, to: ClassItem) => {
    const same = from.name === to.name && from.day === to.day && from.timeStart === to.timeStart
    if (same) return
    const clashes = isClashing(to, allClasses, from)
    if (clashes.length > 0) {
      showWarning(clashes.map(
        (conflict) => clashMsg(to, conflict)
      ).join("; "))
    }
    clearWarning()
    setAllClasses((prev) => prev.map((cls) => (cls === from ? to : cls)))
  }

  useEffect(() => {
    const handler = (e: any) => showWarning(e.detail)
    window.addEventListener("schedule-warning", handler)
    return () => window.removeEventListener("schedule-warning", handler)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-0 lg:space-x-6">
      <div className="w-full lg:w-2/3">
        <div className="flex justify-start items-center gap-2 mb-2">
          <DownloadSchedule targetId="schedule-capture" />
        </div>
        <div id="schedule-capture" className="overflow-x-auto rounded-md">
          <DndProvider backend={HTML5Backend}>
            <ScheduleTable classes={allClasses} onMoveClass={handleMoveClass} />
          </DndProvider>
        </div>
      </div>

      <div className="w-full lg:w-1/3 min-w-0 space-y-6">
        {warning && (
          <div
            className="text-sm text-red-600 bg-red-100 border border-red-300 rounded p-2 cursor-pointer"
            onClick={clearWarning}
          >
            {warning}
          </div>
        )}

        <div className="flex justify-end">
          <AIAssistant
            onAddClasses={handleAddClass}
            onRemoveClass={handleRemoveClass}
            onRemoveCourse={handleRemoveCourse}
            uploadedData={uploadedData}
            currentClasses={allClasses}
          />
        </div>

        <SearchBar
          onAdd={handleAddClass}
          filterFunction={(query) =>
            filterByName(query, convertToClassItems(uploadedData))
          }
        />

        <ClassList
          classes={allClasses}
          onRemove={handleRemoveClass}
          onRemoveCourse={handleRemoveCourse}
          onUpdate={handleUpdateClass}
          onAdd={handleAddSingleClass}
        />

        <div className="mt-4">
          <ExcelReader onUpload={setUploadedData} />
        </div>
      </div>
    </div>
  )
}
