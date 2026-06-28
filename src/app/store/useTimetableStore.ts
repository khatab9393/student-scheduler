import { create } from "zustand"
import { TimetableEntry } from "../components/ExcelReader"

type TimetableState = {
  timetable: TimetableEntry[]
  setTimetable: (data: TimetableEntry[]) => void
  clearTimetable: () => void
}

export const useTimetableStore = create<TimetableState>()((set) => ({
  timetable: [],
  setTimetable: (data) => set({ timetable: data }),
  clearTimetable: () => set({ timetable: [] }),
}))