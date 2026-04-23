"use client";

import { DayView } from "@/components/DayView";
import { MonthView } from "@/components/MonthView";
import { WeekCalendar } from "@/components/WeekCalendar";
import { YearView } from "@/components/YearView";
import type { Course, EdtResponse, ViewType } from "@/types/edt";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const CACHE_KEY = "edt-cache-v1";
const VIEW_KEY = "edt-view";

interface Cache {
  courses: Course[];
  at: string;
}

const VIEWS: { key: ViewType; label: string }[] = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "year", label: "Année" },
];

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  function changeView(v: ViewType) {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/edt");

      if (res.status === 401) {
        // Cookie expired or not set → go to login
        router.push("/login");
        return;
      }

      if (!res.ok) throw new Error(`${res.status}`);

      const data: EdtResponse & { _totalCached?: number; _fetchedAt?: string } =
        await res.json();
      const fetched = data.Data ?? [];
      setCourses(fetched);
      setIsOffline(false);
      const fetchedAt = data._fetchedAt
        ? new Date(data._fetchedAt)
        : new Date();
      setLastUpdated(fetchedAt);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          courses: fetched,
          at: fetchedAt.toISOString(),
        } satisfies Cache),
      );
    } catch {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_KEY) as ViewType | null;
    if (savedView && VIEWS.some((v) => v.key === savedView)) setView(savedView);

    // Show cached data instantly
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cache: Cache = JSON.parse(raw);
        setCourses(cache.courses);
        setLastUpdated(new Date(cache.at));
        setIsLoading(false);
      }
    } catch {}

    fetchCourses();
  }, [fetchCourses]);

  const updatedLabel = lastUpdated
    ? (() => {
        const now = new Date();
        const isToday =
          lastUpdated.getFullYear() === now.getFullYear() &&
          lastUpdated.getMonth() === now.getMonth() &&
          lastUpdated.getDate() === now.getDate();
        const time = lastUpdated.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        if (isToday) return time;
        const date = lastUpdated.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        });
        return `${date} ${time}`;
      })()
    : null;

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white">
      {/* Header — ligne 1 : titre + statut, ligne 2 : sélecteur de vue */}
      <header className="flex flex-shrink-0 flex-col border-b border-white/10">
        {/* Ligne 1 */}
        <div className="flex items-center gap-2 px-4 pt-2 pb-1">
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight tracking-tight">
              EPSI — EDT
            </h1>
          </div>

          {/* Statut + actions */}
          <div className="ml-auto flex items-center gap-2 text-xs">
            {isLoading && !courses.length && (
              <span className="text-white/40">Chargement…</span>
            )}
            {!isLoading && (
              <>
                <span
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${isOffline ? "bg-red-500" : "bg-green-500"}`}
                />
                <span className="whitespace-nowrap text-white/40">
                  {isOffline ? "Hors-ligne" : `Mis à jour ${updatedLabel}`}
                </span>
                <button
                  onClick={fetchCourses}
                  className="rounded border border-white/10 px-2 py-0.5 text-white/50 hover:bg-white/10 hover:text-white"
                  title="Rafraîchir"
                >
                  ↻
                </button>
              </>
            )}
            <button
              onClick={logout}
              className="rounded border border-white/10 px-2 py-0.5 text-white/40 hover:bg-red-950/40 hover:text-red-300"
              title="Se déconnecter"
            >
              ⏻
            </button>
          </div>
        </div>

        {/* Ligne 2 : sélecteur de vue */}
        <div className="px-4 pb-2 inline-flex justify-end">
          <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            {VIEWS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => changeView(key)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  view === key
                    ? "bg-blue-600 text-white shadow"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden p-3">
        {view === "day" && (
          <DayView
            courses={courses}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        )}
        {view === "week" && (
          <WeekCalendar
            courses={courses}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onViewChange={changeView}
          />
        )}
        {view === "month" && (
          <MonthView
            courses={courses}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onViewChange={changeView}
          />
        )}
        {view === "year" && (
          <YearView
            courses={courses}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onViewChange={changeView}
          />
        )}
      </main>
    </div>
  );
}
