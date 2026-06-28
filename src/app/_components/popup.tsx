"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertTriangleIcon, InfoIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export default function Popup() {
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hasSeenPopup");
    if (!hasSeenPopup) {
      setOpen(true);
      localStorage.setItem("hasSeenPopup", "true");
    }
  }, []);

  function handleClose() {
    localStorage.setItem("hasSeenPopup", "true");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-3xl font-bold">
            Welcome to the University of the East Calendar
          </AlertDialogTitle>
          <AlertDialogDescription className="text-md mt-4 flex flex-col gap-3 text-justify">
            <div className="mx-auto mb-4 flex items-center gap-2 text-center text-xs">
              Made with hate by
              <a
                href="https://github.com/JohnGabb12/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 flex items-center gap-2"
              >
                <FaGithub />
                <span>JohnGabb12</span>
              </a>
            </div>
            <p className="indent-10">
              This calendar is a conversion from the official University of the
              East calendar, which is available on their website.
            </p>
            <p className="indent-10">
              It is designed to be a bit more readable because UE likes tables
              and I hate reading date ranges.
            </p>
            <p className="indent-10">
              I added filters and such to make it easier to find what you are
              looking for.{" "}
              <mark className="bg-transparent text-red-500/50">
                Asynchronous dates (If we ever gonna have one this semester) are
                not final because it is not released.
              </mark>{" "}
              In the mean time it is defaulted to hidden.
            </p>
            <p className="indent-10">
              This project is pure dog water and I hate every line of code in
              it. Especially to the ones who created the official calendar.
            </p>
            <Alert className="mt-4 border-blue-500/50 bg-blue-50 text-blue-800 dark:border-blue-400/50 dark:bg-blue-900/50 dark:text-blue-300">
              <InfoIcon />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                This calendar is not official and was just grabbed from the
                official website. If you find any errors either contact me or
                create one. The API is public if you know where to look.
              </AlertDescription>
            </Alert>
            <Alert className="mt-4 border-orange-500/50 bg-orange-50 text-orange-800 dark:border-orange-400/50 dark:bg-orange-900/50 dark:text-orange-300">
              <AlertTriangleIcon />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Due to the nature of the official calendar, some dates may be
                missing or incorrect. Blame UE for that. But I may fix it
                eventually. Especially if they add another type date variant
                like why?.
              </AlertDescription>
            </Alert>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
