"use client"

import React, { useRef, useEffect } from "react"
import { useDrag } from "react-dnd"
import { ClassItem } from "./ClassList"
import { ItemTypes } from "../utils/DragTypes"

// Function to generate consistent, html2canvas-safe HEX color from class name
const generateClassColor = (name: string): string => {
  const hash = name
    .split("")
    .reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  const hue = Math.abs(hash) % 360
  const saturation = 70
  const lightness = 70

  // Convert HSL to hex manually
  const hslToHex = (h: number, s: number, l: number) => {
    s /= 100
    l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) =>
      Math.round(
        255 *
          (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))
      )
    return `#${f(0).toString(16).padStart(2, "0")}${f(8)
      .toString(16)
      .padStart(2, "0")}${f(4).toString(16).padStart(2, "0")}`
  }

  return hslToHex(hue, saturation, lightness)
}

interface Props {
  cls: ClassItem
  span?: number
  dropRef?: (el: HTMLElement | null) => void
  isOver?: boolean
}

export function DraggableClassCell({ cls, span, dropRef, isOver }: Props) {
  const innerRef = useRef<HTMLDivElement | null>(null)

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CLASS,
    item: cls,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  useEffect(() => {
    if (innerRef.current) {
      drag(innerRef.current)
    }
  }, [drag])

  const classColor = generateClassColor(cls.name)

  return (
    <div
      ref={innerRef}
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: classColor,
        color: "black",
      }}
      className={`text-xs rounded px-2 py-1 border cursor-move mb-1 ${
        isOver ? "ring ring-blue-400" : ""
      }`}
    >
      <div className="font-medium">{cls.name}</div>
      <div className="text-[10px]">{cls.location}</div>
      <div className="text-[10px]">
        {cls.timeStart}–{cls.timeEnd}
      </div>
    </div>
  )
}