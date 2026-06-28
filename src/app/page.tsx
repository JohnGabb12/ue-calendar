import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import Calendar from "./_components/calendar";
import { FaGithub } from "react-icons/fa";
import Popup from "./_components/popup";
import {ModeToggle} from "~/components/darkmode-button";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <Popup />
      <aside className="fixed top-4 right-4 z-50">
        <ModeToggle />
      </aside>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 w-full selection:bg-primary selection:text-primary-foreground">
        <h1 className="text-4xl font-bold text-center">University of the East Calendar</h1>
        <Calendar />
      </main>
      <footer className="flex w-full items-center flex-col justify-center gap-2 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          Made with hate by
          <a
            href="https://github.com/JohnGabb12/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:text-primary/80"
          >
            <FaGithub />
            <span>JohnGabb12</span>
          </a>
        </p>
        <p>
          Got feedback? Just build your own. The api is public anyway.
        </p>
      </footer>
    </HydrateClient>
  );
}
