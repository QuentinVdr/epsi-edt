"use client";

import { useState } from "react";
import { CourseModal } from "@/components/CourseModal";
import {
  courseColor,
  DAYS_SHORT,
  getCoursesForDay,
  isSameDay,
  MONTHS,
} from "@/lib/edt-utils";
import type { Course, ViewType } from "@/types/edt";

interface Props {
  courses: Course[];
  currentDate: Date;
  onDateChange: (d: Date) => void;
  onViewChange: (v: ViewType) => void;
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // 0=Sun → shift to Mon=0
  const startPad = (first.getDay() + 6) % 7;
  const days: (Date | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  // pad to full rows
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export function MonthView({
  courses,
  currentDate,
  onDateChange,
  onViewChange,
}: Props) {
  const [selected, setSelected] = useState<Course | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthDays(year, month);

  function prevMonth() {
    onDateChange(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    onDateChange(new Date(year, month + 1, 1));
  }

  return (
    <div className="flex h-full flex-col">
      {/* Nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm hover:bg-white/10"
        >
          ← Préc.
        </button>
        <div className="text-center">
          <p className="font-semibold">
            {MONTHS[month]} {year}
          </p>
          {(year !== today.getFullYear() || month !== today.getMonth()) && (
            <button
              onClick={() => onDateChange(today)}
              className="text-xs text-blue-400 hover:underline"
            >
              Ce mois-ci
            </button>
          )}
        </div>
        <button
          onClick={nextMonth}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm hover:bg-white/10"
        >
          Suiv. →
        </button>
      </div>

      {/* Grid */}
      <div className="flex flex-1 flex-col overflow-auto rounded-xl border border-white/10">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/10">
          {DAYS_SHORT.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-white/40"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid flex-1 grid-cols-7">
          {days.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="border-b border-r border-white/5"
                />
              );
            }
            const dayCourses = getCoursesForDay(courses, day);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, currentDate);
            const visible = dayCourses.slice(0, 4);
            const extra = dayCourses.length - 4;

            return (
              <button
                key={day.toISOString()}
                className={`flex min-h-[80px] flex-col border-b border-r border-white/5 p-1.5 text-left transition-colors hover:bg-white/5 ${isSelected ? "bg-white/5" : ""}`}
                onClick={() => {
                  onDateChange(day);
                  onViewChange("day");
                }}
              >
                {/* Date number */}
                <span
                  className={`mb-1 flex h-6 w-6 items-center justify-center self-end rounded-full text-xs font-semibold ${
                    isToday ? "bg-blue-500 text-white" : "text-white/70"
                  }`}
                >
                  {day.getDate()}
                </span>

                {/* Course dots / pills */}
                <div className="flex flex-wrap gap-0.5">
                  {visible.map((c) => (
                    <button
                      key={c.NoCours}
                      className="max-w-full truncate rounded px-1 py-0.5 text-[10px] leading-tight"
                      style={{
                        background: courseColor(c),
                        color:
                          (c.ColorRed * 299 +
                            c.ColorGreen * 587 +
                            c.ColorBlue * 114) /
                            1000 >
                          128
                            ? "#111"
                            : "#fff",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(c);
                      }}
                      title={c.Commentaire}
                    >
                      {c.Commentaire}
                    </button>
                  ))}
                  {extra > 0 && (
                    <span className="rounded px-1 py-0.5 text-[10px] text-white/40">
                      +{extra}
                    </span>
                  )}
                </div>
              </button>
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
