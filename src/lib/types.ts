import { z } from "zod";

export type CalendarData = {
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

    firstDayOfClasses?: Date[];
    midtermExams?: Date[];
    finalExams?: Date[];
    lastRecitationDay?: Date[];
    deadlineForGradesSubmission?: Date[];
  };

  dummy?: []; // Optional property to satisfy the interface requirement
};

export const CalendarSchema = z.object({
  title: z.string(),
  years: z.object({
    start: z.number(),
    end: z.number(),
  }),

  admission: z
    .array(
      z.object({
        name: z.string(),
        dates: z.object({
          firstSemester: z.array(z.coerce.date()),
          secondSemester: z.array(z.coerce.date()),
        }),
      }),
    )
    .optional(),

  registration: z
    .array(
      z.object({
        name: z.string(),
        dates: z.object({
          firstSemester: z.array(z.coerce.date()),
          secondSemester: z.array(z.coerce.date()),
        }),
      }),
    )
    .optional(),

  firstDayOfClasses: z
    .object({
      firstSemester: z.coerce.date(),
      secondSemester: z.coerce.date(),
    })
    .optional(),

  preliminaryExams: z
    .object({
      firstSemester: z.array(
        z.object({ college: z.string(), date: z.array(z.coerce.date()) }),
      ),
      secondSemester: z.array(
        z.object({ college: z.string(), date: z.array(z.coerce.date()) }),
      ),
    })
    .optional(),

  midtermExams: z
    .object({
      firstSemester: z.array(
        z.object({ college: z.string(), date: z.array(z.coerce.date()) }),
      ),
      secondSemester: z.array(
        z.object({ college: z.string(), date: z.array(z.coerce.date()) }),
      ),
    })
    .optional(),

  finalExams: z
    .object({
      firstSemester: z.array(
        z.object({ college: z.string(), date: z.array(z.coerce.date()) }),
      ),
      secondSemester: z.array(
        z.object({ college: z.string(), date: z.array(z.coerce.date()) }),
      ),
    })
    .optional(),

  departmentalExam: z.coerce.date().optional(),

  holidays: z
    .array(
      z.object({
        name: z.string(),
        date: z.array(z.coerce.date()),
      }),
    )
    .optional(),

  lastRecitationDay: z
    .object({
      firstSemester: z.array(z.coerce.date()),
      secondSemester: z.array(z.coerce.date()),
    })
    .optional(),

  postingOfGrades: z
    .object({
      firstSemester: z.coerce.date(),
      secondSemester: z.coerce.date(),
    })
    .optional(),

  summerClasses: z.object({
    admission: z
      .array(
        z.object({
          name: z.string(),
          dates: z.array(z.coerce.date()),
        }),
      )
      .optional(),

    registration: z
      .array(
        z.object({
          name: z.string(),
          dates: z.array(z.coerce.date()),
        }),
      )
      .optional(),

    firstDayOfClasses: z.array(z.coerce.date()).optional(),
    midtermExams: z.array(z.coerce.date()).optional(),
    finalExams: z.array(z.coerce.date()).optional(),
    lastRecitationDay: z.array(z.coerce.date()).optional(),
    deadlineForGradesSubmission: z.array(z.coerce.date()).optional(),
  }).optional(),

  dummy: z.any().optional(),
});
