import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { Redis } from "@upstash/redis";
import { type z } from "zod";
import { TRPCError } from "@trpc/server";
import { CalendarSchema } from "~/lib/types";

const redis = Redis.fromEnv();
type CalendarType = z.infer<typeof CalendarSchema>;

export const calendarRouter = createTRPCRouter({
  get: publicProcedure.query(async (): Promise<CalendarType> => {
    try {
      // 1. Fetch the raw string from Upstash Redis
      const cachedData = await redis.get<string>("calendar_cache");

      if (!cachedData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Calendar data is currently compiling. Please try again shortly.",
        });
      }

      // 2. Parse and validate the cached data against your schema before sending
      const calendarData = CalendarSchema.parse(cachedData);

      // 3. Inject our required legal meta tag along with data if your schema allows,
      // or return the validated object safely.
      return calendarData;

    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: (error as Error).message,
      });
    }
  }),
});