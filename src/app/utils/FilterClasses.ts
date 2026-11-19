import type { ClassItem } from "../components/ClassList"

export interface GroupedClass {
  name: string
  items: ClassItem[]
}

export function filterByName(query: string, data: ClassItem[]): GroupedClass[] {
  const grouped: Record<string, ClassItem[]> = {}

  const q = query.toLowerCase()
  data.forEach((cls) => {
    const label = cls.group ? `${cls.name} · ${cls.group}` : cls.name
    if (label.toLowerCase().includes(q)) {
      // one result per course + group, so adding it brings that group's sessions only
      if (!grouped[label]) grouped[label] = []
      grouped[label].push(cls)
    }
  })

  return Object.entries(grouped).map(([name, items]) => ({ name, items }))
}