import type { Course } from "@/types/edt";

// Module-level singletons — survive for the lifetime of the Node.js process.
// In dev mode (single process) this is perfect for a personal-use app.

let _cookie: string | null = null;
let _courses: Course[] | null = null;
let _cachedAt = 0;
const TTL_MS = 3_600_000; // 1 hour

export function getEdtCookie(): string | null {
  return _cookie;
}

export function setEdtCookie(cookie: string): void {
  _cookie = cookie;
  _courses = null; // invalidate course cache when cookie changes
  _cachedAt = 0;
}

export function clearEdtCookie(): void {
  _cookie = null;
  _courses = null;
  _cachedAt = 0;
}

export function isAuthenticated(): boolean {
  return _cookie !== null;
}

export function getCachedCourses(): Course[] | null {
  if (_courses && Date.now() - _cachedAt < TTL_MS) return _courses;
  return null;
}

export function setCachedCourses(courses: Course[]): void {
  _courses = courses;
  _cachedAt = Date.now();
}

export function invalidateCourseCache(): void {
  _courses = null;
  _cachedAt = 0;
}

export function cacheAge(): number {
  return _cachedAt ? Math.round((Date.now() - _cachedAt) / 1000) : -1;
}
