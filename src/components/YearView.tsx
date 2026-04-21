"use client";

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
  const startPad = (first.getDay() + 6) % 7;
  const days: (Date | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

interface MiniMonthProps {
  year: number;
  month: number;
  courses: Course[];
  today: Date;
  currentDate: Date;
  onDayClick: (d: Date) => void;
  onMonthClick: () => void;
}

function MiniMonth({
  year,
  month,
  courses,
  today,
  currentDate,
  onDayClick,
  onMonthClick,
}: MiniMonthProps) {
  const days = getMonthDays(year, month);
  const isCurrentMonth =
    currentDate.getFullYear() === year && currentDate.getMonth() === month;

  return (
    <div
      className={`rounded-xl border p-3 transition-colors hover:bg-white/5 ${isCurrentMonth ? "border-blue-500/50 bg-blue-600/5" : "border-white/10"}`}
    >
      <button
        className="mb-2 w-full text-left text-sm font-semibold hover:text-blue-300"
        onClick={onMonthClick}
      >
        {MONTHS[month]}
      </button>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAYS_SHORT.map((d) => (
          <div
            key={d}
            className="text-center text-[9px] font-medium text-white/30"
          >
            {d[0]}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-2">
        {days.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;

          const dayCourses = getCoursesForDay(courses, day);
          const isToday = isSameDay(day, today);
          const hasCourses = dayCourses.length > 0;
          // Dominant color = first course color
          const dotColor = hasCourses ? courseColor(dayCourses[0]) : null;

          return (
            <button
              key={day.toISOString()}
              className={`flex items-center justify-center rounded py-0.5 text-[10px] leading-none transition-colors hover:bg-white/10 ${isToday ? "font-bold text-blue-300" : "text-white/60"}`}
              style={
                hasCourses
                  ? { borderBottom: `2px solid ${dotColor ?? "#fff"}` }
                  : undefined
              }
              onClick={() => onDayClick(day)}
              title={hasCourses ? `${dayCourses.length} cours` : undefined}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function YearView({
  courses,
  currentDate,
  onDateChange,
  onViewChange,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentDate.getFullYear();

  return (
    <div className="flex h-full flex-col">
      {/* Nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() =>
            onDateChange(new Date(year - 1, currentDate.getMonth(), 1))
          }
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm hover:bg-white/10"
        >
          ← Préc.
        </button>
        <div className="text-center">
          <p className="font-semibold">{year}</p>
          {year !== today.getFullYear() && (
            <button
              onClick={() => onDateChange(today)}
              className="text-xs text-blue-400 hover:underline"
            >
              Cette année
            </button>
          )}
        </div>
        <button
          onClick={() =>
            onDateChange(new Date(year + 1, currentDate.getMonth(), 1))
          }
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm hover:bg-white/10"
        >
          Suiv. →
        </button>
      </div>

      {/* 12-month grid */}
      <div className="grid grid-cols-2 gap-3 overflow-auto sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }, (_, m) => (
          <MiniMonth
            key={m}
            year={year}
            month={m}
            courses={courses}
            today={today}
            currentDate={currentDate}
            onDayClick={(d) => {
              onDateChange(d);
              onViewChange("day");
            }}
            onMonthClick={() => {
              onDateChange(new Date(year, m, 1));
              onViewChange("month");
            }}
          />
        ))}
      </div>
    </div>
  );
}
