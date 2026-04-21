import type { Course } from "@/types/edt";

// Module-level singletons — survive for the lifetime of the Node.js process.
// Cache is keyed by session cookie so different students never share data.

let _cachedForCookie: string | null = null;
let _courses: Course[] | null = null;
let _cachedAt = 0;
const TTL_MS = 3_600_000; // 1 hour

export function getCachedCourses(forCookie: string): Course[] | null {
  if (
    _courses &&
    _cachedForCookie === forCookie &&
    Date.now() - _cachedAt < TTL_MS
  )
    return _courses;
  return null;
}

export function setCachedCourses(courses: Course[], forCookie: string): void {
  _cachedForCookie = forCookie;
  _courses = courses;
  _cachedAt = Date.now();
}

export function invalidateCourseCache(): void {
  _cachedForCookie = null;
  _courses = null;
  _cachedAt = 0;
}

export function cacheAge(): number {
  return _cachedAt ? Math.round((Date.now() - _cachedAt) / 1000) : -1;
}

export function getCachedAt(): number {
  return _cachedAt;
}
