import type { Course } from "@/types/edt";

// Module-level cache — survives for the lifetime of the Node.js process.
// Keyed by session cookie so concurrent students each get their own slot
// instead of thrashing a single shared one.

interface Entry {
  courses: Course[];
  at: number;
}

const cache = new Map<string, Entry>();
const TTL_MS = 3_600_000; // 1 hour

function evictExpired(): void {
  const cutoff = Date.now() - TTL_MS;
  for (const [key, entry] of cache) {
    if (entry.at < cutoff) cache.delete(key);
  }
}

export function getCachedCourses(forCookie: string): Course[] | null {
  const entry = cache.get(forCookie);
  if (!entry) return null;
  if (Date.now() - entry.at >= TTL_MS) {
    cache.delete(forCookie);
    return null;
  }
  return entry.courses;
}

export function setCachedCourses(courses: Course[], forCookie: string): void {
  evictExpired();
  cache.set(forCookie, { courses, at: Date.now() });
}

export function invalidateCourseCache(forCookie?: string): void {
  if (forCookie) {
    cache.delete(forCookie);
  } else {
    cache.clear();
  }
}

export function cacheAge(forCookie: string): number {
  const entry = cache.get(forCookie);
  return entry ? Math.round((Date.now() - entry.at) / 1000) : -1;
}

export function getCachedAt(forCookie: string): number {
  return cache.get(forCookie)?.at ?? 0;
}
