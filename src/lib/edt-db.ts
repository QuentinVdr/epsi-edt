import type { Course } from "@/types/edt";

const DB_NAME = "edt-db";
const DB_VERSION = 2;
const STORE = "schedules";
const CACHE_KEY = "current";

export interface CacheEntry {
  key: string;
  courses: Course[];
  at: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(STORE)) {
        db.deleteObjectStore(STORE);
      }
      db.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getCache(): Promise<{
  courses: Course[];
  at: string;
} | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(CACHE_KEY);
    req.onsuccess = () => {
      const entry: CacheEntry | undefined = req.result;
      resolve(entry ? { courses: entry.courses, at: entry.at } : null);
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function setCache(courses: Course[], at: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({
      key: CACHE_KEY,
      courses,
      at,
    } satisfies CacheEntry);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearCache(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(CACHE_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
