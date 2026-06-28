"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertTriangleIcon, InfoIcon, ExternalLinkIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export default function Popup() {
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hasSeenPopup");
    if (!hasSeenPopup) {
      setOpen(true);
    }
  }, []);

  function handleClose() {
    localStorage.setItem("hasSeenPopup", "true");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {/* w-[92%] avoids hugging the screen edges on tiny devices */}
      <AlertDialogContent className="w-[92%] max-w-md rounded-2xl md:max-w-lg md:rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="w-full text-center text-xl font-bold tracking-tight md:text-2xl">
            Independent UE Calendar Project
          </AlertDialogTitle>

          <div className="mx-auto mt-1 flex items-center gap-1.5 text-center text-xs text-muted-foreground">
            Created by
            <a
              href="https://github.com/JohnGabb12/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <FaGithub className="h-3 w-3" />
              <span>JohnGabb12</span>
            </a>
          </div>

          {/* max-h-[55vh] ensures the dialog contents never spill outside the phone window */}
          <AlertDialogDescription className="mt-4 flex max-h-[55vh] flex-col gap-3 overflow-y-auto pr-1 text-left text-sm leading-relaxed scrollbar-thin md:max-h-none md:overflow-visible md:pr-0 md:text-justify">
            <p className="indent-6 md:indent-8">
              This application is an{" "}
              <span className="font-semibold text-foreground">
                independent visual conversion
              </span>{" "}
              of the official University of the East calendar. It exists purely
              because dense, text-heavy layout tables are an absolute pain to
              scroll through, and we firmly believe academic date ranges
              shouldn&apos;t require a map and compass to navigate. Consider this
              a developer&apos;s love-letter to modern, interactive filters.
            </p>

            <p className="indent-6 md:indent-8">
              <span className="font-semibold text-foreground">
                Asynchronous Dates Notice:
              </span>{" "}
              Unannounced or tentative asynchronous dates are omitted or hidden
              by default as they have not been finalized or officially declared
              by the university administration.
            </p>

            <p className="indent-6 md:indent-8">
              Admittedly, the codebase behind this project is absolute dog water,
              and I probably refactored every line while crying in a corner. But
              hey, it gets the job done and saves us all from wrestling with the
              official table layouts! If you want to fix my code, check out the{" "}
              <a
                href="https://github.com/JohnGabb12/ue-calendar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub repository
              </a>
              .
            </p>

            <Alert className="mt-2 border-blue-500/30 bg-blue-50/50 p-3 text-blue-900 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="font-semibold text-xs md:text-sm">
                Independent Project Disclaimer
              </AlertTitle>
              <AlertDescription className="mt-1 text-[11px] leading-normal md:text-xs">
                This platform is a personal, open-source tool and is{" "}
                <mark className="bg-transparent font-semibold text-blue-700 dark:text-blue-400">
                  not affiliated with, authorized, or endorsed by the University
                  of the East
                </mark>
                . All official data is scraped directly from the public domain.
              </AlertDescription>
            </Alert>

            <Alert className="mt-1 border-amber-500/30 bg-amber-50/50 p-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="font-semibold text-xs md:text-sm">
                Liability & Accuracy Warning
              </AlertTitle>
              <AlertDescription className="mt-1 text-[11px] leading-normal md:text-xs">
                While every effort is made to parse information accurately, data
                anomalies or structure changes on the official site may result
                in missing or incorrect dates.{" "}
                <mark className="bg-transparent font-semibold text-amber-700 dark:text-amber-400">
                  Do not use this calendar as your sole source for academic
                  deadlines.
                </mark>{" "}
                Always cross-reference critical dates with the official
                channels.
              </AlertDescription>
            </Alert>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Stacks buttons on mobile, makes them rows on desktop */}
        <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <a
            href="https://www.ue.edu.ph/mla/school-calendar-events-activities/"
            target="_blank"
            rel="noopener noreferrer"
            className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center gap-1.5 rounded-md border px-4 py-2 text-xs font-medium shadow-sm w-full sm:w-auto"
          >
            <span>View Official Source</span>
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
          <AlertDialogCancel
            onClick={handleClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 m-0 h-10 w-full sm:w-auto"
          >
            Acknowledge & Continue
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}