"use client";

import * as React from "react";
import { compareDesc, format, isWithinInterval } from "date-fns";
import { api } from "~/trpc/react";
import { cn, range } from "~/lib/utils";
import { CalendarSchema } from "~/lib/types";
import { z } from "zod";

const EVENT_COLORS = {
  admission: "bg-blue-500",
  registration: "bg-green-500",
  firstDayOfClasses: "bg-yellow-500",
  preliminaryExams: "bg-purple-500",
  midtermExams: "bg-pink-500",
  finalExams: "bg-red-500",
  lastRecitationDay: "bg-orange-500",
  deadlineForGradesSubmission: "bg-teal-500",
  postingOfGrades: "bg-cyan-500",
  holidays: "bg-gray-500",
};

const isDateInSchoolClasses = (
  date: Date,
  calendar: z.infer<typeof CalendarSchema>,
) => {
  const firstSemesterStart = calendar.firstDayOfClasses?.firstSemester;
  const firstSemesterEnd =
    calendar.finalExams?.firstSemester?.[0]?.date.sort(compareDesc)[0];
  const secondSemesterStart = calendar.firstDayOfClasses?.secondSemester;
  const secondSemesterEnd =
    calendar.finalExams?.secondSemester?.[0]?.date.sort(compareDesc)[0];

  if (firstSemesterStart && firstSemesterEnd) {
    if (
      isWithinInterval(date, {
        start: firstSemesterStart,
        end: firstSemesterEnd,
      })
    ) {
      return true;
    }
  }
  if (secondSemesterStart && secondSemesterEnd) {
    if (
      isWithinInterval(date, {
        start: secondSemesterStart,
        end: secondSemesterEnd,
      })
    ) {
      return true;
    }
  }
  return false;
};

const dateEvents = (
  date: Date,
  calendar: z.infer<typeof CalendarSchema>,
): string[] => {
  const events: string[] = [];

  // Check for admission events
  calendar.admission?.forEach((admission) => {
    if (
      admission.dates.firstSemester.some((d) => d.getTime() === date.getTime())
    ) {
      events.push("admission");
    }
    if (
      admission.dates.secondSemester.some((d) => d.getTime() === date.getTime())
    ) {
      events.push("admission");
    }
  });

  // Check for registration events
  calendar.registration?.forEach((registration) => {
    if (
      registration.dates.firstSemester.some(
        (d) => d.getTime() === date.getTime(),
      )
    ) {
      events.push("registration");
    }
    if (
      registration.dates.secondSemester.some(
        (d) => d.getTime() === date.getTime(),
      )
    ) {
      events.push("registration");
    }
  });

  // Check for first day of classes
  if (calendar.firstDayOfClasses?.firstSemester?.getTime() === date.getTime()) {
    events.push("firstDayOfClasses");
  }
  if (
    calendar.firstDayOfClasses?.secondSemester?.getTime() === date.getTime()
  ) {
    events.push("firstDayOfClasses");
  }

  // Check for preliminary exams
  calendar.preliminaryExams?.firstSemester.forEach((exam) => {
    if (exam.date.some((d) => d.getTime() === date.getTime())) {
      events.push("preliminaryExams");
    }
  });
  calendar.preliminaryExams?.secondSemester.forEach((exam) => {
    if (exam.date.some((d) => d.getTime() === date.getTime())) {
      events.push("preliminaryExams");
    }
  });

  // Check for midterm exams
  calendar.midtermExams?.firstSemester.forEach((exam) => {
    if (exam.date.some((d) => d.getTime() === date.getTime())) {
      events.push("midtermExams");
    }
  });
  calendar.midtermExams?.secondSemester.forEach((exam) => {
    if (exam.date.some((d) => d.getTime() === date.getTime())) {
      events.push("midtermExams");
    }
  });

  // Check for final exams
  calendar.finalExams?.firstSemester.forEach((exam) => {
    if (exam.date.some((d) => d.getTime() === date.getTime())) {
      events.push("finalExams");
    }
  });
  calendar.finalExams?.secondSemester.forEach((exam) => {
    if (exam.date.some((d) => d.getTime() === date.getTime())) {
      events.push("finalExams");
    }
  });

  // Check for last recitation day
  if (
    calendar.lastRecitationDay?.firstSemester?.some(
      (d) => d.getTime() === date.getTime(),
    )
  ) {
    events.push("lastRecitationDay");
  }
  if (
    calendar.lastRecitationDay?.secondSemester?.some(
      (d) => d.getTime() === date.getTime(),
    )
  ) {
    events.push("lastRecitationDay");
  }

  // Check for posting of grades
  if (
    calendar.postingOfGrades?.firstSemester?.getTime() === date.getTime()
  ) {
    events.push("postingOfGrades");
  }
  if (
    calendar.postingOfGrades?.secondSemester?.getTime() === date.getTime()
  ) {
    events.push("postingOfGrades");
  }

  // Check for holidays
  calendar.holidays?.forEach((holiday) => {
    if (holiday.date.some((d) => d.getTime() === date.getTime())) {
      events.push("holidays");
    }
  });

  return events;
};

function Month({
  year,
  month,
  calendar,
  className,
}: {
  year: number;
  month: number;
  calendar: z.infer<typeof CalendarSchema>;
  className?: string;
}) {
  const date = new Date(year, month - 1, 1);
  const firstDayIndex = date.getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const totalDays = new Date(year, month, 0).getDate();

  return (
    <div
      className={cn(
        "border-border bg-foreground/5 w-fit rounded-lg border",
        className,
      )}
    >
      {/* Month Title */}
      <div className="w-full p-2 text-center font-medium">
        {format(date, "MMMM")}
      </div>

      {/* Days of the week header */}
      <div className="grid grid-cols-7">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <div
            key={day}
            className="text-foreground/70 flex h-8 w-full items-center justify-center text-xs font-light md:text-sm"
          >
            <span>{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 p-2">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square h-6 w-auto md:h-8" />
        ))}

        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
          <div
            key={day}
            className="group relative flex aspect-square h-6 w-auto cursor-pointer items-center justify-center text-xs transition md:h-8 md:text-sm"
          >
            <div
              className={cn(
                "z-2",
                isDateInSchoolClasses(new Date(year, month - 1, day), calendar)
                  ? "opacity-100"
                  : "opacity-50",
              )}
            >
              {day}
            </div>

            {/* Event Background */}
            <div className="absolute bottom-0 left-1/2 flex w-full -translate-x-1/2 justify-center gap-0.5">
              {dateEvents(new Date(year, month - 1, day), calendar).length >
                0 && (
                <div
                  className={cn(
                    "w-1 h-1 rounded-full opacity-50",
                    ...dateEvents(new Date(year, month - 1, day), calendar).map(
                      (event) =>
                        EVENT_COLORS[event as keyof typeof EVENT_COLORS] ||
                        "bg-gray-500",
                    ),
                  )}
                />
              )}
              {/* <div
                className={cn(
                  "w-1 h-1 rounded-full opacity-50",
                  "bg-gray-500",
                  )
                }
              /> */}
            </div>

            {/* Hover Background */}
            <div className="bg-foreground/5 absolute top-0 left-1/2 aspect-square h-full w-auto -translate-x-1/2 rounded-lg opacity-0 transition-opacity duration-100 group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Calendar() {
  const [calendar] = api.calendar.get.useSuspenseQuery();

  const startDate =
    calendar.admission?.[0]?.dates.firstSemester?.sort(compareDesc)[0];
  const startMonth = startDate ? startDate.getMonth() : 1;

  console.log(calendar.postingOfGrades?.firstSemester);

  return (
    <>
      <h2 className="text-2xl font-bold">{calendar.title}</h2>
      <p className="text-lg">
        Academic Year: {calendar.years.start} - {calendar.years.end}
      </p>

      <div className="w-full max-w-4xl">
        <h3 className="p-4 text-center text-xl">{calendar.years.start}</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {
            // month loop
            Array.from(range(Math.max(startMonth - 3, 1), 12)).map((month) => (
              <Month
                key={month}
                year={calendar.years.start}
                month={month}
                calendar={calendar}
              />
            ))
          }
        </div>
      </div>
    </>
  );
}
