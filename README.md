# Unofficial UE Calendar Project 📅✨

An independent, interactive visual conversion of the official University of the East academic calendar. It exists purely because dense, table layout date ranges are a pain to read through, and I believe a more modern and visually appealing UI is needed.

> **Disclaimer:** This is a personal, open-source project. It is **not affiliated with, authorized, or endorsed by the University of the East**.

---

## 🛑 The "Save My Sanity" Disclaimer (Read Before Using)

### 1. No Affiliation

This repository and its deployed application are entirely unofficial. All data is parsed from public-domain academic calendars released by the university. I do not speak for the university, nor do I represent their administrative department.

### 2. Accuracy & Liability

While every effort is made to extract and sync data accurately via automated cron jobs, anomalies, structure changes, or unannounced updates on the official website can cause items to be missing or incorrect.

- **Do not use this application as your sole source of truth for high-stakes academic deadlines** (e.g., enrollment, adding/dropping subjects, midterm/final exams).
- Always cross-reference critical dates with official university channels. The maintainer accepts zero liability for missed deadlines, crashed schedules, or academic mishaps.

---

## 🛠️ Project State & Tech Stack

Let’s be completely honest: the codebase behind this project is absolute **dog water**. I probably questioned my entire life path and stared at the screen crying while making this. It was born out of pure frustration with standard table layouts, but it gets the job done.

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI
- **State & Data:** TanStack Ecosystem (Router/Query), Zod (for validation parsing)
- **Backend/Storage:** Upstash (Redis/Serverless DB) for scraped calendar data caching. It has a prisma db and next auth built in but has no use.

### The Public API

Yes, the API is public if you know where to look. Feel free to use the parsed endpoints for your own personal developer tools or scripts, provided you handle the data responsibly.

---

## 🤝 Contributing & Support

Because this is an independent project managed entirely by a solo contributor (for now), fixes might happen on a "whenever I have free time" basis. If you can improve this garbage of a code then please, teach me thy ways.

If you spot a data parsing discrepancy or a bug:

1. Open an Issue outlining the incorrect date vs. the official source.
2. Submit a Pull Request if you want to help fix my garbage code.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
_Note: The actual academic schedule data, names, and trademarks belong entirely to their respective rightful owners (University of the East)._
