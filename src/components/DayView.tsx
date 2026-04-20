"use client";

import { useState } from "react";
import { CourseModal } from "@/components/CourseModal";
import {
  addDays,
  courseColor,
  DAYS_LONG,
  formatCourseTime,
  getCoursesForDay,
  getHourRange,
  isLight,
  isSameDay,
  PX_PER_HOUR,
  positionCourse,
} from "@/lib/edt-utils";
import type { Course } from "@/types/edt";

interface Props {
  courses: Course[];
  currentDate: Date;
  onDateChange: (d: Date) => void;
}

export function DayView({ courses, currentDate, onDateChange }: Props) {
  const [selected, setSelected] = useState<Course | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayName = DAYS_LONG[(currentDate.getDay() + 6) % 7];
  const isToday = isSameDay(currentDate, today);
  const dayCourses = getCoursesForDay(courses, currentDate);

  const { hourStart, hourEnd } = getHourRange(dayCourses);
  const hours = Array.from(
    { length: hourEnd - hourStart + 1 },
    (_, i) => hourStart + i,
  );

  const label = currentDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex h-full flex-col">
      {/* Nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => onDateChange(addDays(currentDate, -1))}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm hover:bg-white/10"
        >
          ← Préc.
        </button>
        <div className="text-center">
          <p className="font-semibold capitalize">{label}</p>
          {!isToday && (
            <button
              onClick={() => onDateChange(today)}
              className="text-xs text-blue-400 hover:underline"
            >
              Aujourd'hui
            </button>
          )}
        </div>
        <button
          onClick={() => onDateChange(addDays(currentDate, 1))}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm hover:bg-white/10"
        >
          Suiv. →
        </button>
      </div>

      {/* Grid */}
      <div className="relative flex flex-col flex-1 overflow-auto rounded-xl border border-white/10">
        {/* sticky header row */}
        <div className="sticky top-0 z-20 flex w-full min-w-full">
          <div
            className={`sticky left-0 z-30 flex w-14 flex-shrink-0 items-center justify-center border-b border-r border-white/10 bg-zinc-950 text-xs font-bold ${isToday ? "text-blue-300" : "text-white/50"}`}
          >
            {dayName.slice(0, 3)}
          </div>
          <div
            className={`flex h-12 flex-1 items-center justify-center border-b border-white/10 text-2xl font-bold ${isToday ? "bg-blue-600/20 text-blue-300" : "text-white"}`}
          >
            {currentDate.getDate()}
          </div>
        </div>

        {/* scrollable body */}
        <div className="flex w-full min-w-full">
          {/* Hour gutter */}
          <div
            className="relative sticky left-0 z-10 w-14 flex-shrink-0 border-r border-white/10 bg-zinc-950"
            style={{ height: (hourEnd - hourStart) * PX_PER_HOUR }}
          >
            {hours.map((h) => (
              <div
                key={h}
                className="absolute w-full border-t border-white/10 pr-2 text-right text-xs text-white/40"
                style={{ top: (h - hourStart) * PX_PER_HOUR }}
              >
                {h}h
              </div>
            ))}
          </div>

          {/* Single day column */}
          <div
            className="relative flex-1"
            style={{ height: (hourEnd - hourStart) * PX_PER_HOUR }}
          >
            {hours.map((h) => (
              <div
                key={h}
                className="absolute w-full border-t border-white/5"
                style={{ top: (h - hourStart) * PX_PER_HOUR }}
              />
            ))}

            {dayCourses.length === 0 && (
              <div className="flex h-full items-center justify-center text-sm text-white/30">
                Aucun cours ce jour
              </div>
            )}

            {dayCourses.map((course) => {
              const { top, height } = positionCourse(course, hourStart);
              const bg = courseColor(course);
              const light = isLight(
                course.ColorRed,
                course.ColorGreen,
                course.ColorBlue,
              );
              return (
                <button
                  key={course.NoCours}
                  className="absolute inset-x-2 overflow-hidden rounded-lg px-3 py-2 text-left text-sm transition-all hover:z-10 hover:scale-[1.01]"
                  style={{
                    top,
                    height,
                    background: bg,
                    color: light ? "#111" : "#fff",
                  }}
                  onClick={() => setSelected(course)}
                >
                  <p className="font-semibold leading-tight">
                    {course.Commentaire}
                  </p>
                  {course.NomProf && (
                    <p className="opacity-60">{course.NomProf}</p>
                  )}
                  {course.Salles && (
                    <p className="opacity-60">{course.Salles}</p>
                  )}
                  <p className="mt-0.5 opacity-75">
                    {formatCourseTime(course.Start)} –{" "}
                    {formatCourseTime(course.End)} ({course.Duree}h)
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <CourseModal course={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
