import { useEffect, useMemo, useState } from 'react';
import { analyse, fromISODate, isoWeek, monthWeeks, toISODate } from './week.ts';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function readInitial(): Date {
  try {
    const p = new URLSearchParams(location.search).get('d');
    if (p) {
      const d = fromISODate(p);
      if (d) return d;
    }
  } catch {
    /* ignore */
  }
  return new Date();
}

export default function App() {
  const [date, setDate] = useState<Date>(readInitial);
  const [view, setView] = useState({ y: date.getFullYear(), m: date.getMonth() });
  const [copied, setCopied] = useState(false);

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const info = useMemo(() => analyse(date), [date]);
  const weeks = useMemo(() => monthWeeks(view.y, view.m), [view]);
  const todayWeek = isoWeek(today);

  useEffect(() => {
    try {
      const u = new URL(location.href);
      u.searchParams.set('d', toISODate(date));
      history.replaceState(null, '', u.toString());
    } catch {
      /* ignore */
    }
  }, [date]);

  const dl = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const dshort = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  const pick = (d: Date) => {
    setDate(d);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };
  const shift = (n: number) => {
    const m = view.m + n;
    setView({ y: view.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(
        `${dl(date)} is ISO week ${info.isoWeek} of ${info.isoYear} (${toISODate(info.mondayOfWeek)} to ${toISODate(info.sundayOfWeek)}).`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Week Number</h1>
        <p className="tag">
          What week is it? This shows the <b>ISO 8601</b> week number — weeks start on Monday and
          week 1 is the one containing the first Thursday of the year — for today or any date you
          pick.
        </p>
      </header>

      <div className="hero">
        <span>{isToday ? 'This week is' : `Week of ${dshort(date)}`}</span>
        <strong>{info.isoWeek}</strong>
        <em>
          ISO {info.isoYear}-W{String(info.isoWeek).padStart(2, '0')} · week {info.isoWeek} of{' '}
          {info.weeksInIsoYear}
        </em>
        {!isToday && (
          <button className="today" onClick={() => pick(new Date())}>
            Back to today (week {todayWeek.week})
          </button>
        )}
      </div>

      <label className="datepick">
        <span>Check another date</span>
        <input
          type="date"
          value={toISODate(date)}
          onChange={(e) => {
            const d = fromISODate(e.target.value);
            if (d) pick(d);
          }}
        />
      </label>

      <p className="full">{dl(date)}</p>

      <dl className="rows">
        <div>
          <dt>Day of the week</dt>
          <dd>{DOW[info.isoWeekday - 1]} (ISO weekday {info.isoWeekday})</dd>
        </div>
        <div>
          <dt>Week runs</dt>
          <dd>
            {dshort(info.mondayOfWeek)} – {dshort(info.sundayOfWeek)}
          </dd>
        </div>
        <div>
          <dt>Day of the year</dt>
          <dd>{info.dayOfYear}</dd>
        </div>
        <div>
          <dt>Quarter</dt>
          <dd>Q{info.quarter}</dd>
        </div>
        <div>
          <dt>US week number (Sun-start)</dt>
          <dd>{info.usWeek}</dd>
        </div>
      </dl>

      <button className="share" onClick={share}>
        {copied ? 'Copied' : 'Copy'}
      </button>

      <div className="cal">
        <div className="calhead">
          <button onClick={() => shift(-1)} aria-label="Previous month">
            ‹
          </button>
          <span>
            {MONTHS[view.m]} {view.y}
          </span>
          <button onClick={() => shift(1)} aria-label="Next month">
            ›
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th className="wk">Wk</th>
              {DOW.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((row, i) => (
              <tr key={i} className={row.week === info.isoWeek && info.isoYear === (row.days.find(Boolean)?.getFullYear() ?? view.y) ? 'active' : ''}>
                <td className="wk">{row.week}</td>
                {row.days.map((d, j) => (
                  <td
                    key={j}
                    className={d && sameDay(d, date) ? 'sel' : d && sameDay(d, today) ? 'now' : ''}
                    onClick={() => d && pick(d)}
                  >
                    {d ? d.getDate() : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="explainer">
        <h2>ISO week numbers</h2>
        <p>
          The ISO 8601 standard (used across Europe and in most business software) numbers the weeks
          of the year. A week always runs <b>Monday to Sunday</b>, and week 1 is the first week with
          a majority of its days in the new year — equivalently, the week containing that year's
          first Thursday, or the week containing 4 January. So the first few days of January can fall
          in the last week (52 or 53) of the previous ISO year, and vice versa.
        </p>
        <h3>Why some years have 53 weeks</h3>
        <p>
          Most ISO years have 52 weeks (364 days). A year gets a 53rd when 1 January is a Thursday,
          or a Wednesday in a leap year — 2020 and 2026 are 53-week years, for example.
        </p>
        <h3>ISO vs the "US" week number</h3>
        <p>
          North American calendars often start weeks on <b>Sunday</b> and call the week containing 1
          January "week 1", with no Thursday rule. That can differ from the ISO number by one,
          especially in January. Both are shown above; "week number" without qualification almost
          always means ISO outside the US.
        </p>
        <h3>Is anything sent to a server?</h3>
        <p>No. The dates are computed in your browser; the selected date is kept in the page link.</p>
        <footer>Week Number · ISO 8601 · no sign-up · works offline</footer>
      </section>
    </div>
  );
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
