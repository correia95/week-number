# Week Number

The current **ISO 8601** week number, and the week for any date you pick.

- ISO weeks start Monday; week 1 contains the year's first Thursday / 4 January. The
  `isoWeek` function fits the Thursday of the current week, then measures whole weeks
  from that year's first Thursday.
- Per-date details: ISO week + year, ISO weekday, Mon–Sun range, day of the year,
  quarter, and the **US Sunday-start** week number for comparison.
- Month mini-calendar with a week-number column; click a day to jump to it.
- Locale date formatting (`toLocaleDateString(undefined, …)`); `?d=YYYY-MM-DD` URL.
- Verified against the classic boundary cases (2025-12-29 → 2026-W01, 2021-01-01 →
  2020-W53, 53-week detection for 2020 & 2026). Works offline.

## Develop

```
npm install
npm run dev
npm run build
```

Week maths: [`src/week.ts`](src/week.ts). Static site on Cloudflare Workers.

Part of [Tiny Tools](https://tinytools.correia95.workers.dev).
