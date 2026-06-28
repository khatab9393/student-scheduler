"use client"

import React, { useState } from "react"
import type { ClassItem } from "./ClassList"
import type { GroupedClass } from "../utils/FilterClasses"

interface SearchBarProps {
  onAdd: (classes: ClassItem[]) => void
  filterFunction: (query: string) => GroupedClass[]
}

export default function SearchBar({ onAdd, filterFunction }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GroupedClass[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (value.trim().length === 0) {
      setResults([])
      return
    }

    const matches = filterFunction(value)
    console.log("Search matches:", matches)  // Debug: check location in results
    setResults(matches)
  }

  const handleSelect = (group: GroupedClass) => {
    onAdd(group.items)
    setResults([])
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search for a class..."
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-md max-h-60 overflow-y-auto">
          {results.map((group, index) => (
            <div
              key={index}
              onClick={() => handleSelect(group)}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 border-b border-gray-100"
            >
              <div className="font-medium">{group.name}</div>
              <div className="text-xs text-gray-500">{group.items.length} match(es)</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}