"use client";

import * as React from "react";
import { compareDesc, format, isWithinInterval } from "date-fns";
import { api } from "~/trpc/react";
import { cn, range } from "~/lib/utils";
import { CalendarSchema } from "~/lib/types";
import { z } from "zod";

const EVENT_COLORS = {
  "admission": "bg-blue-500",
  "registration": "bg-green-500",
  "firstDayOfClasses": "bg-yellow-500",
  "preliminaryExams": "bg-purple-500",
  "midtermExams": "bg-pink-500",
  "finalExams": "bg-red-500",
  "lastRecitationDay": "bg-orange-500",
  "deadlineForGradesSubmission": "bg-teal-500",
  "postingOfGrades": "bg-cyan-500",
  "holidays": "bg-gray-500",
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
        "border-border bg-foreground/5 w-full rounded-lg border",
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
            className="text-foreground/70 flex h-8 w-full items-center justify-center text-xs md:text-sm font-light"
          >
            <span>{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 p-2">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="h-6 md:h-8 w-full" />
        ))}

        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
          <div
            key={day}
            className="group relative flex h-6 md:h-8 w-full cursor-pointer items-center justify-center text-xs md:text-sm transition"
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
            <div className="bg-foreground/5 absolute top-0 left-1/2 aspect-square h-full w-auto -translate-x-1/2 rounded-lg opacity-0 transition-opacity duration-100 group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Calendar() {
  const [calendar] = api.calendar.get.useSuspenseQuery();

  const startDate = calendar.admission?.[0]?.dates.firstSemester?.sort(compareDesc)[0];
  const startMonth = startDate ? startDate.getMonth() : 1;
  

  return (
    <>
      <h2 className="text-2xl font-bold">{calendar.title}</h2>
      <p className="text-lg">
        Academic Year: {calendar.years.start} - {calendar.years.end}
      </p>

      <div className="w-full max-w-4xl">
        <h3 className="text-xl text-center p-4">{calendar.years.start}</h3>
        <div className="grid md:grid-cols-3 gap-4 grid-cols-2">
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
