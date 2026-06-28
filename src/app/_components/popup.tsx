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
      <AlertDialogContent className="max-w-md md:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="w-full text-center text-2xl font-bold tracking-tight">
            UE Calendar Project
          </AlertDialogTitle>

          <div className="text-muted-foreground mx-auto mt-1 flex items-center gap-1.5 text-center text-xs">
            Created by
            <a
              href="https://github.com/JohnGabb12/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary flex items-center gap-1 font-medium hover:underline"
            >
              <FaGithub className="h-3 w-3" />
              <span>JohnGabb12</span>
            </a>
          </div>

          <AlertDialogDescription className="mt-4 flex flex-col gap-3 text-justify text-sm leading-relaxed">
            <p className="indent-8">
              This application is an{" "}
              <span className="text-foreground font-semibold">
                independent visual conversion
              </span>{" "}
              of the official University of the East calendar. It exists purely
              because dense, table layout date ranges are a pain to read
              through, and I believe a more modern and visually appealing UI is
              needed. Consider this a developer&apos;s attempt to make it more
              gorgeous.
            </p>

            <p className="indent-8">
              <span className="text-foreground font-semibold">
                Asynchronous Dates Notice:
              </span>{" "}
              Unannounced or tentative asynchronous dates are omitted or hidden
              by default as they have not been finalized or officially declared
              by the university administration.
            </p>

            <p className="indent-8">
              The codebase behind this project is dog water and every single
              line of it is not optimized. If you are a developer and want to
              contribute, feel free to check out the{" "}
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

            <Alert className="mt-2 border-blue-500/30 bg-blue-50/50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="font-semibold">
                Independent Project Disclaimer
              </AlertTitle>
              <AlertDescription className="mt-1 text-xs leading-normal">
                This platform is{" "}
                <mark className="bg-transparent text-blue-600 dark:text-blue-400">
                  not affiliated with, authorized, or endorsed by the University
                  of the East
                </mark>
                . All official data is scraped directly from the public domain.
                The project API is open-source and accessible for developers.
              </AlertDescription>
            </Alert>

            <Alert className="mt-1 border-amber-500/30 bg-amber-50/50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="font-semibold">
                Liability & Accuracy Warning
              </AlertTitle>
              <AlertDescription className="mt-1 text-xs leading-normal">
                While every effort is made to parse information accurately, data
                anomalies or structure changes on the official site may result
                in missing or incorrect dates.{" "}
                <mark className="bg-transparent text-amber-600 dark:text-amber-400">
                  Do not use this calendar as your sole source for academic
                  deadlines, registrations, or examinations.
                </mark>{" "}
                Always cross-reference critical dates with the official
                channels.
              </AlertDescription>
            </Alert>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            href="https://www.ue.edu.ph/mla/school-calendar-events-activities/"
            target="_blank"
            rel="noopener noreferrer"
            className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium shadow-sm"
          >
            <span>View Official Source</span>
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
          <AlertDialogCancel
            onClick={handleClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 sm:mt-0"
          >
            Acknowledge & Continue
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
