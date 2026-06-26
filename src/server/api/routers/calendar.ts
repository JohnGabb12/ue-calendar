import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import * as cheerio from "cheerio";
import { TRPCError } from "@trpc/server";
import {
  parse,
  isValid,
  isBefore,
  isSameDay,
  addDays,
  formatDate,
} from "date-fns";
import {
  getDaysArray,
  cleanDateString,
  parseScheduleStringToDates,
} from "~/lib/util";
import { CalendarSchema } from "~/lib/types";

const CALENDAR_URL =
  "https://www.ue.edu.ph/mla/school-calendar-events-activities/" as string;

const CATEGORY_PREFIXES = {
  admission: "-ADMISSION –",
  registration: "– REGISTRATION –",
};

function extractCalendarData(
  html: string,
): z.infer<typeof CalendarSchema> | null {
  const $ = cheerio.load(html);
  let dummy: any = []; // for debugging purposes

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
  const match = title.match(/(\d{4})–(\d{4})/);
  if (!match)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Years are invalid. Regex match failed to extract years from the title.",
    });
  const years: { start: number; end: number } = {
    start: parseInt(match[1] as string),
    end: parseInt(match[2] as string),
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

export const calendarRouter = createTRPCRouter({
  get: publicProcedure.query(
    async (): Promise<z.infer<typeof CalendarSchema>> => {
      try {
        const response = await fetch(CALENDAR_URL, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          next: { revalidate: 86400 }, // 24 hours in seconds
        });

        if (!response.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to fetch calendar data. Status: ${response.status}`,
          });
        }

        const html = await response.text();
        const $ = cheerio.load(html, { xml: true });

        const calendarData = extractCalendarData(html);
        if (!calendarData) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to extract calendar data from the HTML.",
          });
        }
        const calendarTitle = calendarData.title;
        const calendarYears = calendarData.years;

        return CalendarSchema.parse(calendarData);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: (error as Error).message,
        });
      }

      return CalendarSchema.parse({});
    },
  ),
});
