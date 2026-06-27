import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Outfit } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { ThemeProvider } from "~/components/theme-provider";
import { TooltipProvider } from "~/components/ui/tooltip";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "University of the East Calendar",
  description: "A calendar of important dates for the University of the East. Extracts data from the official UE academic calendar.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(geist.variable, "font-sans", outfit.variable)}
      suppressHydrationWarning
    >
      <body>
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
