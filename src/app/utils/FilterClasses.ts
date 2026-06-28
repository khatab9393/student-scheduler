import type { ClassItem } from "../components/ClassList"

export interface GroupedClass {
  name: string
  items: ClassItem[]
}

export function filterByName(query: string, data: ClassItem[]): GroupedClass[] {
  const grouped: Record<string, ClassItem[]> = {}

  data.forEach((cls) => {
    if (cls.name.toLowerCase().includes(query.toLowerCase())) {
      if (!grouped[cls.name]) grouped[cls.name] = []
      grouped[cls.name].push(cls)
    }
  })

  return Object.entries(grouped).map(([name, items]) => ({ name, items }))
}