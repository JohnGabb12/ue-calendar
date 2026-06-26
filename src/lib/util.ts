import {
  parse,
  isValid,
  isBefore,
  isSameDay,
  addDays,
  formatDate,
} from "date-fns";

export function getDaysArray(start: Date, end: Date): Date[] {
  const arr: Date[] = [];
  let current = new Date(start);

  while (isBefore(current, end) || isSameDay(current, end)) {
    arr.push(new Date(current));
    current = addDays(current, 1);
  }
  return arr;
}

export function cleanDateString(str: string): string {
  return str
    .replace(/\s*\([A-Za-z]{1,2}\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseScheduleStringToDates(
  input: string,
  currentYear: number,
): Date[] {
  const dates: Date[] = [];
  
  // Strip out day-of-the-week markers in parentheticals like (Th), (T), (Wed), etc.
  // This prevents them from confusing the regex or the Date parser.
  const baseCleaned = cleanDateString(input);
  const cleaned = baseCleaned.replace(/\s*\([A-Za-z]+\)/g, "");

  // --- NEW VARIANT 5: Same-Month Short Ranges (e.g., "Jan 04 – 08, 2027") ---
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

  // --- NEW VARIANT 6: Multi-Month Detached Dates with "&" (e.g., "Aug 27 & Sept 01") ---
  // Matches expressions where both sides of the "&" contain their own alphabetical month
  if (cleaned.includes("&")) {
    const parts = cleaned.split("&").map((p) => p.trim());
    const leftHasMonth = /[A-Za-z]+/.test(parts[0] as string);
    const rightHasMonth = /[A-Za-z]+/.test(parts[1] as string);

    if (leftHasMonth && rightHasMonth) {
      const yearMatch = cleaned.match(/,?\s*(\d{4})$/);
      const year = yearMatch ? yearMatch[1] : currentYear;

      // Clean trailing years from individual parts to avoid double-year strings
      const cleanLeft = (parts[0] as string).replace(/,?\s*\d{4}$/, "");
      const cleanRight = (parts[1] as string).replace(/,?\s*\d{4}$/, "");

      const dateLeft = new Date(`${cleanLeft}, ${year}`);
      const dateRight = new Date(`${cleanRight}, ${year}`);

      if (isValid(dateLeft)) dates.push(dateLeft);
      if (isValid(dateRight)) dates.push(dateRight);

      return dates;
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