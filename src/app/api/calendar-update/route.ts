import { NextResponse } from "next/server";
import { success } from "zod/v4";
import * as cheerio from "cheerio";
import {
  parse,
  isValid,
  isBefore,
  isSameDay,
  addDays,
  formatDate,
} from "date-fns";

const CALENDAR_URL =
  "https://www.ue.edu.ph/mla/school-calendar-events-activities/" as string;

const CATEGORY_PREFIXES = {
  admission: "-ADMISSION –",
  registration: "– REGISTRATION –",
};

interface CalendarData {
  title: string;
  years: { start: number; end: number };

  admission?: {
    name: string;
    dates: {
      firstSemester: Date[];
      secondSemester: Date[];
    };
  }[];

  registration?: {
    name: string;
    dates: {
      firstSemester: Date[];
      secondSemester: Date[];
    };
  }[];

  firstDayOfClasses?: {
    firstSemester: Date;
    secondSemester: Date;
  };

  preliminaryExams?: {
    firstSemester: { college: string; date: Date[] }[];
    secondSemester: { college: string; date: Date[] }[];
  };

  midtermExams?: {
    firstSemester: { college: string; date: Date[] }[];
    secondSemester: { college: string; date: Date[] }[];
  };

  finalExams?: {
    firstSemester: { college: string; date: Date[] }[];
    secondSemester: { college: string; date: Date[] }[];
  };

  holidays?: { name: string; date: Date[] }[];

  lastRecitationDay?: {
    firstSemester: Date[];
    secondSemester: Date[];
  };

  postingOfGrades?: {
    firstSemester: Date;
    secondSemester: Date;
  };

  summerClasses: {
    admission?: {
      name: string;
      dates: Date[];
    }[];

    registration?: {
      name: string;
      dates: Date[];
    }[];
    
    firstDayOfClasses?: {
    }
  };

  dummy?: any; // Optional property to satisfy the interface requirement
}

function getDaysArray(start: Date, end: Date): Date[] {
  const arr: Date[] = [];
  let current = new Date(start);

  // Loop until current day passes the end day
  while (isBefore(current, end) || isSameDay(current, end)) {
    arr.push(new Date(current));
    current = addDays(current, 1); // Move to the next day safely
  }
  return arr;
}

function cleanDateString(str: string): string {
  return str
    .replace(/\s*\([A-Za-z]{1,2}\)\s*/g, " ") // Removes "(Th)", "(F)", etc.
    .replace(/\s+/g, " ") // Collapses multiple spaces
    .trim();
}

export function parseScheduleStringToDates(
  input: string,
  currentYear: number,
): Date[] {
  const dates: Date[] = [];
  const cleaned = cleanDateString(input);

  // --- NEW VARIANT 5: Same-Month Short Ranges (e.g., "Jan 04 – 08, 2027") ---
  // Matches: Letters(Month) + Digits(Start Day) + Dash + Digits(End Day) + comma + Year
  const sameMonthRangeMatch = cleaned.match(
    /^([A-Za-z]+)\s+(\d+)\s*[–-]\s*(\d+),?\s*(\d{4})/,
  );

  if (sameMonthRangeMatch) {
    const [_, month, startDay, endDay, year] = sameMonthRangeMatch;

    const startDate = new Date(`${month} ${startDay}, ${year}`);
    const endDate = new Date(`${month} ${endDay}, ${year}`);

    if (isValid(startDate) && isValid(endDate)) {
      return getDaysArray(startDate, endDate);
    }
  }

  // --- VARIANT 1: Multi-Month/Year Ranges (e.g., "May 13 – July 23, 2026") ---
  if (
    cleaned.includes("–") ||
    (cleaned.includes("-") && !/\d\s*-\s*\d/.test(cleaned))
  ) {
    const separators = ["–", "-"];
    let parts: string[] = [];

    for (const sep of separators) {
      if (cleaned.includes(sep)) {
        parts = cleaned.split(sep).map((p) => p.trim());
        break;
      }
    }

    if (parts.length === 2) {
      const yearMatch = (parts[1] as string).match(/,?\s*(\d{4})$/);
      const endYear = yearMatch
        ? parseInt(yearMatch[1] as string)
        : currentYear;

      const startHasYear = /\d{4}/.test(parts[0] as string);
      const startStr = startHasYear ? parts[0] : `${parts[0]}, ${endYear}`;
      const endStr = parts[1];

      const startDate = new Date(startStr as string);
      const endDate = new Date(endStr as string);

      if (isValid(startDate) && isValid(endDate)) {
        return getDaysArray(startDate, endDate);
      }
    }
  }

  // --- VARIANT 2: Detached Dates with "&" (e.g., "Sept 02 & 07") ---
  if (cleaned.includes("&")) {
    const parts = cleaned.split("&").map((p) => p.trim());
    const monthMatch = (parts[0] as string).match(/^([A-Za-z]+)/);

    if (monthMatch) {
      const month = monthMatch[1];
      const yearMatch = (cleaned as string).match(/,?\s*(\d{4})$/);
      const year = yearMatch ? yearMatch[1] : currentYear;

      parts.forEach((part) => {
        const dayMatch = part.match(/\d+/);
        if (dayMatch) {
          const constructedStr = `${month} ${dayMatch[0]}, ${year}`;
          const d = new Date(constructedStr);
          if (isValid(d)) dates.push(d);
        }
      });
      return dates;
    }
  }

  // --- VARIANT 3: Mid-Month Ranges without standalone Year (e.g., "March 24 -28") ---
  const midMonthRangeMatch = cleaned.match(/^([A-Za-z]+)\s+(\d+)\s*-\s*(\d+)/);
  if (midMonthRangeMatch) {
    const [_, month, startDay, endDay] = midMonthRangeMatch;
    const yearMatch = cleaned.match(/,?\s*(\d{4})$/);
    const year = yearMatch ? yearMatch[1] : currentYear;

    const startDate = new Date(`${month} ${startDay}, ${year}`);
    const endDate = new Date(`${month} ${endDay}, ${year}`);

    if (isValid(startDate) && isValid(endDate)) {
      return getDaysArray(startDate, endDate);
    }
  }

  // --- VARIANT 4: Single Dates (e.g., "Sept 04") ---
  const yearMatch = cleaned.match(/,?\s*(\d{4})$/);
  const year = yearMatch ? yearMatch[1] : currentYear;
  const cleanSingle = cleaned.replace(/,?\s*\d{4}$/, "");

  const singleDate = new Date(`${cleanSingle}, ${year}`);
  if (isValid(singleDate)) {
    dates.push(singleDate);
  }

  return dates;
}

function extractCalendarData(html: string): CalendarData | null {
  const $ = cheerio.load(html);
  let dummy: any = []; // for debugging purposes

  // Title
  const title = $("h6 em")
    .first()
    .text()
    .trim()
    .replace("\nManila and Caloocan Campuses", "") // remove footer title
    .replace("- 2", "–2"); // remove extra space in years
  if (!title) throw new Error("Failed to extract title from the HTML.");

  // Years
  const match = title.match(/(\d{4})–(\d{4})/);
  if (!match) throw new Error("Failed to extract years from the title.");
  const years: { start: number; end: number } = {
    start: parseInt(match[1] as string),
    end: parseInt(match[2] as string),
  };
  if (!years) throw new Error("Failed to extract years from the title.");
  if (isNaN(years.start) || isNaN(years.end))
    throw new Error("Failed to extract years from the title.");
  if (years.start < 2000 || years.end < 2000)
    throw new Error("Failed to extract years from the title."); // sonna bakana
  if (years.start > years.end)
    throw new Error("Failed to extract years from the title.");

  // Admission and Registration Table
  const admissionAndRegistrationTable = $("table")
    .has("td strong:contains('ADMISSION & REGISTRATION SCHEDULE')")
    .first();

  type admissionAndRegistrationScheduleEntry = {
    name: string;
    dates: {
      firstSemester: string[];
      secondSemester: string[];
    };
  };
  let admission: admissionAndRegistrationScheduleEntry[] = [];
  let registration: admissionAndRegistrationScheduleEntry[] = [];
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
              firstSemester: dataDate.map((d) =>
                formatDate(d, "LLLL dd, yyyy"),
              ),
              secondSemester: dataDate2.map((d) =>
                formatDate(d, "LLLL dd, yyyy"),
              ),
            },
          });
        } else if (currentCategory === "registration") {
          registration.push({
            name: dataName,
            dates: {
              firstSemester: dataDate.map((d) =>
                formatDate(d, "LLLL dd, yyyy"),
              ),
              secondSemester: dataDate2.map((d) =>
                formatDate(d, "LLLL dd, yyyy"),
              ),
            },
          });
        }
      }
    });

  dummy.push({ admission, registration }); // for debugging purposes

  return { title, years, dummy, summerClasses: {} };
}

export async function GET() {
  try {
    const response = await fetch(CALENDAR_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch calendar data: ${response.status} ${response.statusText}`,
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const calendarData = extractCalendarData(html);
    if (!calendarData) {
      return NextResponse.json({
        success: false,
        error: "Failed to extract calendar data from the HTML.",
      });
    }
    const calendarTitle = calendarData.title;
    const calendarYears = calendarData.years;

    return NextResponse.json({
      success: true,
      message: "Calendar updated successfully",
      data: {
        title: calendarTitle,
        years: calendarYears,
        dummy: calendarData.dummy || null, // Include the dummy property if it exists
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    });
  }
}
