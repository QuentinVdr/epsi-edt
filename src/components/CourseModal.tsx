"use client";

import { courseColor, formatCourseTime, isLight } from "@/lib/edt-utils";
import type { Course } from "@/types/edt";

export function CourseModal({
  course,
  onClose,
}: {
  course: Course;
  onClose: () => void;
}) {
  const bg = courseColor(course);
  const light = isLight(course.ColorRed, course.ColorGreen, course.ColorBlue);
  const text = light ? "#111" : "#fff";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: bg, color: text }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 text-xl font-bold opacity-60 hover:opacity-100"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="mb-1 pr-6 text-lg font-bold leading-tight">
          {course.Commentaire}
        </h2>
        {course.Matiere !== "COMMENTAIRE" &&
          course.Matiere !== course.Commentaire && (
            <p className="mb-4 text-sm opacity-70">{course.Matiere}</p>
          )}

        <div className="mt-3 space-y-2 text-sm">
          <Row icon="🕐">
            {formatCourseTime(course.Start)} – {formatCourseTime(course.End)} (
            {course.Duree}h)
          </Row>
          {course.Salles && <Row icon="📍">{course.Salles}</Row>}
          {course.NomProf && <Row icon="👤">{course.NomProf}</Row>}
          <Row icon="🏫">{course.CoursMixteInfoBulle}</Row>
          {course.TeamsUrl && (
            <a
              href={course.TeamsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block rounded-xl bg-white/20 px-4 py-2 text-center font-medium hover:bg-white/30"
            >
              Rejoindre Teams
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="opacity-50">{icon}</span>
      <span>{children}</span>
    </div>
  );
}
