import type { ClassItem } from "../components/ClassList"

/**
 * Converts a time string (e.g., "08:30") to a float (e.g., 8.5)
 */
function timeToFloat(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours + minutes / 60
}

/**
 * Checks if two class times overlap on the same day
 */
function timesOverlap(a: ClassItem, b: ClassItem): boolean {
  if (a.day !== b.day) return false

  const startA = timeToFloat(a.timeStart)
  const endA = timeToFloat(a.timeEnd)
  const startB = timeToFloat(b.timeStart)
  const endB = timeToFloat(b.timeEnd)

  return startA < endB && endA > startB
}

/**
 * Determines if two ClassItem entries are the same (for exclusion logic)
 */
function isSameClass(a: ClassItem, b: ClassItem): boolean {
  return (
    a.name === b.name &&
    a.day === b.day &&
    a.timeStart === b.timeStart &&
    a.timeEnd === b.timeEnd &&
    a.location === b.location
  )
}

/**
 * Returns an array of classes from `existingClasses` that conflict with `newClass`.
 * Optionally excludes one specific class (`excludeItem`) from the check.
 */
export function isClashing(
  newClass: ClassItem,
  existingClasses: ClassItem[],
  excludeItem?: ClassItem
): ClassItem[] {
  return existingClasses.filter((cls) => {
    if (excludeItem && isSameClass(cls, excludeItem)) return false
    return timesOverlap(newClass, cls)
  })
}