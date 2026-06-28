"use client"

import React, { useRef } from "react"
import type { ClassItem } from "./ClassList"
import { useDrop } from "react-dnd"
import { ItemTypes } from "../utils/DragTypes"
import { DraggableClassCell } from "./DraggableClassCell"
import { isClashing } from "../utils/clashDetector"

const schedule = [
  "08:30", "09:30", "10:30", "11:30", "12:30",
  "13:30", "14:30", "15:30", "16:30", "17:30"
]

const days = ["MON", "TUE", "WED", "THU", "FRI"]

const dayMap: Record<string, string> = {
  Monday: "MON",
  Tuesday: "TUE",
  Wednesday: "WED",
  Thursday: "THU",
  Friday: "FRI"
}

const reverseDayMap = Object.fromEntries(
  Object.entries(dayMap).map(([k, v]) => [v, k])
)

function normalizeTime(time: string): string {
  const [hour, minute] = time.split(":")
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
}

function calculateEndTime(start: string): string {
  const [hour, minute] = start.split(":").map(Number)
  const endHour = hour + 1
  return `${String(endHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function hasInternalClash(classes: ClassItem[]): boolean {
  for (let i = 0; i < classes.length; i++) {
    for (let j = i + 1; j < classes.length; j++) {
      if (isClashing(classes[i], [classes[j]]).length > 0) {
        return true
      }
    }
  }
  return false
}

interface ScheduleTableProps {
  classes: ClassItem[]
  onMoveClass: (from: ClassItem, to: ClassItem) => void
}

export default function ScheduleTable({
  classes,
  onMoveClass,
}: ScheduleTableProps) {
  return (
    <div className="p-4 overflow-visible"> {/* Remove scroll container */}
      <div className="w-full"> {/* Ensure full width layout */}
        <table className="min-w-full table-fixed border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="w-20 border border-gray-300 bg-gray-100"></th>
              {days.map((day) => (
                <th
                  key={day}
                  className="border border-gray-300 bg-gray-100 text-center font-semibold"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.map((time) => (
              <tr key={time}>
                <td className="border border-gray-300 text-center text-sm font-medium bg-gray-50">
                  {time}
                </td>
                {days.map((day) => {
                  const matching = classes.filter(
                    (cls) =>
                      dayMap[cls.day] === day &&
                      normalizeTime(cls.timeStart) === time
                  )

                  const hasClash = hasInternalClash(matching)

                  const [{ isOver }, dropRef] = useDrop(() => ({
                    accept: ItemTypes.CLASS,
                    drop: (dragged: ClassItem) => {
                      const newClass: ClassItem = {
                        ...dragged,
                        day: reverseDayMap[day],
                        timeStart: time,
                        timeEnd: calculateEndTime(time),
                      }

                      const isSame =
                        dragged.name === newClass.name &&
                        dragged.day === newClass.day &&
                        dragged.timeStart === newClass.timeStart

                      if (isSame) return

                      const conflicts = isClashing(newClass, classes, dragged)

                      if (conflicts.length > 0) {
                        window.dispatchEvent(
                          new CustomEvent("schedule-warning", {
                            detail: `Clash with: ${conflicts
                              .map((c) => `"${c.name}" at ${c.timeStart}–${c.timeEnd}`)
                              .join(", ")}`,
                          })
                        )
                      }

                      onMoveClass(dragged, newClass)
                    },
                    collect: (monitor) => ({
                      isOver: monitor.isOver(),
                    }),
                  }))

                  const localRef = useRef<HTMLTableDataCellElement | null>(null)
                  const setRefs = (el: HTMLTableDataCellElement | null) => {
                    localRef.current = el
                    dropRef(el)
                  }

                  return (
                    <td
                      key={`${day}|${time}`}
                      ref={setRefs}
                      className={`border align-top p-1 transition-colors ${
                        isOver ? "bg-blue-100" : hasClash ? "bg-red-100" : ""
                      }`}
                    >
                      {matching.map((cls, i) => (
                        <DraggableClassCell
                          key={`${cls.name}-${cls.day}-${cls.timeStart}-${i}`}
                          cls={cls}
                          span={1}
                          dropRef={() => {}}
                          isOver={false}
                        />
                      ))}
                      {hasClash && (
                        <div className="text-[10px] text-red-600 font-medium mt-1">
                          Clash detected
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}