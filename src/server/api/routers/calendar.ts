import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { type z } from "zod";
import * as cheerio from "cheerio";
import { TRPCError } from "@trpc/server";
import {
  parseScheduleStringToDates,
} from "~/lib/util";
import { CalendarSchema } from "~/lib/types";

const CALENDAR_URL =
  "https://www.ue.edu.ph/mla/school-calendar-events-activities/" as string;

const CATEGORY_PREFIXES = {
  admission: "-ADMISSION –",
  registration: "– REGISTRATION –",
};

type CalendarType = z.infer<typeof CalendarSchema>;

function extractCalendarData(html: string): CalendarType | null {
  const $ = cheerio.load(html, { xml: true });
  // let dummy: any = []; // for debugging purposes

  // Title
  const title = $("h6 em")
    .first()
    .text()
    .trim()
    .replace("\nManila and Caloocan Campuses", "") // remove footer title
    .replace("- 2", "–2"); // remove extra space in years
  if (!title)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to extract title from the HTML.",
    });

  // Years
  const match = /(\d{4})–(\d{4})/.exec(title);
  if (!match)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Years are invalid. Regex match failed to extract years from the title.",
    });
  const years: { start: number; end: number } = {
    start: parseInt(match[1]!),
    end: parseInt(match[2]!),
  };
  if (!years)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to extract years from the title.",
    });
  if (isNaN(years.start) || isNaN(years.end))
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to extract years from the title.",
    });
  if (years.start < 2000 || years.end < 2000)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Years are invalid. Start year is less than 2000.",
    }); // sonna bakana
  if (years.start > years.end)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Years are invalid. Start year is greater than end year.",
    });

  // Admission and Registration Table
  const admissionAndRegistrationTable = $("table")
    .has("td strong:contains('ADMISSION & REGISTRATION SCHEDULE')")
    .first();

  type admissionAndRegistrationScheduleEntry = {
    name: string;
    dates: {
      firstSemester: Date[];
      secondSemester: Date[];
    };
  };
  const admission: admissionAndRegistrationScheduleEntry[] = [];
  const registration: admissionAndRegistrationScheduleEntry[] = [];
  let currentCategory: "admission" | "registration" | null = null;

  $(admissionAndRegistrationTable)
    .find("tr")
    .each((_, row) => {
      const cells = $(row).find("td");
      if (
        cells.length == 1 &&
        (cells.text().includes(CATEGORY_PREFIXES.admission) ||
          cells.text().includes(CATEGORY_PREFIXES.registration))
      ) {
        if (cells.text().includes(CATEGORY_PREFIXES.admission)) {
          currentCategory = "admission";
        } else if (cells.text().includes(CATEGORY_PREFIXES.registration)) {
          currentCategory = "registration";
        }
      } else {
        const dataName = $(cells[0]).text().trim();

        // first year (first cell)
        const dataDateText = $(cells[1]).text().trim();
        const dataDate = parseScheduleStringToDates(dataDateText, years.start);

        // second year (second cell)
        const dataDateText2 = $(cells[2]).text().trim();
        const dataDate2 = parseScheduleStringToDates(dataDateText2, years.end);

        if (currentCategory === "admission") {
          admission.push({
            name: dataName,
            dates: {
              firstSemester: dataDate,
              secondSemester: dataDate2,
            },
          });
        } else if (currentCategory === "registration") {
          registration.push({
            name: dataName,
            dates: {
              firstSemester: dataDate,
              secondSemester: dataDate2,
            },
          });
        }
      }
    });

  // School Calendar
  const schoolCalendarTable = $("table")
    .has("td strong:contains('SCHOOL CALENDAR')")
    .first();

  // first day of classes
  const firstDayOfClassesObject = $(schoolCalendarTable)
    .find("tr")
    .has('td:contains("FIRST DAY OF REGULAR CLASSES")');
  const firstDayOfClasses = {
    firstSemester: parseScheduleStringToDates(
      $(firstDayOfClassesObject).find("td").eq(1).text().trim(),
      years.start,
    )[0],
    secondSemester: parseScheduleStringToDates(
      $(firstDayOfClassesObject).find("td").eq(2).text().trim(),
      years.end,
    )[0],
  };
  if (!firstDayOfClasses.firstSemester || !firstDayOfClasses.secondSemester)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "First day of classes not parsed correctly.",
    });

  // exams
  const preliminaryExams = {
    firstSemester: [] as { college: string; date: Date[] }[],
    secondSemester: [] as { college: string; date: Date[] }[],
  };
  const midtermExams = {
    firstSemester: [] as { college: string; date: Date[] }[],
    secondSemester: [] as { college: string; date: Date[] }[],
  };
  const finalExams = {
    firstSemester: [] as { college: string; date: Date[] }[],
    secondSemester: [] as { college: string; date: Date[] }[],
  };

  // get colleges
  const collegesRow = $(schoolCalendarTable)
    .find("tr")
    .has('td:contains("CAS")')
    .first();
  const collegesExamA = $(collegesRow)
    .find("td")
    .eq(0)
    .text()
    .trim()
    .split(",")
    .map((college) => college.trim());
  if (collegesExamA.length === 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Colleges A not parsed correctly.",
    });
  }
  const collegesGraduateRow = $(schoolCalendarTable)
    .find("tr")
    .has('td:contains("Graduate")')
    .first();
  const collegesExamB = $(collegesGraduateRow)
    .find("td")
    .eq(0)
    .text()
    .trim()
    .split(/,|\&/) // Splits on either ',' OR '&'
    .map((college) => college.trim())
    .filter((college) => college.length > 0); // Bonus: removes any empty strings
  if (collegesExamB.length === 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Colleges B not parsed correctly.",
    });
  }

  const collegesExam = [...collegesExamA, ...collegesExamB];
  collegesExam.forEach((college) => {
    // may encounter error in the future
    preliminaryExams.firstSemester.push({
      college: college,
      date: [],
    });
    preliminaryExams.secondSemester.push({
      college: college,
      date: [],
    });
    midtermExams.firstSemester.push({
      college: college,
      date: [],
    });
    midtermExams.secondSemester.push({
      college: college,
      date: [],
    });
    finalExams.firstSemester.push({
      college: college,
      date: [],
    });
    finalExams.secondSemester.push({
      college: college,
      date: [],
    });
  });

  const lastRecitationDay: { firstSemester: Date[]; secondSemester: Date[] } = {
    firstSemester: [],
    secondSemester: [],
  };
  let departmentalExams: Date = new Date(0);

  let currentHeader:
    | "PRELIMINARY EXAMINATIONS"
    | "MIDTERM EXAMINATIONS"
    | "FINAL EXAMINATIONS"
    | "LAST RECITATION DAY"
    | null = null;

  let currentColleges: "CAS" | "Graduate" | "All" | null = null;

  let postingOfGrades: { firstSemester: Date; secondSemester: Date } = {
    firstSemester: new Date(0),
    secondSemester: new Date(0),
  };

  $(schoolCalendarTable)
    .find("tr")
    .each((_, row) => {
      const cells = $(row).find("td");
      if ($(row).text().length === 0) return; // skip empty rows
      const dataName = $(cells[0]).text().trim();

      // header detection
      if (dataName === "PRELIMINARY EXAMINATIONS") {
        currentHeader = "PRELIMINARY EXAMINATIONS";
        currentColleges = "All";
        return;
      } else if (dataName === "MIDTERM EXAMINATIONS") {
        currentHeader = "MIDTERM EXAMINATIONS";
        currentColleges = "All";
        return;
      } else if (dataName === "FINAL EXAMINATIONS") {
        currentHeader = "FINAL EXAMINATIONS";
        currentColleges = "All";
        return;
      } else if (dataName === "LAST RECITATION DAY") {
        currentHeader = "LAST RECITATION DAY";
        currentColleges = "All";
        return;
      } else if (cells.length < 3) {
        currentHeader = null;
        return;
      } else if ($(cells[0]).text().includes("CAS")) {
        currentColleges = "CAS";
        return;
      } else if ($(cells[0]).text().includes("Graduate")) {
        currentColleges = "Graduate";
        return;
      }
      if (currentHeader === null) return; // skip rows that are not under a header

      // get dates
      const dataDateText = $(cells[1]).text().trim();
      const dataDateText2 = $(cells[2]).text().trim();

      // departmental exam
      if (dataName.includes("Departmental Examinations")) {
        const tempDate = parseScheduleStringToDates(dataDateText, years.start);
        if (tempDate.length > 1) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Departmental Examinations should only have one date. Found ${tempDate.length} dates.`,
          });
        }
        departmentalExams = tempDate[0] ?? new Date(0);
        return;
      }

      // validation for date parsing
      if (!dataDateText || !dataDateText2) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to extract dates for ${dataName}.`,
        });
      }
      if (dataDateText.length < 1 || dataDateText2.length < 1) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to extract dates for ${dataName}.`,
        });
      }

      const dataDate = parseScheduleStringToDates(dataDateText, years.start);
      const dataDate2 = parseScheduleStringToDates(dataDateText2, years.end);

      if (dataName.includes("LAST DAY OF POSTING")) {
        postingOfGrades = {
          firstSemester: dataDate[0] ?? new Date(0),
          secondSemester: dataDate2[0] ?? new Date(0),
        };
        return;
      }

      if (currentHeader === "PRELIMINARY EXAMINATIONS") {
        preliminaryExams.firstSemester.forEach((exam) => {
          if (
            (currentColleges === "CAS" &&
              collegesExamA.includes(exam.college)) ||
            (currentColleges === "Graduate" &&
              collegesExamB.includes(exam.college)) ||
            currentColleges === "All"
          ) {
            exam.date.push(...dataDate);
          }
        });
        preliminaryExams.secondSemester.forEach((exam) => {
          if (
            (currentColleges === "CAS" &&
              collegesExamA.includes(exam.college)) ||
            (currentColleges === "Graduate" &&
              collegesExamB.includes(exam.college)) ||
            currentColleges === "All"
          ) {
            exam.date.push(...dataDate2);
          }
        });
      } else if (currentHeader === "MIDTERM EXAMINATIONS") {
        midtermExams.firstSemester.forEach((exam) => {
          if (
            (currentColleges === "CAS" &&
              collegesExamA.includes(exam.college)) ||
            (currentColleges === "Graduate" &&
              collegesExamB.includes(exam.college)) ||
            currentColleges === "All"
          ) {
            exam.date.push(...dataDate);
          }
        });
        midtermExams.secondSemester.forEach((exam) => {
          if (
            (currentColleges === "CAS" &&
              collegesExamA.includes(exam.college)) ||
            (currentColleges === "Graduate" &&
              collegesExamB.includes(exam.college)) ||
            currentColleges === "All"
          ) {
            exam.date.push(...dataDate2);
          }
        });
      } else if (currentHeader === "FINAL EXAMINATIONS") {
        finalExams.firstSemester.forEach((exam) => {
          if (
            (currentColleges === "CAS" &&
              collegesExamA.includes(exam.college)) ||
            (currentColleges === "Graduate" &&
              collegesExamB.includes(exam.college)) ||
            currentColleges === "All"
          ) {
            exam.date.push(...dataDate);
          }
        });
        finalExams.secondSemester.forEach((exam) => {
          if (
            (currentColleges === "CAS" &&
              collegesExamA.includes(exam.college)) ||
            (currentColleges === "Graduate" &&
              collegesExamB.includes(exam.college)) ||
            currentColleges === "All"
          ) {
            exam.date.push(...dataDate2);
          }
        });
      } else if (currentHeader === "LAST RECITATION DAY") {
        lastRecitationDay.firstSemester.push(...dataDate);
        lastRecitationDay.secondSemester.push(...dataDate2);
      }
    });

  const summerClassesTable = $("table")
    .has("td strong:contains('I. SCHEDULE OF ADMISSION')")
    .first();

  let currentSummerCategory: "admission" | "registration" | "calendar" | null =
    null;

  const summerClassesAdmission: { name: string; dates: Date[] }[] = [];
  const summerClassesRegistration: { name: string; dates: Date[] }[] = [];
  const summerClassesFirstDayOfClasses: Date[] = [];
  const summerClassesMidtermExams: Date[] = [];
  const summerClassesFinalExams: Date[] = [];
  const summerClassesLastRecitationDay: Date[] = [];
  const summerClassesDeadlineForGradesSubmission: Date[] = [];

  $(summerClassesTable)
    .find("tr")
    .each((_, row) => {
      const cells = $(row).find("td");
      if ($(row).text().length === 0) return; // skip empty rows
      if (cells.length === 1) {
        const cellText = $(cells[0]).text().trim();
        if (cellText.includes("ADMISSION")) {
          currentSummerCategory = "admission";
        } else if (cellText.includes("REGISTRATION")) {
          currentSummerCategory = "registration";
        } else if (cellText.includes("SCHOOL CALENDAR")) {
          currentSummerCategory = "calendar";
        }
        return; // Skip to the next row after setting the category
      }

      const dataName = $(cells[0]).text().trim();
      const dataDateText = $(cells[1]).text().trim();
      const dataDate = parseScheduleStringToDates(dataDateText, years.end);

      if (currentSummerCategory === "admission") {
        summerClassesAdmission.push({ name: dataName, dates: dataDate });
      } else if (currentSummerCategory === "registration") {
        summerClassesRegistration.push({ name: dataName, dates: dataDate });
      } else if (currentSummerCategory === "calendar") {
        if (dataName.includes("FIRST DAY OF REGULAR CLASSES")) {
          summerClassesFirstDayOfClasses.push(...dataDate);
        } else if (dataName.includes("MID-TERM EXAMINATIONS")) {
          summerClassesMidtermExams.push(...dataDate);
        } else if (dataName.includes("FINAL EXAMINATIONS")) {
          summerClassesFinalExams.push(...dataDate);
        } else if (dataName.includes("LAST RECITATION DAY")) {
          summerClassesLastRecitationDay.push(...dataDate);
        } else if (dataName.includes("DEADLINE FOR POSTING OF STUDENTS")) {
          summerClassesDeadlineForGradesSubmission.push(...dataDate);
        }
      }
    });

  const summerClasses = {
    admission:
      summerClassesAdmission.length > 0 ? summerClassesAdmission : undefined,
    registration:
      summerClassesRegistration.length > 0
        ? summerClassesRegistration
        : undefined,
    firstDayOfClasses:
      summerClassesFirstDayOfClasses.length > 0
        ? summerClassesFirstDayOfClasses
        : undefined,
    midtermExams:
      summerClassesMidtermExams.length > 0
        ? summerClassesMidtermExams
        : undefined,
    finalExams:
      summerClassesFinalExams.length > 0 ? summerClassesFinalExams : undefined,
    lastRecitationDay:
      summerClassesLastRecitationDay.length > 0
        ? summerClassesLastRecitationDay
        : undefined,
    deadlineForGradesSubmission:
      summerClassesDeadlineForGradesSubmission.length > 0
        ? summerClassesDeadlineForGradesSubmission
        : undefined,
  };

  return {
    title,
    years,
    admission: admission,
    registration: registration,
    firstDayOfClasses: firstDayOfClasses,
    preliminaryExams: preliminaryExams,
    midtermExams: midtermExams,
    finalExams: finalExams,
    departmentalExam: departmentalExams,
    lastRecitationDay: lastRecitationDay,
    summerClasses: summerClasses,
    postingOfGrades: postingOfGrades,
    // dummy,
  } as CalendarType;
}

export const calendarRouter = createTRPCRouter({
  get: publicProcedure.query(async (): Promise<CalendarType> => {
    try {
      const response = await fetch(CALENDAR_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        next: { revalidate: 60 * 60 * 24 }, // 24 hours in seconds
      });

      if (!response.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch calendar data. Status: ${response.status}`,
        });
      }

      const html = await response.text();

      const extractedData = extractCalendarData(html);
      if (!extractedData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to extract calendar data from the HTML.",
        });
      }
      const calendarData = CalendarSchema.parse(extractCalendarData(html));
      if (!calendarData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate calendar data against the schema.",
        });
      }

      return calendarData;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: (error as Error).message,
      });
    }

    return CalendarSchema.parse({});
  }),
});
