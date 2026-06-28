"use client";

import * as React from "react";
import { compareAsc, compareDesc, format } from "date-fns";
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
type QuadMode = "all" | "regular" | "summer" | "hide";
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
    darkerColor: "bg-blue-900 dark:bg-blue-950",
    isThreeMode: true,
    tooltip: "Filter by admissions periods",
  },
  {
    id: "registration",
    name: "Registration",
    color: "bg-green-500",
    darkerColor: "bg-emerald-900 dark:bg-emerald-950",
    isThreeMode: true,
    tooltip: "Filter by enrollment & registration periods",
  },
  {
    id: "classes",
    name: "Classes",
    color: "bg-yellow-500",
    darkerColor: "bg-amber-900 dark:bg-amber-950",
    isThreeMode: false,
    tooltip: "Show regular and summer class timelines and recitations",
  },
  {
    id: "prelim",
    name: "Prelim Exams",
    color: "bg-purple-500",
    darkerColor: "bg-purple-900",
    isThreeMode: false,
    tooltip: "Show preliminary examination schedules",
  },
  {
    id: "midterm",
    name: "Midterm Exams",
    color: "bg-pink-500",
    darkerColor: "bg-rose-900 dark:bg-rose-950",
    isThreeMode: false,
    tooltip: "Show midterm examination schedules",
  },
  {
    id: "final",
    name: "Final Exams",
    color: "bg-red-500",
    darkerColor: "bg-red-900 dark:bg-red-950",
    isThreeMode: false,
    tooltip: "Show final examination schedules",
  },
  {
    id: "grades",
    name: "Grades Submission",
    color: "bg-cyan-500",
    darkerColor: "bg-cyan-900 dark:bg-cyan-950",
    isThreeMode: false,
    tooltip: "Show processing and deadlines for grades",
  },
  {
    id: "holidays",
    name: "Holidays",
    color: "bg-gray-500",
    darkerColor: "bg-gray-800",
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

const getNormalizedKey = (date: Date): string => {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

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

interface CalendarEvent {
  name: string;
  category: string;
  college?: string;
  isSummer?: boolean;
}

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

const Day = React.memo(function Day({
  date,
  dateKey,
  precomputedEvents,
  activeSemesterKey,
  isInSchoolClasses,
  rangePosition,
  isSummerRange,
  filters,
  semesterView,
  asyncView,
  admissionStudentType,
  registrationStudentType,
  examCollege,
}: {
  date: Date;
  dateKey: string;
  precomputedEvents: CalendarEvent[];
  activeSemesterKey: SemesterView;
  isInSchoolClasses: boolean;
  rangePosition: "start" | "middle" | "end" | null;
  isSummerRange: boolean;
  filters: Record<string, MultiMode | QuadMode | boolean>;
  semesterView: SemesterView;
  asyncView: AsyncView;
  admissionStudentType: StudentType;
  registrationStudentType: StudentType;
  examCollege: string;
}) {
  const todayKey = React.useMemo(() => getNormalizedKey(new Date()), []);
  const isToday = dateKey === todayKey;
  const isSunday = date.getDay() === 0;

  const isSemesterHidden =
    semesterView !== "all" && activeSemesterKey !== semesterView;
  const isEffectiveInSchoolClasses = isInSchoolClasses && !isSemesterHidden;

  const hasAsync = precomputedEvents.some((e) => e.category === "asynch");
  const hasGeAsync = precomputedEvents.some((e) => e.category === "geasynch");

  const showAsync =
    !isSemesterHidden &&
    (asyncView === "all" || asyncView === "async") &&
    hasAsync;
  const showGeAsync =
    !isSemesterHidden &&
    (asyncView === "all" || asyncView === "ge-async") &&
    hasGeAsync;

  const filteredEvents = precomputedEvents.filter((event) => {
    if (isSemesterHidden) return false;
    if (event.category === "asynch") return showAsync;
    if (event.category === "geasynch") return showGeAsync;

    if (
      ["prelim", "midterm", "final"].includes(event.category) &&
      examCollege !== "all" &&
      event.college !== examCollege
    ) {
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

    if (event.category === "holidays" || event.category === "prelim") {
      return filters[event.category] !== false;
    }

    const groupMode = (filters[event.category] as QuadMode) ?? "all";
    if (groupMode === "hide") return false;
    if (groupMode === "regular" && event.isSummer) return false;
    if (groupMode === "summer" && !event.isSummer) return false;

    return true;
  });

  const activeRange = !isSemesterHidden ? rangePosition : null;

  const rangeColor =
    filters.admission === "whole-event" && rangePosition
      ? isSummerRange
        ? "bg-blue-900/40 dark:bg-blue-950/50"
        : "bg-blue-500/15 dark:bg-blue-500/20"
      : isSummerRange
        ? "bg-emerald-900/40 dark:bg-emerald-950/50"
        : "bg-green-500/15 dark:bg-green-500/20";

  const isAnyWholeEventActive =
    (filters.admission === "whole-event" ||
      filters.registration === "whole-event") &&
    !isSemesterHidden;
  const containsActiveWholeEvent =
    (filters.admission === "whole-event" &&
      precomputedEvents.some(
        (e) =>
          e.category.startsWith("admission") &&
          (admissionStudentType === "all" ||
            getTargetStudentKey(e.name) === admissionStudentType),
      )) ||
    (filters.registration === "whole-event" &&
      precomputedEvents.some(
        (e) =>
          e.category.startsWith("registration") &&
          (registrationStudentType === "all" ||
            getTargetStudentKey(e.name) === registrationStudentType),
      ));

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

  const linearIndicators = getCompactedIndicators(filteredEvents);

  const displayGroups = React.useMemo(() => {
    const maps = new Map<
      string,
      { baseEvent: CalendarEvent; colleges: string[] }
    >();
    filteredEvents.forEach((event) => {
      const key = `${event.category}-${event.name}`;
      if (!maps.has(key)) maps.set(key, { baseEvent: event, colleges: [] });
      if (event.college) maps.get(key)!.colleges.push(event.college);
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
          )}
        >
          <div
            className={cn(
              "z-2 transition-opacity",
              isEffectiveInSchoolClasses
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
                  key={dateKey + event.category + event.name}
                  className={cn(
                    "h-1 grow rounded-full opacity-80",
                    config?.color ?? "bg-gray-500",
                    event.isSummer && "ring-1 ring-amber-500 ring-offset-1",
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
                if (baseEvent.category === "asynch")
                  dotColor = "bg-emerald-500";
                if (baseEvent.category === "geasynch")
                  dotColor = "bg-indigo-500";

                return (
                  <div
                    key={dateKey + baseEvent.category + baseEvent.name}
                    className="flex w-full items-start gap-2 py-0.5"
                  >
                    <div
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        dotColor,
                        baseEvent.isSummer &&
                          "ring-1 ring-amber-500 ring-offset-1",
                      )}
                    />
                    <div className="flex grow flex-col items-start gap-1">
                      <p className="w-full text-left text-sm leading-tight">
                        {baseEvent.name}
                        {baseEvent.isSummer && (
                          <span className="ml-1.5 text-[10px] font-bold tracking-wider text-amber-500 uppercase">
                            (Summer)
                          </span>
                        )}
                      </p>
                      {examCollege === "all" && colleges.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {colleges.map((college) => (
                            <span
                              key={college}
                              className="text-muted-foreground bg-foreground/5 border-muted rounded border px-1 py-0.5 text-[10px] font-medium tracking-wide whitespace-nowrap uppercase"
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
});

const Month = React.memo(function Month({
  year,
  month,
  eventsMap,
  activeSemesterMap,
  isInSchoolClassesMap,
  rangePositionsMap,
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
  eventsMap: Map<string, CalendarEvent[]>;
  activeSemesterMap: Map<string, SemesterView>;
  isInSchoolClassesMap: Map<string, boolean>;
  rangePositionsMap: Map<string, Map<string, "start" | "middle" | "end">>;
  className?: string;
  filters: Record<string, MultiMode | QuadMode | boolean>;
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
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
          const dayDate = new Date(year, month - 1, day);
          const dateKey = `${year}-${month - 1}-${day}`;

          const precomputedEvents = eventsMap.get(dateKey) ?? [];
          const activeSemesterKey = activeSemesterMap.get(dateKey) ?? "all";
          const isInSchoolClasses = isInSchoolClassesMap.get(dateKey) ?? false;

          let rangePosition: "start" | "middle" | "end" | null = null;
          if (filters.admission === "whole-event") {
            rangePosition =
              rangePositionsMap
                .get(`admission-${admissionStudentType}`)
                ?.get(dateKey) ?? null;
          } else if (filters.registration === "whole-event") {
            rangePosition =
              rangePositionsMap
                .get(`registration-${registrationStudentType}`)
                ?.get(dateKey) ?? null;
          }

          const isSummerRange = precomputedEvents.some(
            (e) =>
              e.isSummer &&
              (e.category.startsWith("admission") ||
                e.category.startsWith("registration")),
          );

          return (
            <Day
              key={day}
              date={dayDate}
              dateKey={dateKey}
              precomputedEvents={precomputedEvents}
              activeSemesterKey={activeSemesterKey}
              isInSchoolClasses={isInSchoolClasses}
              rangePosition={rangePosition}
              isSummerRange={isSummerRange}
              filters={filters}
              semesterView={semesterView}
              asyncView={asyncView}
              admissionStudentType={admissionStudentType}
              registrationStudentType={registrationStudentType}
              examCollege={examCollege}
            />
          );
        })}
      </div>
    </div>
  );
});

interface FilterContentProps {
  calendar: z.infer<typeof CalendarSchema>;
  filters: Record<string, MultiMode | QuadMode | boolean>;
  onChangeFilter: (id: string, value: MultiMode | QuadMode | boolean) => void;
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
    const examTypes = [
      "preliminaryExams",
      "midtermExams",
      "finalExams",
    ] as const;
    const semesters = ["firstSemester", "secondSemester"] as const;

    examTypes.forEach((type) => {
      const examBlock = calendar[type];
      if (examBlock) {
        semesters.forEach((sem) => {
          const examArr = examBlock[sem];
          if (Array.isArray(examArr)) {
            examArr.forEach((item) => {
              if (item?.college) colleges.add(item.college);
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
          <p className="text-muted-foreground text-xs font-bold tracking-wider">
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
          <p className="text-muted-foreground text-xs font-bold tracking-wider">
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
          <p className="text-muted-foreground text-xs font-bold tracking-wider">
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
          <p className="text-muted-foreground text-xs font-bold tracking-wider">
            Legend & Categories
          </p>
          <div className="flex flex-col gap-3">
            {EVENT_CATEGORIES.filter(
              (cat) => !["prelim", "midterm", "final"].includes(cat.id),
            ).map((category) => {
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

              if (category.id === "holidays") {
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
                        <div className="flex grow items-center gap-1.5">
                          <div
                            className={cn(
                              "h-2.5 w-2.5 shrink-0 rounded-full",
                              category.color,
                            )}
                          />
                          <span className="text-foreground ml-1">
                            {category.name}
                          </span>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p className="text-xs">{category.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              const quadModes: QuadMode[] = [
                "all",
                "regular",
                "summer",
                "hide",
              ];
              const currentQuadMode =
                (filters[category.id] as QuadMode) ?? "all";
              const nextQuadMode =
                quadModes[
                  (quadModes.indexOf(currentQuadMode) + 1) % quadModes.length
                ]!;

              return (
                <Tooltip key={category.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onChangeFilter(category.id, nextQuadMode)}
                      className={cn(
                        "hover:bg-accent flex w-full items-center justify-between rounded-xl border border-transparent p-2 text-left text-xs font-medium transition-all select-none",
                        currentQuadMode === "hide" && "opacity-40",
                      )}
                    >
                      <div className="mr-2 flex items-center gap-1.5 truncate">
                        <div className="flex shrink-0 items-center gap-1">
                          <div
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              category.color,
                            )}
                          />
                          <div
                            className={cn(
                              "h-2.5 w-2.5 rounded-full ring-1 ring-amber-500 ring-offset-[0.5px]",
                              category.color,
                            )}
                          />
                        </div>
                        <span className="text-foreground ml-1 truncate">
                          {category.name}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-sm transition-colors select-none",
                          currentQuadMode === "all" &&
                            "border-blue-500/20 bg-blue-500/10 text-blue-600",
                          currentQuadMode === "regular" &&
                            "border-purple-500/20 bg-purple-500/10 text-purple-600",
                          currentQuadMode === "summer" &&
                            "border-amber-500/20 bg-amber-500/10 text-amber-600",
                          currentQuadMode === "hide" &&
                            "border-gray-500/20 bg-gray-500/10 text-gray-600",
                        )}
                      >
                        {currentQuadMode}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="text-xs">
                      {category.tooltip} (Click to cycle view)
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            <div className="bg-background/40 flex flex-col gap-1.5 rounded-2xl border p-2">
              <p className="text-muted-foreground mb-1 pl-1 text-[10px] font-bold tracking-wide">
                Examinations
              </p>
              {EVENT_CATEGORIES.filter((cat) =>
                ["prelim", "midterm", "final"].includes(cat.id),
              ).map((category) => {
                if (category.id === "prelim") {
                  const isActive = filters[category.id] !== false;
                  return (
                    <Tooltip key={category.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onChangeFilter(category.id, !isActive)}
                          className={cn(
                            "hover:bg-accent flex w-full items-center gap-2 rounded-xl p-1.5 text-left text-xs font-medium transition-all",
                            !isActive && "opacity-40",
                          )}
                        >
                          <div
                            className={cn(
                              "h-2.5 w-2.5 shrink-0 rounded-full",
                              category.color,
                            )}
                          />
                          <span className="text-foreground">
                            {category.name}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">{category.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                const quadModes: QuadMode[] = [
                  "all",
                  "regular",
                  "summer",
                  "hide",
                ];
                const currentQuadMode =
                  (filters[category.id] as QuadMode) ?? "all";
                const nextQuadMode =
                  quadModes[
                    (quadModes.indexOf(currentQuadMode) + 1) % quadModes.length
                  ]!;

                return (
                  <Tooltip key={category.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          onChangeFilter(category.id, nextQuadMode)
                        }
                        className={cn(
                          "hover:bg-accent flex w-full items-center justify-between rounded-xl p-1.5 text-left text-xs font-medium transition-all select-none",
                          currentQuadMode === "hide" && "opacity-40",
                        )}
                      >
                        <div className="mr-2 flex items-center gap-1.5 truncate">
                          <div className="flex shrink-0 items-center gap-1">
                            <div
                              className={cn(
                                "h-2.5 w-2.5 rounded-full",
                                category.color,
                              )}
                            />
                            <div
                              className={cn(
                                "h-2.5 w-2.5 rounded-full ring-1 ring-amber-500 ring-offset-[0.5px]",
                                category.color,
                              )}
                            />
                          </div>
                          <span className="text-foreground truncate">
                            {category.name}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase transition-colors select-none",
                            currentQuadMode === "all" &&
                              "border-blue-500/20 bg-blue-500/10 text-blue-600",
                            currentQuadMode === "regular" &&
                              "border-purple-500/20 bg-purple-500/10 text-purple-600",
                            currentQuadMode === "summer" &&
                              "border-amber-500/20 bg-amber-500/10 text-amber-600",
                            currentQuadMode === "hide" &&
                              "border-gray-500/20 bg-gray-500/10 text-gray-600",
                          )}
                        >
                          {currentQuadMode}
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
    Record<string, MultiMode | QuadMode | boolean>
  >(() => {
    const defaults: Record<string, MultiMode | QuadMode | boolean> = {};
    EVENT_CATEGORIES.forEach((cat) => {
      if (cat.isThreeMode) defaults[cat.id] = "start-date";
      else if (cat.id === "holidays" || cat.id === "prelim")
        defaults[cat.id] = true;
      else defaults[cat.id] = "all";
    });
    return defaults;
  });

  const changeFilter = React.useCallback(
    (id: string, value: MultiMode | QuadMode | boolean) => {
      setFilters((prev) => ({ ...prev, [id]: value }));
    },
    [],
  );

  const precomputedData = React.useMemo(() => {
    const eventsMap = new Map<string, CalendarEvent[]>();
    const activeSemesterMap = new Map<string, SemesterView>();
    const isInSchoolClassesMap = new Map<string, boolean>();
    const rangePositionsMap = new Map<
      string,
      Map<string, "start" | "middle" | "end">
    >();

    const firstSemesterStart = calendar.firstDayOfClasses?.firstSemester;
    const firstSemesterEnd = calendar.finalExams?.firstSemester
      ?.flatMap((e) => e.date || [])
      .slice()
      .sort(compareDesc)[0];
    const secondSemesterStart = calendar.firstDayOfClasses?.secondSemester;
    const secondSemesterEnd = calendar.finalExams?.secondSemester
      ?.flatMap((e) => e.date || [])
      .slice()
      .sort(compareDesc)[0];
    const summerClassesStart = calendar.summerClasses?.firstDayOfClasses?.[0];
    const summerClassesEnd = calendar.summerClasses?.finalExams
      ?.slice()
      .sort(compareDesc)[0];

    const intervals = {
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

    const startMonth =
      calendar.firstDayOfClasses?.firstSemester?.getMonth() ?? 0;
    const endMonth =
      calendar.summerClasses?.deadlineForGradesSubmission
        ?.slice()
        .sort(compareDesc)[0]
        ?.getMonth() ?? 11;

    const asyncSet = new Set(ASYNCHRONOUS_DATES.map(getNormalizedKey));
    const geAsyncSet = new Set(GE_ASYNCHRONOUS_DATES.map(getNormalizedKey));

    const mergedHolidays = [
      ...(calendar.holidays ?? []),
      ...getPhilippineHolidays(calendar.years.start),
      ...getPhilippineHolidays(calendar.years.end),
    ];
    const uniqueHolidaysMap = new Map<string, Set<string>>();
    mergedHolidays.forEach((h) => {
      const normName = h.name.toLowerCase().trim();
      if (!uniqueHolidaysMap.has(normName))
        uniqueHolidaysMap.set(normName, new Set(h.date.map(getNormalizedKey)));
    });

    const startDate = new Date(calendar.years.start, startMonth - 1, 1);
    const endDate = new Date(calendar.years.end, endMonth + 1, 0);

    const current = new Date(startDate);
    while (current <= endDate) {
      const key = getNormalizedKey(current);
      const dateObj = new Date(current);

      let activeSem: SemesterView = "all";
      if (
        intervals.firstSemester &&
        dateObj >= intervals.firstSemester.start &&
        dateObj <= intervals.firstSemester.end
      )
        activeSem = "firstSemester";
      else if (
        intervals.secondSemester &&
        dateObj >= intervals.secondSemester.start &&
        dateObj <= intervals.secondSemester.end
      )
        activeSem = "secondSemester";
      else if (
        intervals.summer &&
        dateObj >= intervals.summer.start &&
        dateObj <= intervals.summer.end
      )
        activeSem = "summer";

      activeSemesterMap.set(key, activeSem);
      isInSchoolClassesMap.set(key, activeSem !== "all");

      const dayEventsArr: CalendarEvent[] = [];
      const dayOfWeek = dateObj.getDay();
      const classType =
        dayOfWeek === 1 || dayOfWeek === 3
          ? "MW"
          : dayOfWeek === 2 || dayOfWeek === 4
            ? "TTh"
            : dayOfWeek === 5
              ? "Fri"
              : dayOfWeek === 6
                ? "Sat"
                : "TBD";

      const addEvent = (
        eventName: string,
        category: string,
        college?: string,
        isSummer = false,
      ) => {
        if (
          !dayEventsArr.some(
            (e) => e.name === eventName && e.college === college,
          )
        ) {
          dayEventsArr.push({ name: eventName, category, college, isSummer });
        }
      };

      if (asyncSet.has(key)) addEvent("Asynchronous Class Session", "asynch");
      if (geAsyncSet.has(key))
        addEvent("GE Asynchronous Class Session", "geasynch");

      calendar.admission?.forEach((admission) => {
        const firstSem = (admission.dates.firstSemester ?? [])
          .slice()
          .sort(compareAsc);
        const secondSem = (admission.dates.secondSemester ?? [])
          .slice()
          .sort(compareAsc);
        if (
          firstSem.length &&
          dateObj >= firstSem[0]! &&
          dateObj <= firstSem[firstSem.length - 1]!
        )
          addEvent(admission.name + " Admission", "admission-day");
        if (firstSem.length && getNormalizedKey(firstSem[0]!) === key)
          addEvent(
            admission.name + " Admission start date",
            "admission-first-day",
          );
        if (
          secondSem.length &&
          dateObj >= secondSem[0]! &&
          dateObj <= secondSem[secondSem.length - 1]!
        )
          addEvent(admission.name + " Admission", "admission-day");
        if (secondSem.length && getNormalizedKey(secondSem[0]!) === key)
          addEvent(
            admission.name + " Admission start date",
            "admission-first-day",
          );
      });

      calendar.registration?.forEach((registration) => {
        const firstSem = (registration.dates.firstSemester ?? [])
          .slice()
          .sort(compareAsc);
        const secondSem = (registration.dates.secondSemester ?? [])
          .slice()
          .sort(compareAsc);
        if (
          firstSem.length &&
          dateObj >= firstSem[0]! &&
          dateObj <= firstSem[firstSem.length - 1]!
        )
          addEvent(registration.name + " Registration", "registration-day");
        if (firstSem.length && getNormalizedKey(firstSem[0]!) === key)
          addEvent(
            registration.name + " Registration start date",
            "registration-first-day",
          );
        if (
          secondSem.length &&
          dateObj >= secondSem[0]! &&
          dateObj <= secondSem[secondSem.length - 1]!
        )
          addEvent(registration.name + " Registration", "registration-day");
        if (secondSem.length && getNormalizedKey(secondSem[0]!) === key)
          addEvent(
            registration.name + " Registration start date",
            "registration-first-day",
          );
      });

      if (
        calendar.firstDayOfClasses?.firstSemester &&
        getNormalizedKey(calendar.firstDayOfClasses.firstSemester) === key
      )
        addEvent("First Day of First Semester", "classes");
      if (
        calendar.firstDayOfClasses?.secondSemester &&
        getNormalizedKey(calendar.firstDayOfClasses.secondSemester) === key
      )
        addEvent("First Day of Second Semester", "classes");

      calendar.preliminaryExams?.firstSemester.forEach((e) =>
        e.date?.forEach(
          (d) =>
            getNormalizedKey(d) === key &&
            addEvent(
              `(${classType}) First Semester Preliminary Exams`,
              "prelim",
              e.college,
            ),
        ),
      );
      calendar.preliminaryExams?.secondSemester.forEach((e) =>
        e.date?.forEach(
          (d) =>
            getNormalizedKey(d) === key &&
            addEvent(
              `(${classType}) Second Semester Preliminary Exams`,
              "prelim",
              e.college,
            ),
        ),
      );
      calendar.midtermExams?.firstSemester.forEach((e) =>
        e.date?.forEach(
          (d) =>
            getNormalizedKey(d) === key &&
            addEvent(
              `(${classType}) First Semester Midterm Exams`,
              "midterm",
              e.college,
            ),
        ),
      );
      calendar.midtermExams?.secondSemester.forEach((e) =>
        e.date?.forEach(
          (d) =>
            getNormalizedKey(d) === key &&
            addEvent(
              `(${classType}) Second Semester Midterm Exams`,
              "midterm",
              e.college,
            ),
        ),
      );
      calendar.finalExams?.firstSemester.forEach((e) =>
        e.date?.forEach(
          (d) =>
            getNormalizedKey(d) === key &&
            addEvent(
              `(${classType}) First Semester Final Exams`,
              "final",
              e.college,
            ),
        ),
      );
      calendar.finalExams?.secondSemester.forEach((e) =>
        e.date?.forEach(
          (d) =>
            getNormalizedKey(d) === key &&
            addEvent(
              `(${classType}) Second Semester Final Exams`,
              "final",
              e.college,
            ),
        ),
      );

      if (
        calendar.lastRecitationDay?.firstSemester?.some(
          (d) => getNormalizedKey(d) === key,
        )
      )
        addEvent("Last Recitation Day", "classes");
      if (
        calendar.lastRecitationDay?.secondSemester?.some(
          (d) => getNormalizedKey(d) === key,
        )
      )
        addEvent("Last Recitation Day", "classes");

      if (
        calendar.postingOfGrades?.firstSemester &&
        getNormalizedKey(calendar.postingOfGrades.firstSemester) === key
      )
        addEvent("Posting of Grades (First Semester)", "grades");
      if (
        calendar.postingOfGrades?.secondSemester &&
        getNormalizedKey(calendar.postingOfGrades.secondSemester) === key
      )
        addEvent("Posting of Grades (Second Semester)", "grades");

      if (
        calendar.summerClasses?.firstDayOfClasses?.some(
          (d) => getNormalizedKey(d) === key,
        )
      )
        addEvent("First Day of Summer Classes", "classes", undefined, true);
      if (
        calendar.summerClasses?.midtermExams?.some(
          (d) => getNormalizedKey(d) === key,
        )
      )
        addEvent(
          "Midterm Exams for Summer Classes",
          "midterm",
          undefined,
          true,
        );
      if (
        calendar.summerClasses?.finalExams?.some(
          (d) => getNormalizedKey(d) === key,
        )
      )
        addEvent("Final Exams for Summer Classes", "final", undefined, true);
      if (
        calendar.summerClasses?.lastRecitationDay?.some(
          (d) => getNormalizedKey(d) === key,
        )
      )
        addEvent(
          "Last Recitation Day for Summer Classes",
          "classes",
          undefined,
          true,
        );
      if (
        calendar.summerClasses?.deadlineForGradesSubmission?.some(
          (d) => getNormalizedKey(d) === key,
        )
      )
        addEvent(
          "Deadline for Grades Submission for Summer Classes",
          "grades",
          undefined,
          true,
        );

      calendar.summerClasses?.admission?.forEach((admission) => {
        const sortedDates = (admission.dates || []).slice().sort(compareAsc);
        if (
          sortedDates.length &&
          admission.dates?.some((d) => getNormalizedKey(d) === key)
        )
          addEvent(
            admission.name + " Summer Admission",
            "admission-day",
            undefined,
            true,
          );
        if (sortedDates.length && getNormalizedKey(sortedDates[0]!) === key)
          addEvent(
            admission.name + " Summer Admission start date",
            "admission-first-day",
            undefined,
            true,
          );
      });

      calendar.summerClasses?.registration?.forEach((registration) => {
        const sortedDates = (registration.dates || []).slice().sort(compareAsc);
        if (
          sortedDates.length &&
          registration.dates?.some((d) => getNormalizedKey(d) === key)
        )
          addEvent(
            registration.name + " Summer Registration",
            "registration-day",
            undefined,
            true,
          );
        if (sortedDates.length && getNormalizedKey(sortedDates[0]!) === key)
          addEvent(
            registration.name + " Summer Registration start date",
            "registration-first-day",
            undefined,
            true,
          );
      });

      uniqueHolidaysMap.forEach((datesSet, holidayName) => {
        if (datesSet.has(key)) {
          const formattedName = holidayName.replace(/\b\w/g, (c) =>
            c.toUpperCase(),
          );
          addEvent(formattedName, "holidays");
        }
      });

      if (dayEventsArr.length > 0) eventsMap.set(key, dayEventsArr);
      current.setDate(current.getDate() + 1);
    }

    const studentTypes: StudentType[] = [
      "all",
      "transferees",
      "cross-registrants",
      "all-curricular",
      "new-graduates",
      "freshmen",
    ];
    const categories = ["admission", "registration"] as const;

    categories.forEach((category) => {
      studentTypes.forEach((targetType) => {
        const posMap = new Map<string, "start" | "middle" | "end">();

        const processRangeItem = (name: string, sortedDates: Date[]) => {
          if (sortedDates.length === 0) return;
          if (targetType !== "all" && getTargetStudentKey(name) !== targetType)
            return;

          const start = sortedDates[0]!;
          const end = sortedDates[sortedDates.length - 1]!;

          const loopCur = new Date(start);
          while (loopCur <= end) {
            const k = getNormalizedKey(loopCur);
            if (getNormalizedKey(start) !== getNormalizedKey(end)) {
              if (k === getNormalizedKey(start)) posMap.set(k, "start");
              else if (k === getNormalizedKey(end)) posMap.set(k, "end");
              else posMap.set(k, "middle");
            }
            loopCur.setDate(loopCur.getDate() + 1);
          }
        };

        (calendar[category] ?? []).forEach((item) => {
          if (item.dates.firstSemester?.length)
            processRangeItem(
              item.name,
              [...item.dates.firstSemester].sort(compareAsc),
            );
          if (item.dates.secondSemester?.length)
            processRangeItem(
              item.name,
              [...item.dates.secondSemester].sort(compareAsc),
            );
        });

        (calendar.summerClasses?.[category] ?? []).forEach((item) => {
          if (item.dates?.length)
            processRangeItem(item.name, [...item.dates].sort(compareAsc));
        });

        rangePositionsMap.set(`${category}-${targetType}`, posMap);
      });
    });

    return {
      eventsMap,
      activeSemesterMap,
      isInSchoolClassesMap,
      rangePositionsMap,
      startMonth,
      endMonth,
    };
  }, [calendar]);

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
            {Array.from(range(precomputedData.startMonth - 1, 12)).map(
              (month) => (
                <Month
                  key={`start-${month}`}
                  year={calendar.years.start}
                  month={month}
                  eventsMap={precomputedData.eventsMap}
                  activeSemesterMap={precomputedData.activeSemesterMap}
                  isInSchoolClassesMap={precomputedData.isInSchoolClassesMap}
                  rangePositionsMap={precomputedData.rangePositionsMap}
                  filters={filters}
                  semesterView={semesterView}
                  asyncView={asyncView}
                  admissionStudentType={admissionStudentType}
                  registrationStudentType={registrationStudentType}
                  examCollege={examCollege}
                />
              ),
            )}

            {Array.from(range(1, precomputedData.endMonth + 1)).map((month) => (
              <Month
                key={`end-${month}`}
                year={calendar.years.end}
                month={month}
                eventsMap={precomputedData.eventsMap}
                activeSemesterMap={precomputedData.activeSemesterMap}
                isInSchoolClassesMap={precomputedData.isInSchoolClassesMap}
                rangePositionsMap={precomputedData.rangePositionsMap}
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
