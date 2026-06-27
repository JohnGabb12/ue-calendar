"use client";

import * as React from "react";
import {
  compareAsc,
  compareDesc,
  format,
  isWithinInterval,
  isEqual,
} from "date-fns";
import { api } from "~/trpc/react";
import { cn, range } from "~/lib/utils";
import { CalendarSchema } from "~/lib/types";
import { z } from "zod";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";

const EVENT_CATEGORIES = [
  { name: "admission", color: "bg-blue-500" },
  { name: "registration", color: "bg-green-500" },
  { name: "classes", color: "bg-yellow-500" },
  { name: "prelim", color: "bg-purple-500" },
  { name: "midterm", color: "bg-pink-500" },
  { name: "final", color: "bg-red-500" },
  { name: "grades", color: "bg-cyan-500" },
  { name: "holidays", color: "bg-gray-500" },

  // summer
  { name: "summer-admission", color: "bg-blue-800" },
  { name: "summer-registration", color: "bg-green-800" },
  { name: "summer-classes", color: "bg-yellow-800" },
  { name: "summer-midterm", color: "bg-pink-800" },
  { name: "summer-final", color: "bg-red-800" },
  { name: "summer-grades", color: "bg-cyan-800" },
];

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
  const summerClassesStart = calendar.summerClasses?.firstDayOfClasses?.[0];
  const summerClassesEnd =
    calendar.summerClasses?.finalExams?.sort(compareDesc)[0];

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
  if (summerClassesStart && summerClassesEnd) {
    if (
      isWithinInterval(date, {
        start: summerClassesStart,
        end: summerClassesEnd,
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
): Set<{ name: string; category: string }> => {
  // Use a Set to store unique event string identifiers automatically
  const events = new Set<{ name: string; category: string }>();
  const targetTime = date.getTime(); // Cache this to avoid repetitive calls
  const classType = date.getDay() === 1 || date.getDay() === 3 ? "MW"
    : date.getDay() === 2 || date.getDay() === 4 ? "TTh"
    : date.getDay() === 5 ? "Fri"
    : date.getDay() === 6 ? "Sat" : "TBD";

  // Check for admission events
  calendar.admission?.forEach((admission) => {
    if (
      isEqual(
        admission.dates.firstSemester?.sort(compareAsc)[0] as Date,
        date,
      ) ||
      (isEqual(
        admission.dates.secondSemester?.sort(compareAsc)[0] as Date,
        date,
      ) &&
        ![...events].some((e) => e.name === admission.name + " Admission start date"))
    ) {
      events.add({ name: admission.name + " Admission start date", category: "admission" });
    }
  });

  // Check for registration events
  calendar.registration?.forEach((registration) => {
    if (
      (isEqual(
        registration.dates.firstSemester?.sort(compareAsc)[0] as Date,
        date,
      ) ||
        isEqual(
          registration.dates.secondSemester?.sort(compareAsc)[0] as Date,
          date,
        )) &&
      ![...events].some((e) => e.name === registration.name + " Registration start date")
    ) {
      events.add({ name: registration.name + " Registration start date", category: "registration" });
    }
  });

  // Check for first day of classes
  if (calendar.firstDayOfClasses?.firstSemester?.getTime() === targetTime) {
    events.add({ name: "First Day of Classes", category: "classes" });
  }
  if (calendar.firstDayOfClasses?.secondSemester?.getTime() === targetTime) {
    events.add({ name: "First Day of Classes", category: "classes" });
  }

  // Check for preliminary exams
  calendar.preliminaryExams?.firstSemester.forEach((exam) => {
    if (
      exam.date.some((d) => isEqual(d, date)) &&
      ![...events].some((e) => e.name === `${classType} First Semester Preliminary Exams`)
    ) {
      events.add({ name: `${classType} First Semester Preliminary Exams`, category: "prelim" });
    }
  });
  calendar.preliminaryExams?.secondSemester.forEach((exam) => {
    if (
      exam.date.some((d) => isEqual(d, date)) &&
      ![...events].some((e) => e.name === `${classType} Second Semester Preliminary Exams`)
    ) {
      events.add({ name: `${classType} Second Semester Preliminary Exams`, category: "prelim" });
    }
  });

  // Check for midterm exams
  calendar.midtermExams?.firstSemester.forEach((exam) => {
    if (
      exam.date.some((d) => isEqual(d, date)) &&
      ![...events].some((e) => e.name === `(${classType}) First Semester Midterm Exams`)
    ) {
      events.add({ name: `(${classType}) First Semester Midterm Exams`, category: "midterm" });
    }
  });
  calendar.midtermExams?.secondSemester.forEach((exam) => {
    if (
      exam.date.some((d) => isEqual(d, date)) &&
      ![...events].some((e) => e.name === `(${classType}) Second Semester Midterm Exams`)
    ) {
      events.add({ name: `(${classType}) Second Semester Midterm Exams`, category: "midterm" });
    }
  });

  // Check for final exams
  calendar.finalExams?.firstSemester.forEach((exam) => {
    if (
      exam.date.some((d) => isEqual(d, date)) &&
      ![...events].some((e) => e.name === `(${classType}) First Semester Final Exams`)
    ) {
      events.add({ name: `(${classType}) First Semester Final Exams`, category: "final" });
    }
  });
  calendar.finalExams?.secondSemester.forEach((exam) => {
    if (
      exam.date.some((d) => isEqual(d, date)) &&
      ![...events].some((e) => e.name === `(${classType}) Second Semester Final Exams`)
    ) {
      events.add({ name: `(${classType}) Second Semester Final Exams`, category: "final" });
    }
  });

  // Check for last recitation day
  if (
    calendar.lastRecitationDay?.firstSemester?.some((d) => isEqual(d, date))
  ) {
    events.add({ name: "Last Recitation Day", category: "classes" });
  }
  if (
    calendar.lastRecitationDay?.secondSemester?.some((d) => isEqual(d, date))
  ) {
    events.add({ name: "Last Recitation Day", category: "classes" });
  }

  // Check for posting of grades
  if (calendar.postingOfGrades?.firstSemester?.getTime() === targetTime) {
    events.add({ name: "Posting of Grades", category: "grades" });
  }
  if (calendar.postingOfGrades?.secondSemester?.getTime() === targetTime) {
    events.add({ name: "Posting of Grades", category: "grades" });
  }

  // Check for summer classes
  if (
    calendar.summerClasses?.firstDayOfClasses?.some((d) => isEqual(d, date))
  ) {
    events.add({
      name: "First Day of Summer Classes",
      category: "summer-classes",
    });
  }

  // Check for summer exams
  if (calendar.summerClasses?.midtermExams?.some((d) => isEqual(d, date))) {
    events.add({
      name: "Midterm Exams for Summer Classes",
      category: "summer-midterm",
    });
  }
  if (calendar.summerClasses?.finalExams?.some((d) => isEqual(d, date))) {
    events.add({
      name: "Final Exams for Summer Classes",
      category: "summer-final",
    });
  }

  // Check for last recitation day for summer classes
  if (
    calendar.summerClasses?.lastRecitationDay?.some((d) => isEqual(d, date))
  ) {
    events.add({
      name: "Last Recitation Day for Summer Classes",
      category: "summer-classes",
    });
  }

  // Check for deadline grades
  if (
    calendar.summerClasses?.deadlineForGradesSubmission?.some((d) =>
      isEqual(d, date),
    )
  ) {
    events.add({
      name: "Deadline for Grades Submission for Summer Classes",
      category: "summer-grades",
    });
  }

  // Check for summer admission and registration
  calendar.summerClasses?.admission?.forEach((admission) => {
    if (
      isEqual(admission.dates?.sort(compareAsc)[0] as Date, date) &&
      ![...events].some((e) => e.name === admission.name + " Summer Admission start date")
    ) {
      events.add({ name: admission.name + " Summer Admission start date", category: "summer-admission" });
    }
  });

  calendar.summerClasses?.registration?.forEach((registration) => {
    if (
      isEqual(registration.dates?.sort(compareAsc)[0] as Date, date) &&
      ![...events].some((e) => e.name === registration.name + " Summer Registration start date")
    ) {
      events.add({ name: registration.name + " Summer Registration start date", category: "summer-registration" });
    }
  });

  // Check for holidays
  calendar.holidays?.forEach((holiday) => {
    if (holiday.date.some((d) => d.getTime() === targetTime)) {
      events.add({ name: "Holidays", category: "holidays" });
    }
  });

  // Convert the Set back to an array before returning
  return events;
};

function Day({
  date,
  calendar,
  className,
}: {
  date: Date;
  calendar: z.infer<typeof CalendarSchema>;
  className?: string;
}) {
  const events = dateEvents(date, calendar);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          className={cn(
            "group relative flex aspect-square h-6 w-auto cursor-pointer items-center justify-center text-xs transition md:h-8 md:text-sm",
            className,
          )}
        >
          <div
            className={cn(
              "z-2",
              isDateInSchoolClasses(date, calendar)
                ? "opacity-100"
                : "opacity-50",
              date.getDay() === 0 ? "text-foreground/50" : "text-foreground",
            )}
          >
            {date.getDate()}
          </div>

          {/* Event Background */}
          <div className="absolute bottom-0 left-1/2 flex w-14/15 -translate-x-1/2 flex-row justify-center gap-0.5">
            {Array.from(events).map((event) => (
              <div
                key={format(date, "yyyy-MM-dd") + event.name}
                className={cn(
                  "h-1 grow rounded-full opacity-50",
                  EVENT_CATEGORIES.find((cat) => cat.name === event.category)
                    ?.color || "bg-gray-500",
                )}
              />
            ))}
          </div>

          {/* Hover Background */}
          <div className="bg-foreground/5 absolute top-0 left-1/2 aspect-square h-full w-auto -translate-x-1/2 scale-80 rounded-lg opacity-0 transition-all duration-100 group-hover:scale-100 group-hover:opacity-100" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-80" hidden={events.size === 0}>
        <div className="flex flex-col gap-2">
          <div className="text-center text-sm font-medium">
            {format(date, "MMMM dd, yyyy")}
          </div>
          <div className="flex flex-col gap-1">
            {Array.from(events).map((event) => (
              <div
                key={format(date, "yyyy-MM-dd") + event.name}
                className="flex items-center gap-2 w-full relative"
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    EVENT_CATEGORIES.find((cat) => cat.name === event.category)
                      ?.color || "bg-gray-500",
                  )}
                />
                <p className="text-sm w-full">{event.name}</p>
              </div>
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

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
        "border-border bg-foreground/5 w-fit rounded-3xl border",
        className,
      )}
    >
      {/* Month Title */}
      <div className="w-full p-2 text-center font-medium">
        {format(date, "MMMM")}
      </div>

      {/* Days of the week header */}
      <div className="mx-auto grid w-fit grid-cols-7">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <div
            key={day}
            className="text-foreground/70 flex aspect-square h-6 w-auto items-center justify-center text-xs font-light md:h-8 md:text-sm"
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
          <Day
            key={day}
            date={new Date(year, month - 1, day)}
            calendar={calendar}
          />
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

  console.log(calendar);

  return (
    <>
      <h2 className="text-center text-2xl font-bold">{calendar.title}</h2>
      <p className="text-center text-lg">
        Academic Year: {calendar.years.start} - {calendar.years.end}
      </p>

      <div className="w-full max-w-4xl">
        <h3 className="p-4 text-center text-xl">{calendar.years.start}</h3>
        <div className="mx-auto mb-8 grid w-fit grid-cols-2 gap-4 md:grid-cols-3">
          {
            // month loop
            Array.from(range(1, 12)).map((month) => (
              <Month
                key={month}
                year={calendar.years.start}
                month={month}
                calendar={calendar}
              />
            ))
          }
        </div>
        <h3 className="p-4 text-center text-xl">{calendar.years.end}</h3>
        <div className="mx-auto grid w-fit grid-cols-2 gap-4 md:grid-cols-3">
          {
            // month loop
            Array.from(range(1, 12)).map((month) => (
              <Month
                key={month}
                year={calendar.years.end}
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
