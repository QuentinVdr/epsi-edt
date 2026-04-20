import type { Course } from "@/types/edt";

export const HOUR_START_DEFAULT = 8;
export const HOUR_END_DEFAULT = 18;
export const PX_PER_HOUR = 52;

/** Compute visible hour range for a set of courses, with optional padding. */
export function getHourRange(courses: Course[]): {
  hourStart: number;
  hourEnd: number;
} {
  if (courses.length === 0)
    return { hourStart: HOUR_START_DEFAULT, hourEnd: HOUR_END_DEFAULT };
  let min = HOUR_END_DEFAULT;
  let max = HOUR_START_DEFAULT;
  for (const c of courses) {
    const { hours: sh, minutes: sm } = courseTime(c.Start);
    const { hours: eh, minutes: em } = courseTime(c.End);
    const startH = sh + (sm > 0 ? 0 : 0); // floor
    const endH = eh + (em > 0 ? 1 : 0); // ceil
    if (startH < min) min = startH;
    if (endH > max) max = endH;
  }
  return {
    hourStart: Math.min(min, HOUR_START_DEFAULT),
    hourEnd: Math.max(max, HOUR_END_DEFAULT),
  };
}

// Keep static exports for backward compat (used as defaults)
export const HOUR_START = HOUR_START_DEFAULT;
export const HOUR_END = HOUR_END_DEFAULT;
export const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;

export const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const DAYS_LONG = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];
export const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function courseColor(c: Course) {
  return `rgb(${c.ColorRed},${c.ColorGreen},${c.ColorBlue})`;
}

export function isLight(r: number, g: number, b: number) {
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// Wigor stores times in UTC but tags them with +02:00 — use UTC accessors to
// get the correct hour/minute values regardless of the client's local timezone.
export function courseTime(isoString: string) {
  const d = new Date(isoString);
  return { hours: d.getUTCHours(), minutes: d.getUTCMinutes() };
}

export function formatCourseTime(isoString: string) {
  const { hours, minutes } = courseTime(isoString);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function positionCourse(
  course: Course,
  hourStart = HOUR_START,
  _hourEnd = HOUR_END,
) {
  const { hours: sh, minutes: sm } = courseTime(course.Start);
  const { hours: eh, minutes: em } = courseTime(course.End);
  const startMin = sh * 60 + sm - hourStart * 60;
  const durationMin = eh * 60 + em - (sh * 60 + sm);
  const top = Math.max(0, startMin * (PX_PER_HOUR / 60));
  const height = Math.max(20, durationMin * (PX_PER_HOUR / 60));
  return { top: `${top}px`, height: `${height}px` };
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getCoursesForDay(courses: Course[], date: Date) {
  return courses.filter((c) => isSameDay(new Date(c.Start), date));
}

/** Monday of the week containing `date` */
export function getMondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
