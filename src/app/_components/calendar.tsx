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
  { name: "admission-first-day", color: "bg-blue-500", visible: true },
  { name: "admission-day", color: "bg-blue-500", visible: false },
  { name: "registration-first-day", color: "bg-green-500", visible: true },
  { name: "registration-day", color: "bg-green-500", visible: false },
  { name: "classes", color: "bg-yellow-500", visible: true },
  { name: "prelim", color: "bg-purple-500", visible: true },
  { name: "midterm", color: "bg-pink-500", visible: true },
  { name: "final", color: "bg-red-500", visible: true },
  { name: "grades", color: "bg-cyan-500", visible: true },
  { name: "holidays", color: "bg-gray-500", visible: true },

  // summer
  { name: "summer-admission-day", color: "bg-blue-800", visible: false },
  { name: "summer-admission-first-day", color: "bg-blue-800", visible: true },
  { name: "summer-registration-day", color: "bg-green-800", visible: false },
  {
    name: "summer-registration-first-day",
    color: "bg-green-800",
    visible: true,
  },
  { name: "summer-classes", color: "bg-yellow-800", visible: true },
  { name: "summer-midterm", color: "bg-pink-800", visible: true },
  { name: "summer-final", color: "bg-red-800", visible: true },
  { name: "summer-grades", color: "bg-cyan-800", visible: true },
];

const SELECTABLE_EVENTS = [];

const isEventInEventCategories = (eventCategoryName: string) => {
  // Check if the event name contains any of the category names
  return EVENT_CATEGORIES.some((category) =>
    eventCategoryName.includes(category.name),
  );
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
  const classType =
    date.getDay() === 1 || date.getDay() === 3
      ? "MW"
      : date.getDay() === 2 || date.getDay() === 4
        ? "TTh"
        : date.getDay() === 5
          ? "Fri"
          : date.getDay() === 6
            ? "Sat"
            : "TBD";

  // helpers thing
  const alreadyAdded = (eventName: string) =>
    [...events].some((e) => e.name === eventName);
  const addEvent = (eventName: string, category: string) => {
    if (!alreadyAdded(eventName)) {
      events.add({ name: eventName, category });
    }
  };

  // Check for admission events
  calendar.admission?.forEach((admission) => {
    const firstSem = {
      asc: admission.dates.firstSemester?.sort(compareAsc)[0] as Date,
      desc: admission.dates.firstSemester?.sort(compareDesc)[0] as Date,
    };
    const secondSem = {
      asc: admission.dates.secondSemester?.sort(compareAsc)[0] as Date,
      desc: admission.dates.secondSemester?.sort(compareDesc)[0] as Date,
    };

    // in admission range
    if (
      isWithinInterval(date, {
        start: firstSem.asc,
        end: firstSem.desc,
      }) ||
      isWithinInterval(date, {
        start: secondSem.asc,
        end: secondSem.desc,
      })
    )
      addEvent(admission.name + " Admission", "admission-day");

    // first day of admission
    if (isEqual(firstSem.asc, date) || isEqual(secondSem.asc, date))
      addEvent(admission.name + " Admission start date", "admission-first-day");
  });

  // Check for registration events
  calendar.registration?.forEach((registration) => {
    const firstSem = {
      asc: registration.dates.firstSemester?.sort(compareAsc)[0] as Date,
      desc: registration.dates.firstSemester?.sort(compareDesc)[0] as Date,
    };
    const secondSem = {
      asc: registration.dates.secondSemester?.sort(compareAsc)[0] as Date,
      desc: registration.dates.secondSemester?.sort(compareDesc)[0] as Date,
    };

    // in registration range
    if (
      isWithinInterval(date, {
        start: firstSem.asc,
        end: firstSem.desc,
      }) ||
      isWithinInterval(date, {
        start: secondSem.asc,
        end: secondSem.desc,
      })
    )
      addEvent(registration.name + " Registration", "registration-day");

    // first day of registration
    if (isEqual(firstSem.asc, date) || isEqual(secondSem.asc, date))
      addEvent(
        registration.name + " Registration start date",
        "registration-first-day",
      );
  });

  // Check for first day of classes
  if (isEqual(calendar.firstDayOfClasses?.firstSemester as Date, date))
    addEvent("First Day of First Semester", "classes");
  if (isEqual(calendar.firstDayOfClasses?.secondSemester as Date, date))
    addEvent("First Day of Second Semester", "classes");

  // Check for preliminary exams
  calendar.preliminaryExams?.firstSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) First Semester Preliminary Exams`, "prelim");
  });
  calendar.preliminaryExams?.secondSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) Second Semester Preliminary Exams`, "prelim");
  });

  // Check for midterm exams
  calendar.midtermExams?.firstSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) First Semester Midterm Exams`, "midterm");
  });
  calendar.midtermExams?.secondSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) Second Semester Midterm Exams`, "midterm");
  });

  // Check for final exams
  calendar.finalExams?.firstSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) First Semester Final Exams`, "final");
  });
  calendar.finalExams?.secondSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) Second Semester Final Exams`, "final");
  });

  // Check for last recitation day
  if (calendar.lastRecitationDay?.firstSemester?.some((d) => isEqual(d, date)))
    addEvent("Last Recitation Day", "classes");

  if (calendar.lastRecitationDay?.secondSemester?.some((d) => isEqual(d, date)))
    addEvent("Last Recitation Day", "classes");

  // Check for posting of grades
  if (isEqual(calendar.postingOfGrades?.firstSemester as Date, date))
    addEvent("Posting of Grades", "grades");

  if (isEqual(calendar.postingOfGrades?.secondSemester as Date, date))
    addEvent("Posting of Grades", "grades");

  // Check for summer classes
  if (calendar.summerClasses?.firstDayOfClasses?.some((d) => isEqual(d, date)))
    addEvent("First Day of Summer Classes", "summer-classes");

  // Check for summer exams
  if (calendar.summerClasses?.midtermExams?.some((d) => isEqual(d, date)))
    addEvent("Midterm Exams for Summer Classes", "summer-midterm");

  if (calendar.summerClasses?.finalExams?.some((d) => isEqual(d, date)))
    addEvent("Final Exams for Summer Classes", "summer-final");

  // Check for last recitation day for summer classes
  if (calendar.summerClasses?.lastRecitationDay?.some((d) => isEqual(d, date)))
    addEvent("Last Recitation Day for Summer Classes", "summer-classes");

  // Check for deadline grades
  if (
    calendar.summerClasses?.deadlineForGradesSubmission?.some((d) =>
      isEqual(d, date),
    )
  )
    addEvent(
      "Deadline for Grades Submission for Summer Classes",
      "summer-grades",
    );

  // Check for summer admission and registration
  calendar.summerClasses?.admission?.forEach((admission) => {
    const isAnAdmissionEvent = isEqual(
      admission.dates?.sort(compareAsc)[0] as Date,
      date,
    );

    const isInAdmissionRange =
      admission.dates?.some((d) => isEqual(d, date)) ?? false;

    if (isInAdmissionRange)
      addEvent(admission.name + " Summer Admission", "summer-admission-day");

    if (isAnAdmissionEvent)
      addEvent(
        admission.name + " Summer Admission start date",
        "summer-admission-first-day",
      );
  });

  calendar.summerClasses?.registration?.forEach((registration) => {
    const isARegistrationEvent = isEqual(
      registration.dates?.sort(compareAsc)[0] as Date,
      date,
    );

    const isInRegistrationRange =
      registration.dates?.some((d) => isEqual(d, date)) ?? false;

    if (isInRegistrationRange)
      addEvent(
        registration.name + " Summer Registration",
        "summer-registration-day",
      );

    if (isARegistrationEvent)
      addEvent(
        registration.name + " Summer Registration start date",
        "summer-registration-first-day",
      );
  });

  // Check for holidays
  calendar.holidays?.forEach((holiday) => {
    if (holiday.date.some((d) => isEqual(d, date)))
      events.add({ name: "Holidays", category: "holidays" });
  });

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
  const isToday = isEqual(date, new Date());
  const isInSchoolClasses = isDateInSchoolClasses(date, calendar);
  const isSunday = date.getDay() === 0;
  const eventArr = Array.from(events);
  const eventArrNoVisible = eventArr.filter((event) => {
    const eventCategory = EVENT_CATEGORIES.find(
      (cat) => cat.name === event.category,
    );
    return eventCategory && eventCategory.visible;
  });

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
              isInSchoolClasses ? "opacity-100" : "opacity-50",
              isSunday ? "text-foreground/50" : "text-foreground",
            )}
          >
            {date.getDate()}
          </div>

          {/* Event Background */}
          <div className="absolute bottom-0 left-1/2 flex w-14/15 -translate-x-1/2 flex-row justify-center gap-0.5">
            {eventArrNoVisible.map((event) => {
              const eventCategory = EVENT_CATEGORIES.find((cat) => cat.name === event.category);
              if (!eventCategory || !eventCategory.visible) return null;

              return (
                <div
                  key={format(date, "yyyy-MM-dd") + event.name}
                  className={cn(
                    "h-1 grow rounded-full opacity-50",
                    eventCategory?.color || "bg-gray-500",
                  )}
                />
              );
            })}
          </div>

          {/* Hover Background */}
          <div className="bg-foreground/5 absolute top-0 left-1/2 aspect-square h-full w-auto -translate-x-1/2 scale-80 rounded-lg opacity-0 transition-all duration-100 group-hover:scale-100 group-hover:opacity-100" />

          {isToday && (
            <div className="absolute top-0 left-1/2 aspect-square h-full w-auto -translate-x-1/2 rounded-lg border-2 border-blue-500" />
          )}
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-fit">
        <div className="flex flex-col gap-2">
          <div className="text-center text-sm font-medium">
            {format(date, "MMMM dd, yyyy")}
          </div>
          <div className="flex flex-col gap-1">
            {eventArrNoVisible.length === 0 ? (
              <div className="text-center text-sm text-foreground/70">
                No events
              </div>
            ) : (
              eventArrNoVisible.map((event) => {
                const eventCategory = EVENT_CATEGORIES.find(
                  (cat) => cat.name === event.category,
                );
                if (!eventCategory || !eventCategory.visible) return null;

                return (
                  <div
                    key={format(date, "yyyy-MM-dd") + event.name}
                    className="relative flex w-full items-center gap-2"
                  >
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        eventCategory?.color || "bg-gray-500",
                      )}
                    />
                    <p className="w-full text-sm">{event.name}</p>
                  </div>
                );
              })
            )}
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
