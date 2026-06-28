"use client"

import { useRef, useEffect } from "react"

interface Props {
  isOver: boolean
  dropRef: (element: HTMLElement | null) => void
}

export default function EmptyDropCell({ isOver, dropRef }: Props) {
  const ref = useRef<HTMLTableDataCellElement | null>(null)

  useEffect(() => {
    if (ref.current) {
      dropRef(ref.current)
    }
  }, [dropRef])

  return (
    <td
      ref={ref}
      className={`border border-gray-200 h-12 text-center transition-colors ${
        isOver ? "bg-blue-100" : ""
      }`}
    />
  )
}