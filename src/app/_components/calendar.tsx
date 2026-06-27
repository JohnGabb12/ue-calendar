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
import { type CalendarSchema } from "~/lib/types";
import { type z } from "zod";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

type MultiMode = "start-date" | "whole-event" | "hide";
type SemesterView = "all" | "firstSemester" | "secondSemester" | "summer";
type AsyncView = "all" | "async" | "ge-async" | "hide";

type StudentType =
  | "all"
  | "transferees"
  | "cross-registrants"
  | "all-curricular"
  | "new-graduates"
  | "freshmen";

const STUDENT_CATEGORIES = [
  { id: "all", name: "All Student Types" },
  { id: "transferees", name: "Transferees & Degree Holders" },
  { id: "cross-registrants", name: "Cross-Registrants" },
  { id: "all-curricular", name: "All Curricular Years" },
  { id: "new-graduates", name: "New Students: GS, CLAW, & Graduate Dentistry" },
  { id: "freshmen", name: "College Freshmen (1st Year, 1st Semester)" },
];

const EVENT_CATEGORIES = [
  {
    id: "admission",
    name: "Admission",
    color: "bg-blue-500",
    isThreeMode: true,
    tooltip: "Filter by admissions periods",
  },
  {
    id: "registration",
    name: "Registration",
    color: "bg-green-500",
    isThreeMode: true,
    tooltip: "Filter by enrollment & registration periods",
  },
  {
    id: "classes",
    name: "Classes",
    color: "bg-yellow-500",
    isThreeMode: false,
    tooltip: "Show regular class timelines and recitations",
  },
  {
    id: "prelim",
    name: "Prelim Exams",
    color: "bg-purple-500",
    isThreeMode: false,
    tooltip: "Show preliminary examination schedules",
  },
  {
    id: "midterm",
    name: "Midterm Exams",
    color: "bg-pink-500",
    isThreeMode: false,
    tooltip: "Show midterm examination schedules",
  },
  {
    id: "final",
    name: "Final Exams",
    color: "bg-red-500",
    isThreeMode: false,
    tooltip: "Show final examination schedules",
  },
  {
    id: "grades",
    name: "Grades Submission",
    color: "bg-cyan-500",
    isThreeMode: false,
    tooltip: "Show processing and deadlines for grades",
  },
  {
    id: "holidays",
    name: "Holidays",
    color: "bg-gray-500",
    isThreeMode: false,
    tooltip: "Show regular and special non-working Philippine holidays",
  },
];

const ASYNCHRONOUS_DATES = [
  new Date(2026, 7, 12),
  new Date(2026, 7, 19),
  new Date(2026, 8, 2),
  new Date(2026, 8, 16),
  new Date(2026, 8, 30),
  new Date(2026, 9, 7),
  new Date(2026, 9, 21),
  new Date(2026, 10, 4),
  new Date(2026, 10, 18),
  new Date(2026, 11, 2),
  new Date(2026, 11, 9),
  new Date(2027, 0, 13),
  new Date(2027, 0, 27),
  new Date(2027, 1, 3),
  new Date(2027, 1, 17),
  new Date(2027, 2, 3),
  new Date(2027, 2, 17),
  new Date(2027, 2, 31),
  new Date(2027, 3, 14),
  new Date(2027, 3, 28),
  new Date(2027, 4, 12),
  new Date(2027, 4, 19),
  new Date(2027, 5, 9),
  new Date(2027, 5, 16),
  new Date(2027, 5, 23),
  new Date(2027, 5, 30),
  new Date(2027, 6, 7),
  new Date(2027, 6, 14),
  new Date(2027, 6, 21),
  new Date(2027, 6, 28),
  new Date(2027, 7, 4),
  new Date(2027, 7, 11),
];

const GE_ASYNCHRONOUS_DATES = [
  new Date(2026, 7, 26),
  new Date(2026, 8, 23),
  new Date(2026, 10, 14),
  new Date(2027, 0, 20),
  new Date(2027, 1, 24),
  new Date(2027, 3, 7),
  new Date(2027, 5, 11),
  new Date(2027, 6, 9),
];

const getPhilippineHolidays = (year: number) => [
  { name: "New Year's Day", date: [new Date(year, 0, 1)] },
  { name: "Chinese New Year", date: [new Date(year, 1, 17)] },
  {
    name: "EDSA People Power Revolution Anniversary",
    date: [new Date(year, 1, 25)],
  },
  { name: "Araw ng Kagitingan", date: [new Date(year, 3, 9)] },
  { name: "Maundy Thursday (Holy Week)", date: [new Date(year, 3, 2)] },
  { name: "Good Friday (Holy Week)", date: [new Date(year, 3, 3)] },
  { name: "Labor Day", date: [new Date(year, 4, 1)] },
  { name: "Independence Day", date: [new Date(year, 5, 12)] },
  { name: "Ninoy Aquino Day", date: [new Date(year, 7, 21)] },
  { name: "National Heroes Day", date: [new Date(year, 7, 31)] },
  { name: "All Saints' Day", date: [new Date(year, 10, 1)] },
  { name: "All Souls' Day", date: [new Date(year, 10, 2)] },
  { name: "Bonifacio Day", date: [new Date(year, 10, 30)] },
  {
    name: "Feast of the Immaculate Conception of Mary",
    date: [new Date(year, 11, 8)],
  },
  { name: "Christmas Eve", date: [new Date(year, 11, 24)] },
  { name: "Christmas Day", date: [new Date(year, 11, 25)] },
  { name: "Rizal Day", date: [new Date(year, 11, 30)] },
  { name: "New Year's Eve", date: [new Date(year, 11, 31)] },
];

const getTargetStudentKey = (eventName: string): StudentType => {
  const normalized = eventName.toLowerCase();
  if (normalized.includes("transferee") || normalized.includes("degree holder"))
    return "transferees";
  if (normalized.includes("cross-registrant")) return "cross-registrants";
  if (normalized.includes("all curricular")) return "all-curricular";
  if (
    normalized.includes("graduate dentistry") ||
    normalized.includes("gs") ||
    normalized.includes("claw")
  )
    return "new-graduates";
  if (normalized.includes("freshmen") || normalized.includes("1st year"))
    return "freshmen";
  return "all";
};

const getSemesterIntervals = (calendar: z.infer<typeof CalendarSchema>) => {
  const firstSemesterStart = calendar.firstDayOfClasses?.firstSemester;
  const firstSemesterEnd =
    calendar.finalExams?.firstSemester?.[0]?.date?.slice().sort(compareDesc)[0];
  const secondSemesterStart = calendar.firstDayOfClasses?.secondSemester;
  const secondSemesterEnd =
    calendar.finalExams?.secondSemester?.[0]?.date?.slice().sort(compareDesc)[0];
  const summerClassesStart = calendar.summerClasses?.firstDayOfClasses?.[0];
  const summerClassesEnd =
    calendar.summerClasses?.finalExams?.slice().sort(compareDesc)[0];

  return {
    firstSemester:
      firstSemesterStart && firstSemesterEnd
        ? { start: firstSemesterStart, end: firstSemesterEnd }
        : null,
    secondSemester:
      secondSemesterStart && secondSemesterEnd
        ? { start: secondSemesterStart, end: secondSemesterEnd }
        : null,
    summer:
      summerClassesStart && summerClassesEnd
        ? { start: summerClassesStart, end: summerClassesEnd }
        : null,
  };
};

const getRangePosition = (
  date: Date,
  calendar: z.infer<typeof CalendarSchema>,
  category: "admission" | "registration",
  targetType: StudentType,
): "start" | "middle" | "end" | null => {
  const items = calendar[category];
  if (items) {
    for (const item of items) {
      if (targetType !== "all" && getTargetStudentKey(item.name) !== targetType)
        continue;

      if (item.dates.firstSemester?.length) {
        const sorted = [...item.dates.firstSemester].sort(compareAsc);
        const start = sorted[0]!;
        const end = sorted[sorted.length - 1]!;
        if (isEqual(date, start)) return isEqual(start, end) ? null : "start";
        if (isEqual(date, end)) return "end";
        if (isWithinInterval(date, { start, end })) return "middle";
      }
      if (item.dates.secondSemester?.length) {
        const sorted = [...item.dates.secondSemester].sort(compareAsc);
        const start = sorted[0]!;
        const end = sorted[sorted.length - 1]!;
        if (isEqual(date, start)) return isEqual(start, end) ? null : "start";
        if (isEqual(date, end)) return "end";
        if (isWithinInterval(date, { start, end })) return "middle";
      }
    }
  }

  if (calendar.summerClasses?.[category]) {
    for (const item of calendar.summerClasses[category]) {
      if (targetType !== "all" && getTargetStudentKey(item.name) !== targetType)
        continue;

      if (item.dates?.length) {
        const sorted = [...item.dates].sort(compareAsc);
        const start = sorted[0]!;
        const end = sorted[sorted.length - 1]!;
        if (isEqual(date, start)) return isEqual(start, end) ? null : "start";
        if (isEqual(date, end)) return "end";
        if (isWithinInterval(date, { start, end })) return "middle";
      }
    }
  }
  return null;
};

const isDateInSchoolClasses = (
  date: Date,
  calendar: z.infer<typeof CalendarSchema>,
) => {
  const intervals = getSemesterIntervals(calendar);
  if (
    intervals.firstSemester &&
    isWithinInterval(date, intervals.firstSemester)
  )
    return true;
  if (
    intervals.secondSemester &&
    isWithinInterval(date, intervals.secondSemester)
  )
    return true;
  if (intervals.summer && isWithinInterval(date, intervals.summer)) return true;
  return false;
};

interface CalendarEvent {
  name: string;
  category: string;
  college?: string;
}

const dateEvents = (
  date: Date,
  calendar: z.infer<typeof CalendarSchema>,
): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
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

  const alreadyAdded = (eventName: string, college?: string) =>
    events.some((e) => e.name === eventName && e.college === college);

  const addEvent = (eventName: string, category: string, college?: string) => {
    if (!alreadyAdded(eventName, college)) {
      events.push({ name: eventName, category, college });
    }
  };

  if (ASYNCHRONOUS_DATES.some((d) => isEqual(d, date))) {
    addEvent("Asynchronous Class Session", "asynch");
  }
  if (GE_ASYNCHRONOUS_DATES.some((d) => isEqual(d, date))) {
    addEvent("GE Asynchronous Class Session", "geasynch");
  }

  calendar.admission?.forEach((admission) => {
    const firstSem = {
      asc: admission.dates.firstSemester?.slice().sort(compareAsc)[0] ?? new Date(0),
      desc: admission.dates.firstSemester?.slice().sort(compareDesc)[0] ?? new Date(0),
    };
    const secondSem = {
      asc: admission.dates.secondSemester?.slice().sort(compareAsc)[0] ?? new Date(0),
      desc: admission.dates.secondSemester?.slice().sort(compareDesc)[0] ?? new Date(0),
    };

    if (
      isWithinInterval(date, { start: firstSem.asc, end: firstSem.desc }) ||
      isWithinInterval(date, { start: secondSem.asc, end: secondSem.desc })
    )
      addEvent(admission.name + " Admission", "admission-day");

    if (isEqual(firstSem.asc, date) || isEqual(secondSem.asc, date))
      addEvent(admission.name + " Admission start date", "admission-first-day");
  });

  calendar.registration?.forEach((registration) => {
    const firstSem = {
      asc: registration.dates.firstSemester?.slice().sort(compareAsc)[0] ?? new Date(0),
      desc: registration.dates.firstSemester?.slice().sort(compareDesc)[0] ?? new Date(0),
    };
    const secondSem = {
      asc: registration.dates.secondSemester?.slice().sort(compareAsc)[0] ?? new Date(0),
      desc: registration.dates.secondSemester?.slice().sort(compareDesc)[0] ?? new Date(0),
    };

    if (
      isWithinInterval(date, { start: firstSem.asc, end: firstSem.desc }) ||
      isWithinInterval(date, { start: secondSem.asc, end: secondSem.desc })
    )
      addEvent(registration.name + " Registration", "registration-day");

    if (isEqual(firstSem.asc, date) || isEqual(secondSem.asc, date))
      addEvent(
        registration.name + " Registration start date",
        "registration-first-day",
      );
  });

  if (isEqual(calendar.firstDayOfClasses?.firstSemester ?? new Date(0), date))
    addEvent("First Day of First Semester", "classes");
  if (isEqual(calendar.firstDayOfClasses?.secondSemester ?? new Date(0), date))
    addEvent("First Day of Second Semester", "classes");

  calendar.preliminaryExams?.firstSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) First Semester Preliminary Exams`, "prelim", exam.college);
  });
  calendar.preliminaryExams?.secondSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) Second Semester Preliminary Exams`, "prelim", exam.college);
  });

  calendar.midtermExams?.firstSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) First Semester Midterm Exams`, "midterm", exam.college);
  });
  calendar.midtermExams?.secondSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) Second Semester Midterm Exams`, "midterm", exam.college);
  });

  calendar.finalExams?.firstSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) First Semester Final Exams`, "final", exam.college);
  });
  calendar.finalExams?.secondSemester.forEach((exam) => {
    if (exam.date.some((d) => isEqual(d, date)))
      addEvent(`(${classType}) Second Semester Final Exams`, "final", exam.college);
  });

  if (calendar.lastRecitationDay?.firstSemester?.some((d) => isEqual(d, date)))
    addEvent("Last Recitation Day", "classes");
  if (calendar.lastRecitationDay?.secondSemester?.some((d) => isEqual(d, date)))
    addEvent("Last Recitation Day", "classes");

  if (isEqual(calendar.postingOfGrades?.firstSemester ?? new Date(0), date))
    addEvent("Posting of Grades", "grades");
  if (isEqual(calendar.postingOfGrades?.secondSemester ?? new Date(0), date))
    addEvent("Posting of Grades", "grades");

  if (calendar.summerClasses?.firstDayOfClasses?.some((d) => isEqual(d, date)))
    addEvent("First Day of Summer Classes", "classes");
  if (calendar.summerClasses?.midtermExams?.some((d) => isEqual(d, date)))
    addEvent("Midterm Exams for Summer Classes", "midterm");
  if (calendar.summerClasses?.finalExams?.some((d) => isEqual(d, date)))
    addEvent("Final Exams for Summer Classes", "final");
  if (calendar.summerClasses?.lastRecitationDay?.some((d) => isEqual(d, date)))
    addEvent("Last Recitation Day for Summer Classes", "classes");

  if (
    calendar.summerClasses?.deadlineForGradesSubmission?.some((d) =>
      isEqual(d, date),
    )
  )
    addEvent("Deadline for Grades Submission for Summer Classes", "grades");

  calendar.summerClasses?.admission?.forEach((admission) => {
    const isAnAdmissionEvent = isEqual(
      admission.dates?.slice().sort(compareAsc)[0] ?? new Date(0),
      date,
    );
    const isInAdmissionRange =
      admission.dates?.some((d) => isEqual(d, date)) ?? false;
    if (isInAdmissionRange)
      addEvent(admission.name + " Summer Admission", "admission-day");
    if (isAnAdmissionEvent)
      addEvent(
        admission.name + " Summer Admission start date",
        "admission-first-day",
      );
  });

  calendar.summerClasses?.registration?.forEach((registration) => {
    const isARegistrationEvent = isEqual(
      registration.dates?.slice().sort(compareAsc)[0] ?? new Date(0),
      date,
    );
    const isInRegistrationRange =
      registration.dates?.some((d) => isEqual(d, date)) ?? false;
    if (isInRegistrationRange)
      addEvent(registration.name + " Summer Registration", "registration-day");
    if (isARegistrationEvent)
      addEvent(
        registration.name + " Summer Registration start date",
        "registration-first-day",
      );
  });

  const mergedHolidays = [
    ...(calendar.holidays ?? []),
    ...getPhilippineHolidays(calendar.years.start),
    ...getPhilippineHolidays(calendar.years.end),
  ];

  const uniqueHolidaysMap = new Map<string, Date[]>();
  mergedHolidays.forEach((h) => {
    const normalizedKey = h.name.toLowerCase().trim();
    if (!uniqueHolidaysMap.has(normalizedKey)) {
      uniqueHolidaysMap.set(normalizedKey, h.date);
    }
  });

  uniqueHolidaysMap.forEach((datesArray, holidayName) => {
    if (datesArray.some((d) => isEqual(d, date))) {
      const formattedName = holidayName.replace(/\b\w/g, (c) =>
        c.toUpperCase(),
      );
      addEvent(formattedName, "holidays");
    }
  });

  return events;
};

// Group matching exams onto a single descriptive list item to consolidate linear visual markers on day cards
const getCompactedIndicators = (events: CalendarEvent[]) => {
  const seenGroupKeys = new Set<string>();
  return events.filter((e) => {
    if (e.category === "asynch" || e.category === "geasynch") return false;
    const key = `${e.category}-${e.name}`;
    if (seenGroupKeys.has(key)) return false;
    seenGroupKeys.add(key);
    return true;
  });
};

function Day({
  date,
  calendar,
  className,
  filters,
  semesterView,
  asyncView,
  admissionStudentType,
  registrationStudentType,
  examCollege,
}: {
  date: Date;
  calendar: z.infer<typeof CalendarSchema>;
  className?: string;
  filters: Record<string, MultiMode | boolean>;
  semesterView: SemesterView;
  asyncView: AsyncView;
  admissionStudentType: StudentType;
  registrationStudentType: StudentType;
  examCollege: string;
}) {
  const rawEvents = dateEvents(date, calendar);
  const isToday = isWithinInterval(Date.now(), {
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    end: new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
    ),
  });
  const isSunday = date.getDay() === 0;

  const intervals = getSemesterIntervals(calendar);
  let activeSemesterKey: SemesterView = "all";
  if (
    intervals.firstSemester &&
    isWithinInterval(date, intervals.firstSemester)
  )
    activeSemesterKey = "firstSemester";
  else if (
    intervals.secondSemester &&
    isWithinInterval(date, intervals.secondSemester)
  )
    activeSemesterKey = "secondSemester";
  else if (intervals.summer && isWithinInterval(date, intervals.summer))
    activeSemesterKey = "summer";

  const isSemesterHidden =
    semesterView !== "all" && activeSemesterKey !== semesterView;
  const isInSchoolClasses =
    isDateInSchoolClasses(date, calendar) && !isSemesterHidden;

  const hasAsync = rawEvents.some((e) => e.category === "asynch");
  const hasGeAsync = rawEvents.some((e) => e.category === "geasynch");

  const showAsync =
    !isSemesterHidden &&
    (asyncView === "all" || asyncView === "async") &&
    hasAsync;
  const showGeAsync =
    !isSemesterHidden &&
    (asyncView === "all" || asyncView === "ge-async") &&
    hasGeAsync;

  const filteredEvents = rawEvents.filter((event) => {
    if (isSemesterHidden) return false;
    if (event.category === "asynch") return showAsync;
    if (event.category === "geasynch") return showGeAsync;

    const isExamCategory = ["prelim", "midterm", "final"].includes(event.category);
    if (isExamCategory && examCollege !== "all" && event.college !== examCollege) {
      return false;
    }

    const studentGroup = getTargetStudentKey(event.name);
    if (
      event.category.startsWith("admission") &&
      admissionStudentType !== "all" &&
      studentGroup !== admissionStudentType
    )
      return false;
    if (
      event.category.startsWith("registration") &&
      registrationStudentType !== "all" &&
      studentGroup !== registrationStudentType
    )
      return false;

    if (event.category === "admission-first-day")
      return filters.admission !== "hide";
    if (event.category === "admission-day") return false;
    if (event.category === "registration-first-day")
      return filters.registration !== "hide";
    if (event.category === "registration-day") return false;
    return filters[event.category] !== false;
  });

  const admissionRange =
    filters.admission === "whole-event" && !isSemesterHidden
      ? getRangePosition(date, calendar, "admission", admissionStudentType)
      : null;
  const registrationRange =
    filters.registration === "whole-event" && !isSemesterHidden
      ? getRangePosition(
          date,
          calendar,
          "registration",
          registrationStudentType,
        )
      : null;

  const activeRange = admissionRange ?? registrationRange;
  const rangeColor = admissionRange
    ? "bg-blue-500/15 dark:bg-blue-500/20"
    : "bg-green-500/15 dark:bg-green-500/20";

  const isAnyWholeEventActive =
    (filters.admission === "whole-event" ||
      filters.registration === "whole-event") &&
    !isSemesterHidden;

  const containsActiveWholeEvent =
    (filters.admission === "whole-event" &&
      rawEvents.some((e) => {
        if (!e.category.startsWith("admission")) return false;
        return (
          admissionStudentType === "all" ||
          getTargetStudentKey(e.name) === admissionStudentType
        );
      })) ||
    (filters.registration === "whole-event" &&
      rawEvents.some((e) => {
        if (!e.category.startsWith("registration")) return false;
        return (
          registrationStudentType === "all" ||
          getTargetStudentKey(e.name) === registrationStudentType
        );
      }));

  const shouldDimDay =
    (isAnyWholeEventActive && !containsActiveWholeEvent) || isSemesterHidden;

  let textColorClass = isToday
    ? "text-yellow-500 font-bold"
    : "text-foreground";
  if (!isToday) {
    if (showAsync)
      textColorClass = "text-emerald-600 dark:text-emerald-400 font-bold";
    else if (showGeAsync)
      textColorClass = "text-indigo-600 dark:text-indigo-400 font-bold";
  }

  // Compact indicator lists so we generate one dot per structural block category rather than duplicating lines
  const linearIndicators = getCompactedIndicators(filteredEvents);

  // Group events by descriptive name so multiple colleges share the same display text item with consolidated badge grids
  const displayGroups = React.useMemo(() => {
    const maps = new Map<string, { baseEvent: CalendarEvent; colleges: string[] }>();
    filteredEvents.forEach((event) => {
      const key = `${event.category}-${event.name}`;
      if (!maps.has(key)) {
        maps.set(key, { baseEvent: event, colleges: [] });
      }
      if (event.college) {
        maps.get(key)!.colleges.push(event.college);
      }
    });
    return Array.from(maps.values());
  }, [filteredEvents]);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          className={cn(
            "group/day relative flex aspect-square h-6 w-auto cursor-pointer items-center justify-center text-xs transition-all md:h-8 md:text-sm",
            activeRange && rangeColor,
            activeRange === "start" && "rounded-l-full",
            activeRange === "end" && "rounded-r-full",
            !activeRange && "rounded-lg",
            shouldDimDay && "scale-95 opacity-25",
            className,
          )}
        >
          <div
            className={cn(
              "z-2 transition-opacity",
              isInSchoolClasses
                ? "opacity-100"
                : isSunday
                  ? "opacity-30"
                  : "opacity-50",
              textColorClass,
            )}
          >
            {date.getDate()}
          </div>
          <div className="absolute bottom-0 left-1/2 flex w-14/15 -translate-x-1/2 flex-row justify-center gap-0.5">
            {linearIndicators.map((event) => {
              const baseCat = event.category.split("-")[0]!;
              const config = EVENT_CATEGORIES.find((cat) => cat.id === baseCat);
              return (
                <div
                  key={format(date, "yyyy-MM-dd") + event.category + event.name}
                  className={cn(
                    "h-1 grow rounded-full opacity-70",
                    config?.color ?? "bg-gray-500",
                  )}
                />
              );
            })}
          </div>
          <div className="bg-foreground/5 absolute top-0 left-1/2 aspect-square h-full w-auto -translate-x-1/2 scale-80 rounded-lg opacity-0 transition-all duration-100 group-hover/day:scale-100 group-hover/day:opacity-100" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-fit max-w-xs">
        <div className="flex flex-col gap-2">
          <div className="text-center text-sm font-medium">
            {format(date, "MMMM dd, yyyy")}
          </div>
          <div className="flex flex-col gap-1">
            {displayGroups.length === 0 ? (
              <div className="text-foreground/70 text-center text-sm">
                No events
              </div>
            ) : (
              displayGroups.map(({ baseEvent, colleges }) => {
                const baseCat = baseEvent.category.split("-")[0]!;
                const config = EVENT_CATEGORIES.find(
                  (cat) => cat.id === baseCat,
                );
                let dotColor = config?.color ?? "bg-gray-500";
                if (baseEvent.category === "asynch") dotColor = "bg-emerald-500";
                if (baseEvent.category === "geasynch") dotColor = "bg-indigo-500";

                return (
                  <div
                    key={format(date, "yyyy-MM-dd") + baseEvent.category + baseEvent.name}
                    className="flex w-full items-start gap-2 py-0.5"
                  >
                    <div
                      className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotColor)}
                    />
                    <div className="flex flex-col items-start gap-1 grow">
                      <p className="w-full text-left text-sm leading-tight">{baseEvent.name}</p>
                      {examCollege === "all" && colleges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {colleges.map((college) => (
                            <span
                              key={college}
                              className="text-muted-foreground bg-foreground/5 border-muted text-[10px] rounded border px-1 py-0.5 font-medium tracking-wide uppercase whitespace-nowrap"
                            >
                              {college}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
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
  filters,
  semesterView,
  asyncView,
  admissionStudentType,
  registrationStudentType,
  examCollege,
}: {
  year: number;
  month: number;
  calendar: z.infer<typeof CalendarSchema>;
  className?: string;
  filters: Record<string, MultiMode | boolean>;
  semesterView: SemesterView;
  asyncView: AsyncView;
  admissionStudentType: StudentType;
  registrationStudentType: StudentType;
  examCollege: string;
}) {
  const date = new Date(year, month - 1, 1);
  const firstDayIndex = date.getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const totalDays = new Date(year, month, 0).getDate();

  return (
    <div
      className={cn(
        "border-border bg-foreground/5 will-change-opacity month-card w-fit rounded-3xl border transition-all duration-200",
        className,
      )}
    >
      <div className="w-full p-2 text-center font-medium">
        {format(date, "MMMM")} {year}
      </div>
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
      <div className="grid grid-cols-7 p-2">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square h-6 w-auto md:h-8" />
        ))}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
          <Day
            key={day}
            date={new Date(year, month - 1, day)}
            calendar={calendar}
            filters={filters}
            semesterView={semesterView}
            asyncView={asyncView}
            admissionStudentType={admissionStudentType}
            registrationStudentType={registrationStudentType}
            examCollege={examCollege}
          />
        ))}
      </div>
    </div>
  );
}

interface FilterContentProps {
  calendar: z.infer<typeof CalendarSchema>;
  filters: Record<string, MultiMode | boolean>;
  onChangeFilter: (id: string, value: MultiMode | boolean) => void;
  semesterView: SemesterView;
  onChangeSemesterView: (value: SemesterView) => void;
  asyncView: AsyncView;
  onChangeAsyncView: (value: AsyncView) => void;
  admissionStudentType: StudentType;
  onChangeAdmissionStudentType: (value: StudentType) => void;
  registrationStudentType: StudentType;
  onChangeRegistrationStudentType: (value: StudentType) => void;
  examCollege: string;
  onChangeExamCollege: (value: string) => void;
}

function FilterContent({
  calendar,
  filters,
  onChangeFilter,
  semesterView,
  onChangeSemesterView,
  asyncView,
  onChangeAsyncView,
  admissionStudentType,
  onChangeAdmissionStudentType,
  registrationStudentType,
  onChangeRegistrationStudentType,
  examCollege,
  onChangeExamCollege,
}: FilterContentProps) {
  const getAvailableOptionsForCategory = (
    catId: "admission" | "registration",
  ) => {
    const activeKeys = new Set<string>(["all"]);
    const items = calendar[catId] ?? [];
    items.forEach((item) => activeKeys.add(getTargetStudentKey(item.name)));

    if (calendar.summerClasses?.[catId]) {
      calendar.summerClasses[catId].forEach((item) =>
        activeKeys.add(getTargetStudentKey(item.name)),
      );
    }

    return STUDENT_CATEGORIES.filter((st) => activeKeys.has(st.id));
  };

  const derivedColleges = React.useMemo(() => {
    const colleges = new Set<string>();
    const examTypes = ["preliminaryExams", "midtermExams", "finalExams"] as const;
    const semesters = ["firstSemester", "secondSemester"] as const;

    examTypes.forEach((type) => {
      const examBlock = calendar[type];
      if (examBlock) {
        semesters.forEach((sem) => {
          const examArr = examBlock[sem];
          if (Array.isArray(examArr)) {
            examArr.forEach((item) => {
              if (item?.college) {
                colleges.add(item.college);
              }
            });
          }
        });
      }
    });

    return Array.from(colleges).sort();
  }, [calendar]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Academic Semester
          </p>
          <Select
            value={semesterView}
            onValueChange={(value) =>
              onChangeSemesterView(value as SemesterView)
            }
          >
            <SelectTrigger className="bg-background h-9 w-full rounded-xl text-xs">
              <SelectValue placeholder="Select Semester View" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs">
                All Semesters
              </SelectItem>
              <SelectItem value="firstSemester" className="text-xs">
                First Semester
              </SelectItem>
              <SelectItem value="secondSemester" className="text-xs">
                Second Semester
              </SelectItem>
              <SelectItem value="summer" className="text-xs">
                Summer Classes
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Examination Scope
          </p>
          <Select value={examCollege} onValueChange={onChangeExamCollege}>
            <SelectTrigger className="bg-background h-9 w-full rounded-xl text-xs">
              <SelectValue placeholder="Select Target College" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs">
                All Colleges
              </SelectItem>
              {derivedColleges.map((college) => (
                <SelectItem key={college} value={college} className="text-xs">
                  {college}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Asynchronous Mode
          </p>
          <Select
            value={asyncView}
            onValueChange={(value) => onChangeAsyncView(value as AsyncView)}
          >
            <SelectTrigger className="bg-background h-9 w-full rounded-xl text-xs">
              <SelectValue placeholder="Select Async Mode" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="hide" className="text-xs">
                Hide All
              </SelectItem>
              <SelectItem value="all" className="text-xs">
                Show All Async
              </SelectItem>
              <SelectItem value="async" className="text-xs">
                Async Classes (Green)
              </SelectItem>
              <SelectItem value="ge-async" className="text-xs">
                GE Async Classes (Blue)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Legend & Categories
          </p>
          <div className="flex flex-col gap-2.5">
            {EVENT_CATEGORIES.map((category) => {
              if (category.isThreeMode) {
                const currentMode =
                  (filters[category.id] as MultiMode) ?? "start-date";
                const activeStudentType =
                  category.id === "admission"
                    ? admissionStudentType
                    : registrationStudentType;
                const changeStudentTypeHandler =
                  category.id === "admission"
                    ? onChangeAdmissionStudentType
                    : onChangeRegistrationStudentType;

                const validOptions = getAvailableOptionsForCategory(
                  category.id as "admission" | "registration",
                );

                return (
                  <Tooltip key={category.id}>
                    <TooltipTrigger asChild>
                      <div className="bg-background/50 flex flex-col gap-1.5 rounded-2xl border p-1.5 text-left">
                        <div className="flex items-center gap-2 px-1.5 pt-0.5">
                          <div
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              category.color,
                            )}
                          />
                          <span className="text-foreground text-[11px] font-semibold">
                            {category.name}
                          </span>
                        </div>
                        <div className="bg-muted grid grid-cols-3 gap-1 rounded-xl p-0.5 text-[11px] font-medium">
                          {(
                            ["start-date", "whole-event", "hide"] as MultiMode[]
                          ).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => onChangeFilter(category.id, mode)}
                              className={cn(
                                "text-muted-foreground hover:text-foreground rounded-lg px-1 py-1 text-center text-[10px] capitalize transition-all",
                                currentMode === mode &&
                                  "bg-background text-foreground font-semibold shadow-sm",
                              )}
                            >
                              {mode === "start-date"
                                ? "Start"
                                : mode === "whole-event"
                                  ? "Whole"
                                  : "Hide"}
                            </button>
                          ))}
                        </div>

                        {currentMode === "whole-event" &&
                          validOptions.length > 1 && (
                            <div className="animate-in fade-in slide-in-from-top-1 mt-1 flex flex-col gap-1 px-0.5 duration-150">
                              <span className="text-muted-foreground pl-1 text-[9px] font-bold tracking-wider uppercase">
                                Target Category
                              </span>
                              <Select
                                value={activeStudentType}
                                onValueChange={(value) =>
                                  changeStudentTypeHandler(value as StudentType)
                                }
                              >
                                <SelectTrigger className="bg-background h-7 w-full rounded-lg px-2 text-[10px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-w-55 rounded-xl">
                                  {validOptions.map((st) => (
                                    <SelectItem
                                      key={st.id}
                                      value={st.id}
                                      className="text-[10px]"
                                    >
                                      {st.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-50">
                      <p className="text-xs">{category.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              const isActive = filters[category.id] !== false;
              return (
                <Tooltip key={category.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onChangeFilter(category.id, !isActive)}
                      className={cn(
                        "hover:bg-accent flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left text-xs font-medium transition-all",
                        !isActive && "opacity-40",
                      )}
                    >
                      <div
                        className={cn(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          category.color,
                        )}
                      />
                      <span className="text-foreground grow">
                        {category.name}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="text-xs">{category.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function Calendar() {
  const [calendar] = api.calendar.get.useSuspenseQuery(undefined, {
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
  const [semesterView, setSemesterView] = React.useState<SemesterView>("all");
  const [examCollege, setExamCollege] = React.useState<string>("all");
  const [asyncView, setAsyncView] = React.useState<AsyncView>("hide");
  const [admissionStudentType, setAdmissionStudentType] =
    React.useState<StudentType>("all");
  const [registrationStudentType, setRegistrationStudentType] =
    React.useState<StudentType>("all");

  const [filters, setFilters] = React.useState<
    Record<string, MultiMode | boolean>
  >(() => {
    const defaults: Record<string, MultiMode | boolean> = {};
    EVENT_CATEGORIES.forEach((cat) => {
      defaults[cat.id] = cat.isThreeMode ? "start-date" : true;
    });
    return defaults;
  });

  const changeFilter = React.useCallback(
    (id: string, value: MultiMode | boolean) => {
      setFilters((prev) => ({ ...prev, [id]: value }));
    },
    [],
  );

  const startMonth = calendar.firstDayOfClasses?.firstSemester?.getMonth() ?? 0;
  const endMonth =
    calendar.summerClasses?.deadlineForGradesSubmission
      ?.slice()
      .sort(compareDesc)[0]
      ?.getMonth() ?? 11;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold">{calendar.title}</h2>
        <p className="text-muted-foreground text-lg">
          Academic Year: {calendar.years.start} - {calendar.years.end}
        </p>
      </div>

      <div className="bg-background/80 sticky top-0 z-40 mb-4 flex justify-end border-b py-3 backdrop-blur-md lg:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <button className="bg-card hover:bg-accent flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters & Legends</span>
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm p-4">
              <DrawerHeader className="text-left">
                <DrawerTitle>Calendar Filters</DrawerTitle>
                <DrawerDescription>
                  Configure active properties and category groups.
                </DrawerDescription>
              </DrawerHeader>
              <div className="max-h-[70vh] overflow-y-auto p-4 pb-0">
                <FilterContent
                  calendar={calendar}
                  filters={filters}
                  onChangeFilter={changeFilter}
                  semesterView={semesterView}
                  onChangeSemesterView={setSemesterView}
                  asyncView={asyncView}
                  onChangeAsyncView={setAsyncView}
                  admissionStudentType={admissionStudentType}
                  onChangeAdmissionStudentType={setAdmissionStudentType}
                  registrationStudentType={registrationStudentType}
                  onChangeRegistrationStudentType={setRegistrationStudentType}
                  examCollege={examCollege}
                  onChangeExamCollege={setExamCollege}
                />
              </div>
              <DrawerFooter className="pt-4">
                <DrawerClose asChild>
                  <button className="bg-primary text-primary-foreground w-full rounded-xl py-2.5 font-medium shadow transition hover:opacity-90">
                    Done
                  </button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_240px]">
        <div className="calendar-container w-full [&:hover_.month-card:not(:hover)]:opacity-80">
          <div className="flex w-full flex-wrap justify-center gap-4">
            {Array.from(range(startMonth - 1, 12)).map((month) => (
              <Month
                key={`start-${month}`}
                year={calendar.years.start}
                month={month}
                calendar={calendar}
                filters={filters}
                semesterView={semesterView}
                asyncView={asyncView}
                admissionStudentType={admissionStudentType}
                registrationStudentType={registrationStudentType}
                examCollege={examCollege}
              />
            ))}
            {Array.from(range(1, endMonth + 1)).map((month) => (
              <Month
                key={`end-${month}`}
                year={calendar.years.end}
                month={month}
                calendar={calendar}
                filters={filters}
                semesterView={semesterView}
                asyncView={asyncView}
                admissionStudentType={admissionStudentType}
                registrationStudentType={registrationStudentType}
                examCollege={examCollege}
              />
            ))}
          </div>
        </div>

        <aside className="bg-card/40 sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-y-auto rounded-3xl border p-4 shadow-sm lg:block">
          <FilterContent
            calendar={calendar}
            filters={filters}
            onChangeFilter={changeFilter}
            semesterView={semesterView}
            onChangeSemesterView={setSemesterView}
            asyncView={asyncView}
            onChangeAsyncView={setAsyncView}
            admissionStudentType={admissionStudentType}
            onChangeAdmissionStudentType={setAdmissionStudentType}
            registrationStudentType={registrationStudentType}
            onChangeRegistrationStudentType={setRegistrationStudentType}
            examCollege={examCollege}
            onChangeExamCollege={setExamCollege}
          />
        </aside>
      </div>
    </div>
  );
}