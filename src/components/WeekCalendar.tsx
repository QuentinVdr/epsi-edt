"use client";

import { CourseModal } from "@/components/CourseModal";
import {
  addDays,
  courseColor,
  DAYS_LONG,
  formatCourseTime,
  getCoursesForDay,
  getHourRange,
  getMondayOf,
  isSameDay,
  positionCourse,
  PX_PER_HOUR,
} from "@/lib/edt-utils";
import type { Course } from "@/types/edt";
import { useState } from "react";

interface Props {
  courses: Course[];
  currentDate: Date;
  onDateChange: (d: Date) => void;
  onViewChange: (v: "day") => void;
}

export function WeekCalendar({
  courses,
  currentDate,
  onDateChange,
  onViewChange,
}: Props) {
  const [selected, setSelected] = useState<Course | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = getMondayOf(currentDate);
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(monday, i));

  const weekCourses = weekDays.flatMap((d) => getCoursesForDay(courses, d));
  const { hourStart, hourEnd } = getHourRange(weekCourses);
  const hours = Array.from(
    { length: hourEnd - hourStart + 1 },
    (_, i) => hourStart + i,
  );

  const weekLabel = `${weekDays[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${weekDays[4].toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="flex h-full flex-col">
      {/* Nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => onDateChange(addDays(currentDate, -7))}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm hover:bg-white/10"
        >
          ← Préc.
        </button>
        <div className="text-center">
          <p className="font-semibold">{weekLabel}</p>
          {!isSameDay(getMondayOf(currentDate), getMondayOf(today)) && (
            <button
              onClick={() => onDateChange(today)}
              className="text-xs text-blue-400 hover:underline"
            >
              Aujourd'hui
            </button>
          )}
        </div>
        <button
          onClick={() => onDateChange(addDays(currentDate, 7))}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm hover:bg-white/10"
        >
          Suiv. →
        </button>
      </div>

      {/* Grid */}
      <div className="relative flex flex-col flex-1 overflow-auto rounded-xl border border-white/10">
        {/* sticky header row */}
        <div className="sticky top-0 z-20 flex w-full min-w-full">
          {/* corner */}
          <div className="sticky left-0 z-30 w-8 md:w-14 flex-shrink-0 border-b border-r border-white/10 bg-zinc-950" />
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <button
                key={day.toISOString()}
                className={`flex h-12 flex-1 flex-col items-center justify-center border-b border-r border-white/10 text-xs font-semibold transition-colors hover:bg-white/5 last:border-r-0 ${isToday ? "bg-blue-600/20 text-blue-300" : "text-white/60"}`}
                onClick={() => {
                  onDateChange(day);
                  onViewChange("day");
                }}
              >
                <span>{DAYS_LONG[i]}</span>
                <span
                  className={`text-base font-bold leading-none ${isToday ? "text-blue-300" : "text-white"}`}
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* scrollable body */}
        <div className="flex w-full min-w-full">
          {/* Hour gutter */}
          <div
            className="relative sticky left-0 z-10 w-8 md:w-14 flex-shrink-0 border-r border-white/10 bg-zinc-950"
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

          {/* Day columns */}
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            const dayCourses = getCoursesForDay(courses, day);
            return (
              <div
                key={day.toISOString()}
                className={`relative flex-1 border-r border-white/10 last:border-r-0 ${isToday ? "bg-blue-600/5" : ""}`}
                style={{ height: (hourEnd - hourStart) * PX_PER_HOUR }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-white/5"
                    style={{ top: (h - hourStart) * PX_PER_HOUR }}
                  />
                ))}
                {dayCourses.map((course) => {
                  const { top, height } = positionCourse(course, hourStart);
                  const bg = courseColor(course);
                  return (
                    <button
                      key={course.NoCours}
                      className="absolute inset-x-0.5 overflow-hidden rounded-md px-1.5 py-1 text-left text-xs transition-all hover:z-10 hover:scale-[1.02]"
                      style={{
                        top,
                        height,
                        background: bg,
                        color: "#111",
                      }}
                      onClick={() => setSelected(course)}
                    >
                      <p className="truncate font-semibold leading-tight">
                        {course.Commentaire}
                      </p>
                      <p className="truncate opacity-75">
                        {formatCourseTime(course.Start)}–
                        {formatCourseTime(course.End)}
                      </p>
                      <p className="truncate opacity-60">
                        {course.NomProf ?? "Autonomie i guess"}
                      </p>
                      {course.Salles && (
                        <p className="truncate opacity-60">{course.Salles}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <CourseModal course={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
