# Nepali (Bikram Sambat) Calendar

A dual-mode date picker that swaps between the Gregorian (English) calendar and
the Bikram Sambat (Nepali) calendar. The selected value is always a plain
JavaScript `Date` (AD), so backend code and any other consumers are unaffected —
Bikram Sambat is purely a display layer.

## Why a custom component was needed

The existing `Calendar` ([src/components/ui/calendar.tsx](../src/components/ui/calendar.tsx))
is built on `react-day-picker`, which only understands the Gregorian calendar.
Bikram Sambat months have irregular, table-driven lengths (29–32 days that vary
year to year), so BS support means:

1. Converting dates with a lookup library, and
2. Rendering the month grid manually.

## Steps

### 1. Install the conversion library

```bash
cd frontend
npm install nepali-date-converter
```

`nepali-date-converter` handles AD↔BS conversion (valid roughly 2000–2090 BS).
Key API used:

- `new NepaliDate(jsDate)` — convert a JS `Date` to BS.
- `.getYear() / .getMonth() / .getDate()` — BS fields (month is 0-indexed:
  Baisakh = 0 … Chaitra = 11).
- `.toJsDate()` — convert a BS date back to a JS `Date` (AD).
- `.format('...', 'np')` — localized formatting (not used by the grid, handy for
  labels).

### 2. Create the dual calendar component

Added [src/components/ui/nepali-calendar.tsx](../src/components/ui/nepali-calendar.tsx)
with two exports:

- **`NepaliCalendar`** — a full BS month grid rendered from scratch:
  - Nepali month names (बैशाख…चैत) and weekday headers (आइत…शनि).
  - Devanagari digits (०–९) via a small `toNpDigits` helper.
  - Month navigation that wraps year boundaries.
  - Today and selected-day highlighting.
  - Styled with the same neobrutalism classes as the existing `Calendar` so the
    two look identical.
- **`DualCalendar`** — the language swap. Two buttons (English / नेपाली) above
  the calendar; English mode renders the existing `Calendar`, Nepali mode renders
  `NepaliCalendar`.

#### Computing days in a BS month

Month lengths are not fixed, so the count is derived from the library instead of
hardcoded: take the first day of the month, the first day of the next month, and
measure the gap in days.

```ts
function daysInBsMonth(year: number, month: number) {
  const first = new NepaliDate(year, month, 1).toJsDate()
  const nextFirst = new NepaliDate(
    month === 11 ? year + 1 : year,
    (month + 1) % 12,
    1,
  ).toJsDate()
  return Math.round((nextFirst.getTime() - first.getTime()) / 86400000)
}
```

#### Selection stays in AD

Both modes store the selection as a plain JS `Date`. When a Nepali day is
clicked it is converted back with `.toJsDate()` before calling `onSelect`. This
means switching languages preserves the selection — pick 18 Asar in Nepali mode,
flip to English, and July 2 shows selected.

### 3. Use it in a section

Replaced the plain `Calendar` in
[src/apps/tenant/restaurant/sections/MenuSection.tsx](../src/apps/tenant/restaurant/sections/MenuSection.tsx):

```tsx
// before
import { Calendar } from '@/components/ui/calendar'
<Calendar mode="single" selected={date} onSelect={setDate} />

// after
import { DualCalendar } from '@/components/ui/nepali-calendar'
<DualCalendar selected={date} onSelect={setDate} />
```

## Reusing it elsewhere

Import `DualCalendar` and pass the same `selected` / `onSelect` pair you would
give the plain calendar:

```tsx
import { DualCalendar } from '@/components/ui/nepali-calendar'

const [date, setDate] = useState<Date | undefined>(new Date())

<DualCalendar selected={date} onSelect={setDate} />
```

Props:

| Prop        | Type                              | Notes                          |
| ----------- | --------------------------------- | ------------------------------ |
| `selected`  | `Date \| undefined`               | Current selection (AD).        |
| `onSelect`  | `(date: Date \| undefined) => void` | Fired with an AD `Date`.      |
| `className` | `string`                          | Optional wrapper classes.      |

If you only want the Nepali grid without the toggle, import `NepaliCalendar`
directly — it takes the same props.

## Holidays and events

The Nepali grid marks holidays and events pulled from the backend:

- Holiday days render in red with a red dot; event days get a blue dot.
- Hovering a marked day shows its name(s) as a tooltip.
- A list of the visible month's events appears under the grid.

### Backend (Django, `apps/tenant/calendars`)

Events live in a per-tenant `CalendarEvent` model (BS date, AD date, English +
Nepali title, tithi, category, `is_holiday`, `source`). Because the app is
multi-tenant, each tenant schema has its own table — seeded national holidays
*and* the tenant's own events sit together and are returned by one scoped query.

API (all under `/api/calendar/`, JWT-authenticated):

| Method + path                 | Purpose                                        |
| ----------------------------- | ---------------------------------------------- |
| `GET /api/calendar/<bs_year>/`| All events for a BS year, grouped by month.    |
| `GET /api/calendar/events/`   | List events (filter `?bs_year=&bs_month=`).    |
| `POST /api/calendar/events/`  | Create a tenant event (`source` forced to `tenant`). |
| `PATCH/DELETE .../events/<id>/` | Update / soft-delete an event.               |

`GET /api/calendar/<bs_year>/` returns:

```json
{ "year": 2083, "months": { "1": [ { "bs_day": 1, "title_np": "नयाँ वर्ष", "is_holiday": true, ... } ] } }
```

The frontend consumes this through [src/lib/calendar.ts](../src/lib/calendar.ts)
(`fetchCalendarYear`, `createCalendarEvent`), which use the existing `authFetch`
Bearer-token wrapper.

### Seeding data

Three management commands, all run across every tenant schema (pass
`--schema <name>` to target one):

```bash
# BEST: full curated festival + holiday list for a specific year, including
# lunar festivals (Dashain, Tihar, Holi, ...). Needs a per-year fixture at
# apps/tenant/calendars/fixtures/festivals/<year>.json. 2083 is included.
# Re-running replaces that year's seeded rows (tenant events are kept).
python manage.py seed_festivals --year 2083

# Fixed-BS-date national holidays only (New Year, Republic Day, Constitution
# Day, Prithvi Jayanti, Maghe Sankranti, Democracy Day) — reliable for ANY
# year that has no curated fixture yet:
python manage.py seed_fixed_holidays --year 2084

# Weekly/structural holidays from the community dataset (1992-2080 BS only,
# no festival names):
python manage.py seed_holidays --start 2080 --end 2080
```

The 2083 fixture was compiled from the published Government of Nepal 2083 B.S.
public-holiday list (Dashain Ashwin 31 - Kartik 6, Tihar Kartik 22-26, etc.).
To cover another year, add `fixtures/festivals/<year>.json` in the same shape
and run `seed_festivals --year <year>`. Eid dates are omitted (announced on
sighting); add them via the admin once fixed.

### Data-source caveat (important)

There is **no free, actively-maintained source with clean festival data for the
current year**. What exists:

- [the-value-crew/nepali-calendar-api](https://github.com/the-value-crew/nepali-calendar-api)
  covers 1992-2080 BS but is a skeleton — only weekly (Saturday) holidays, no
  festival names or tithi.
- [bibhuticoder/nepali-calendar-api](https://github.com/bibhuticoder/nepali-calendar-api)
  has festival names + tithi but stops at 2074 BS and its Nepali text is
  encoding-corrupted (lossy surrogate escapes), so it is not used here.

The reason is structural: Nepal's lunar festivals (Dashain, Tihar, Holi, ...)
and government-declared closures are finalized year by year, so only a
hand-maintained or paid feed has them for the current/future year.

This is why the festival data is a **hand-curated per-year fixture** rather than
an automatic feed. `fixtures/festivals/2083.json` was compiled from the official
published list; other years need their own fixture (or `seed_fixed_holidays` for
just the recurring ones). For anything still missing — Eid, one-off closures, or
a tenant's own events — add it through the Django admin or
`POST /api/calendar/events/`, which is also how tenants add their own events
(the primary use case for a multi-tenant SaaS anyway).

## Verification

- Frontend `tsc --noEmit` passes; `python manage.py check` passes.
- Conversion sanity check: 2 July 2026 correctly converts to
  बिहिबार १८ असार २०८३ (Thursday 18 Asar 2083).
- `GET /api/calendar/2083/` returns the six seeded fixed holidays with clean
  Nepali names; `GET /api/calendar/2080/` returns the seeded weekly holidays.
