// Maps any day name (English or Turkish, any casing) to the English name the
// rest of the app uses internally ("Monday" ... "Sunday").
// PDF timetables use Turkish day names (Pazartesi, Salı, ...); Excel ones use English.
const ALIASES: Record<string, string> = {
  monday: "Monday",
  pazartesi: "Monday",
  tuesday: "Tuesday",
  salı: "Tuesday",
  sali: "Tuesday",
  wednesday: "Wednesday",
  çarşamba: "Wednesday",
  carsamba: "Wednesday",
  thursday: "Thursday",
  perşembe: "Thursday",
  persembe: "Thursday",
  friday: "Friday",
  cuma: "Friday",
  saturday: "Saturday",
  cumartesi: "Saturday",
  sunday: "Sunday",
  pazar: "Sunday",
}

export function normalizeDay(day: string): string {
  if (!day) return ""
  const trimmed = day.trim()
  // Try both lower-casings: Turkish rules turn "I" into "ı", English rules don't.
  const candidates = [trimmed.toLowerCase(), trimmed.toLocaleLowerCase("tr")]
  for (const key of candidates) {
    if (ALIASES[key]) return ALIASES[key]
  }
  const d = candidates[0]
  return d.charAt(0).toUpperCase() + d.slice(1)
}
