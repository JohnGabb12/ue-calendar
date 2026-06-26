"use client";

import * as React from "react";
import { format } from "date-fns";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";

function Month({
  year,
  month,
  className,
}: {
  year: number;
  month: number;
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
            className="text-foreground/70 flex h-8 w-full items-center justify-center text-sm font-light"
          >
            <span>{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 p-2">
        {/* 1. Render empty grid items for padding */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8 w-full" />
        ))}

        {/* 2. Render actual days of the month */}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
          <div
            key={day}
            className="group relative flex h-8 w-full cursor-pointer items-center justify-center text-sm transition"
          >
            <div className="z-2">{day}</div>
            <div className="bg-foreground/5 absolute top-0 left-1/2 aspect-square h-full w-auto -translate-x-1/2 rounded-lg opacity-0 transition-opacity duration-100 group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Calendar() {
  const [calendar] = api.calendar.get.useSuspenseQuery();

  return (
    <>
      <h2 className="text-2xl font-bold">{calendar.title}</h2>
      <p className="text-lg">
        Academic Year: {calendar.years.start} - {calendar.years.end}
      </p>

      <div className="grid w-full max-w-4xl grid-cols-3 gap-4">
        {
          // month loop
          Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
            <Month key={month} year={calendar.years.start} month={month} />
          ))
        }
      </div>
    </>
  );
}
