"use client"

import React, { useState } from "react"
import { isClashing } from "../utils/clashDetector"

export interface ClassItem {
  name: string
  day: string
  timeStart: string
  timeEnd: string
  location: string
}

interface ClassListProps {
  classes: ClassItem[]
  onRemove: (cls: ClassItem) => void
  onRemoveCourse: (courseName: string) => void
  onUpdate: (oldCls: ClassItem, updatedCls: ClassItem) => void
  onAdd: (newCls: ClassItem) => void
}

function timeDiffInMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  return (eh - sh) * 60 + (em - sm)
}

const normalizeTime = (time: string): string => {
  if (!time) return time
  const [h, m] = time.split(":")
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`
}

// Helper function to check if a time is within the valid class time range (08:30 - 17:30)
const isWithinClassTimeRange = (time: string): boolean => {
  const validStartTime = "08:30"
  const validEndTime = "17:30"
  return time >= validStartTime && time <= validEndTime
}

const isValidTimeInterval = (time: string): boolean => {
  const [hour, minute] = time.split(":").map(Number)
  return minute === 0 || minute === 30  // Ensure minutes are 00 or 30
}

export default function ClassList({
  classes,
  onRemove,
  onRemoveCourse,
  onUpdate,
  onAdd,
}: ClassListProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [formState, setFormState] = useState<Partial<ClassItem>>({})
  const [editWarning, setEditWarning] = useState<string | null>(null)

  const [addingCourseMode, setAddingCourseMode] = useState(false)
  const [newCourse, setNewCourse] = useState<Partial<ClassItem>>({})
  const [addingCourse, setAddingCourse] = useState<string | null>(null)
  const [newSession, setNewSession] = useState<Partial<ClassItem>>({})

  const grouped = classes.reduce<Record<string, ClassItem[]>>((acc, cls) => {
    if (!acc[cls.name]) acc[cls.name] = []
    acc[cls.name].push(cls)
    return acc
  }, {})

  const classNames = Object.keys(grouped)

  const handleEdit = (cls: ClassItem) => {
    const key = `${cls.name}-${cls.day}-${cls.timeStart}`
    setEditingKey(key)
    setFormState({
      ...cls,
      timeStart: normalizeTime(cls.timeStart),
      timeEnd: normalizeTime(cls.timeEnd),
    })
    setEditWarning(null)
  }

  const validateTimes = (start: string, end: string): string | null => {
    // Check if times are within class time range
    if (!isWithinClassTimeRange(start)) {
      return "Start time must be between 08:30 and 17:30."
    }

    if (!isWithinClassTimeRange(end)) {
      return "End time must be between 08:30 and 17:30."
    }

    // Ensure start time is earlier than end time
    if (start >= end) {
      return "Start time must be earlier than end time."
    }

    // Ensure the time duration is within 1 hour
    const diff = timeDiffInMinutes(start, end)
    if (diff > 60) {
      return "Class duration cannot be more than 1 hour."
    }

    // Check if the time is on a 30-minute interval
    if (!isValidTimeInterval(start)) {
      return "Start time must be a valid 30-minute interval (e.g., 08:00, 08:30)."
    }

    if (!isValidTimeInterval(end)) {
      return "End time must be a valid 30-minute interval (e.g., 08:00, 08:30)."
    }

    return null
  }

  const handleSave = (original: ClassItem) => {
    if (
      formState.day &&
      formState.timeStart &&
      formState.timeEnd &&
      formState.location
    ) {
      const timeError = validateTimes(formState.timeStart, formState.timeEnd)
      if (timeError) {
        setEditWarning(timeError)
        return
      }
      const updated: ClassItem = {
        ...original,
        day: formState.day,
        timeStart: normalizeTime(formState.timeStart),
        timeEnd: normalizeTime(formState.timeEnd),
        location: formState.location,
      }

      const hasClash = isClashing(updated, classes, original).length > 0
      if (hasClash) {
        setEditWarning("This class conflicts with another, but changes are allowed.")
      }

      onUpdate(original, updated)
      setEditingKey(null)
      setFormState({})
      setEditWarning(null)
    } else {
      setEditWarning("Please fill in all fields.")
    }
  }

  const handleRemoveSession = (cls: ClassItem) => onRemove(cls)
  const handleRemoveCourse = (courseName: string) => onRemoveCourse(courseName)

  const handleAddNewSession = (courseName: string) => {
    if (
      newSession.day &&
      newSession.timeStart &&
      newSession.timeEnd &&
      newSession.location
    ) {
      const timeError = validateTimes(newSession.timeStart, newSession.timeEnd)
      if (timeError) {
        setEditWarning(timeError)
        return
      }
      const newCls: ClassItem = {
        name: courseName,
        day: newSession.day,
        timeStart: normalizeTime(newSession.timeStart),
        timeEnd: normalizeTime(newSession.timeEnd),
        location: newSession.location,
      }

      onAdd(newCls)
      setAddingCourse(null)
      setNewSession({})
      setEditWarning(null)
    } else {
      setEditWarning("Please fill in all fields for the new session.")
    }
  }

  const handleAddNewCourse = () => {
    if (
      newCourse.name &&
      newCourse.day &&
      newCourse.timeStart &&
      newCourse.timeEnd &&
      newCourse.location
    ) {
      const timeError = validateTimes(newCourse.timeStart, newCourse.timeEnd)
      if (timeError) {
        setEditWarning(timeError)
        return
      }
      const newCls: ClassItem = {
        name: newCourse.name,
        day: newCourse.day,
        timeStart: normalizeTime(newCourse.timeStart),
        timeEnd: normalizeTime(newCourse.timeEnd),
        location: newCourse.location,
      }
      onAdd(newCls)
      setNewCourse({})
      setAddingCourseMode(false)
      setEditWarning(null)
    } else {
      setEditWarning("Please fill in all fields to add a course.")
    }
  }

  return (
    <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-md font-semibold text-gray-800">Class List</h2>
        <button
          onClick={() => {
            setAddingCourseMode(true)
            setNewCourse({})
            setEditWarning(null)
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          Add Course
        </button>
      </div>

      {addingCourseMode && (
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-blue-50 p-2 rounded">
          <input
            type="text"
            placeholder="Course Name"
            value={newCourse.name || ""}
            onChange={(e) =>
              setNewCourse({ ...newCourse, name: e.target.value })
            }
            className="border rounded px-2 py-1 text-xs"
          />
          <select
            value={newCourse.day || ""}
            onChange={(e) =>
              setNewCourse({ ...newCourse, day: e.target.value })
            }
            className="border rounded px-2 py-1 text-xs"
          >
            <option value="">Day</option>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={newCourse.timeStart || ""}
            onChange={(e) =>
              setNewCourse({ ...newCourse, timeStart: e.target.value })
            }
            className="border rounded px-2 py-1 text-xs"
          />
          <input
            type="time"
            value={newCourse.timeEnd || ""}
            onChange={(e) =>
              setNewCourse({ ...newCourse, timeEnd: e.target.value })
            }
            className="border rounded px-2 py-1 text-xs"
          />
          <input
            type="text"
            placeholder="Location"
            value={newCourse.location || ""}
            onChange={(e) =>
              setNewCourse({ ...newCourse, location: e.target.value })
            }
            className="border rounded px-2 py-1 text-xs w-20"
          />
          <button
            className="text-green-600 hover:underline text-xs"
            onClick={handleAddNewCourse}
          >
            Save
          </button>
          <button
            className="text-gray-500 hover:underline text-xs"
            onClick={() => {
              setAddingCourseMode(false)
              setNewCourse({})
              setEditWarning(null)
            }}
          >
            Cancel
          </button>
          {editWarning && (
            <div className="text-red-500 text-xs w-full mt-1">
              {editWarning}
            </div>
          )}
        </div>
      )}

      {classNames.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          No classes to display.
        </p>
      ) : (
        <div className="space-y-4">
          {classNames.map((name) => (
            <div
              key={name}
              className="border border-gray-200 rounded-md p-3 bg-gray-50"
            >
              <div className="font-semibold text-sm mb-2">
                {name}
                <button
                  onClick={() => setAddingCourse(name)}
                  className="ml-4 text-blue-500 hover:underline text-xs"
                >
                  Add Session
                </button>
                <button
                  onClick={() => handleRemoveCourse(name)}
                  className="ml-2 text-red-500 hover:underline text-xs"
                >
                  Remove All
                </button>
              </div>

              <div className="space-y-2">
                {grouped[name].map((cls, i) => {
                  const key = `${cls.name}-${cls.day}-${cls.timeStart}`
                  const isEditing = editingKey === key
                  const hasClash = isClashing(cls, classes, cls).length > 0

                  return (
                    <div
                      key={i}
                      className={`flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-xs gap-2 p-2 rounded ${
                        hasClash ? "bg-red-100 border border-red-300" : ""
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex flex-wrap items-center gap-1 w-full">
                          <select
                            value={formState.day || ""}
                            onChange={(e) =>
                              setFormState({ ...formState, day: e.target.value })
                            }
                            className="border rounded px-2 py-1 text-xs"
                          >
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                              (d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              )
                            )}
                          </select>
                          <input
                            type="time"
                            value={formState.timeStart || ""}
                            onChange={(e) =>
                              setFormState({
                                ...formState,
                                timeStart: e.target.value,
                              })
                            }
                            className="border rounded px-2 py-1 text-xs"
                          />
                          <input
                            type="time"
                            value={formState.timeEnd || ""}
                            onChange={(e) =>
                              setFormState({
                                ...formState,
                                timeEnd: e.target.value,
                              })
                            }
                            className="border rounded px-2 py-1 text-xs"
                          />
                          <input
                            type="text"
                            value={formState.location || ""}
                            onChange={(e) =>
                              setFormState({
                                ...formState,
                                location: e.target.value,
                              })
                            }
                            className="border rounded px-2 py-1 text-xs w-20"
                            placeholder="Location"
                          />
                          <button
                            onClick={() => handleSave(cls)}
                            className="text-green-600 hover:underline text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingKey(null)
                              setFormState({})
                              setEditWarning(null)
                            }}
                            className="text-gray-500 hover:underline text-xs"
                          >
                            Cancel
                          </button>
                          {editWarning && (
                            <div className="text-red-500 text-xs w-full mt-1">
                              {editWarning}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full">
                          <div>
                            {cls.day}, {cls.timeStart}–{cls.timeEnd} (Location: {cls.location || "(none)"})
                            {hasClash && (
                              <span className="text-red-600 ml-2 font-semibold">
                                Clash detected
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-1 sm:mt-0">
                            <button
                              onClick={() => handleEdit(cls)}
                              className="text-blue-500 hover:underline text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRemoveSession(cls)}
                              className="text-red-500 hover:underline text-xs"
                            >
                              Remove Session
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {addingCourse === name && (
                  <div className="mt-2 flex flex-wrap gap-2 bg-blue-50 p-2 rounded">
                    <select
                      value={newSession.day || ""}
                      onChange={(e) =>
                        setNewSession({ ...newSession, day: e.target.value })
                      }
                      className="border rounded px-2 py-1 text-xs"
                    >
                      <option value="">Day</option>
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={newSession.timeStart || ""}
                      onChange={(e) =>
                        setNewSession({ ...newSession, timeStart: e.target.value })
                      }
                      className="border rounded px-2 py-1 text-xs"
                    />
                    <input
                      type="time"
                      value={newSession.timeEnd || ""}
                      onChange={(e) =>
                        setNewSession({ ...newSession, timeEnd: e.target.value })
                      }
                      className="border rounded px-2 py-1 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={newSession.location || ""}
                      onChange={(e) =>
                        setNewSession({ ...newSession, location: e.target.value })
                      }
                      className="border rounded px-2 py-1 text-xs w-20"
                    />
                    <button
                      className="text-green-600 hover:underline text-xs"
                      onClick={() => handleAddNewSession(name)}
                    >
                      Save
                    </button>
                    <button
                      className="text-gray-500 hover:underline text-xs"
                      onClick={() => {
                        setAddingCourse(null)
                        setNewSession({})
                        setEditWarning(null)
                      }}
                    >
                      Cancel
                    </button>
                    {editWarning && (
                      <div className="text-red-500 text-xs w-full mt-1">
                        {editWarning}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}