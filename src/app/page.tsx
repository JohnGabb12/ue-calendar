import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import Calendar from "./_components/calendar";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 w-full selection:bg-primary selection:text-primary-foreground">
        <h1 className="text-4xl font-bold text-center">University of the East Calendar</h1>
        <Calendar />
      </main>
    </HydrateClient>
  );
}
