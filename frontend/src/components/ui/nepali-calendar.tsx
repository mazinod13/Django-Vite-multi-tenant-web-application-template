"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import NepaliDate from "nepali-date-converter"

import * as React from "react"

import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  fetchCalendarYear,
  type CalendarEvent,
} from "@/lib/calendar"

import { cn } from "@/lib/utils"

const NP_MONTHS = [
  "बैशाख",
  "जेठ",
  "असार",
  "साउन",
  "भदौ",
  "असोज",
  "कात्तिक",
  "मंसिर",
  "पुष",
  "माघ",
  "फागुन",
  "चैत",
]

const NP_WEEKDAYS = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"]

const NP_DIGITS = "०१२३४५६७८९"

function toNpDigits(value: number) {
  return String(value)
    .split("")
    .map((c) => NP_DIGITS[Number(c)] ?? c)
    .join("")
}

function daysInBsMonth(year: number, month: number) {
  const first = new NepaliDate(year, month, 1).toJsDate()
  const nextFirst = new NepaliDate(
    month === 11 ? year + 1 : year,
    (month + 1) % 12,
    1,
  ).toJsDate()
  return Math.round((nextFirst.getTime() - first.getTime()) / 86400000)
}

function sameBsDay(a: NepaliDate, year: number, month: number, date: number) {
  return a.getYear() === year && a.getMonth() === month && a.getDate() === date
}

export type NepaliCalendarProps = {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

function NepaliCalendar({ selected, onSelect, className }: NepaliCalendarProps) {
  const initial = React.useMemo(
    () => new NepaliDate(selected ?? new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [viewYear, setViewYear] = React.useState(initial.getYear())
  const [viewMonth, setViewMonth] = React.useState(initial.getMonth())
  const [events, setEvents] = React.useState<CalendarEvent[]>([])

  // Fetch this BS year's events once per year change; index by month/day.
  React.useEffect(() => {
    let cancelled = false
    fetchCalendarYear(viewYear)
      .then((data) => {
        if (!cancelled) setEvents(Object.values(data.months).flat())
      })
      .catch(() => {
        if (!cancelled) setEvents([])
      })
    return () => {
      cancelled = true
    }
  }, [viewYear])

  // month index here is 0-based; API bs_month is 1-based.
  const eventsByDay = React.useMemo(() => {
    const map = new Map<number, CalendarEvent[]>()
    for (const e of events) {
      if (e.bs_month !== viewMonth + 1) continue
      const list = map.get(e.bs_day) ?? []
      list.push(e)
      map.set(e.bs_day, list)
    }
    return map
  }, [events, viewMonth])

  const monthEvents = React.useMemo(
    () =>
      events
        .filter((e) => e.bs_month === viewMonth + 1)
        .sort((a, b) => a.bs_day - b.bs_day),
    [events, viewMonth],
  )

  const today = new NepaliDate()
  const selectedBs = selected ? new NepaliDate(selected) : undefined

  const firstWeekday = new NepaliDate(viewYear, viewMonth, 1).toJsDate().getDay()
  const totalDays = daysInBsMonth(viewYear, viewMonth)

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }
  const goNext = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const pick = (date: number) => {
    const jsDate = new NepaliDate(viewYear, viewMonth, date).toJsDate()
    if (selectedBs && sameBsDay(selectedBs, viewYear, viewMonth, date)) {
      onSelect?.(undefined)
    } else {
      onSelect?.(jsDate)
    }
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <TooltipProvider>
    <div
      className={cn(
        "rounded-base! border-2 border-border bg-main p-3 font-heading shadow-shadow",
        className,
      )}
    >
      <div className="relative flex w-full items-center justify-center pt-1 text-main-foreground">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous month"
          className={cn(
            buttonVariants({ variant: "noShadow" }),
            "absolute left-1 size-7 bg-transparent p-0",
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-heading">
          {NP_MONTHS[viewMonth]} {toNpDigits(viewYear)}
        </span>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next month"
          className={cn(
            buttonVariants({ variant: "noShadow" }),
            "absolute right-1 size-7 bg-transparent p-0",
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-4 flex">
        {NP_WEEKDAYS.map((d) => (
          <div
            key={d}
            className="w-9 rounded-base text-center text-[0.8rem] font-base text-main-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <div key={week} className="mt-2 flex w-full">
          {cells.slice(week * 7, week * 7 + 7).map((date, i) => {
            if (date === null) return <div key={i} className="size-9" />
            const dayEvents = eventsByDay.get(date) ?? []
            const isHoliday = dayEvents.some((e) => e.is_holiday)
            const hasEvent = dayEvents.length > 0
            const dayButton = (
              <button
                key={i}
                type="button"
                onClick={() => pick(date)}
                className={cn(
                  buttonVariants({ variant: "noShadow" }),
                  "relative size-9 p-0 font-base",
                  isHoliday && "text-red-600",
                  sameBsDay(today, viewYear, viewMonth, date) &&
                    "bg-secondary-background text-foreground!",
                  selectedBs &&
                    sameBsDay(selectedBs, viewYear, viewMonth, date) &&
                    "bg-black! text-white! rounded-base",
                )}
              >
                {toNpDigits(date)}
                {hasEvent && (
                  <span
                    className={cn(
                      "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full",
                      isHoliday ? "bg-red-600" : "bg-blue-600",
                    )}
                  />
                )}
              </button>
            )
            if (!hasEvent) return dayButton
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>{dayButton}</TooltipTrigger>
                <TooltipContent>
                  <ul className="space-y-0.5">
                    {dayEvents.map((e) => (
                      <li
                        key={e.id}
                        className={cn(e.is_holiday && "text-red-600")}
                      >
                        {e.title_np || e.title || e.tithi}
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      ))}

      {monthEvents.length > 0 && (
        <div className="mt-4 space-y-1 border-t-2 border-border pt-3 text-xs text-main-foreground">
          {monthEvents.map((e) => (
            <div key={e.id} className="flex gap-2">
              <span className="w-6 shrink-0 text-right font-heading">
                {toNpDigits(e.bs_day)}
              </span>
              <span className={cn("flex-1", e.is_holiday && "text-red-600")}>
                {e.title_np || e.title || e.tithi || "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}

const DOT_BASE =
  "relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:content-['']"

// Gregorian calendar that also marks BS holidays/events. Events are stored in
// BS; each is converted to its AD date so react-day-picker can flag the day.
function EnglishCalendarWithEvents({
  selected,
  onSelect,
}: {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
}) {
  const [month, setMonth] = React.useState<Date>(selected ?? new Date())
  const [events, setEvents] = React.useState<CalendarEvent[]>([])

  // An AD month can span two BS years; fetch every BS year it touches.
  React.useEffect(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const years = Array.from(
      new Set([new NepaliDate(first).getYear(), new NepaliDate(last).getYear()]),
    )
    let cancelled = false
    Promise.all(
      years.map((y) =>
        fetchCalendarYear(y)
          .then((d) => Object.values(d.months).flat())
          .catch(() => [] as CalendarEvent[]),
      ),
    ).then((lists) => {
      if (!cancelled) setEvents(lists.flat())
    })
    return () => {
      cancelled = true
    }
  }, [month])

  const enriched = React.useMemo(
    () =>
      events.map((e) => ({
        e,
        date: new NepaliDate(e.bs_year, e.bs_month - 1, e.bs_day).toJsDate(),
      })),
    [events],
  )

  const holidayDates = enriched.filter((x) => x.e.is_holiday).map((x) => x.date)
  const eventDates = enriched.filter((x) => !x.e.is_holiday).map((x) => x.date)

  const monthList = enriched
    .filter(
      (x) =>
        x.date.getFullYear() === month.getFullYear() &&
        x.date.getMonth() === month.getMonth(),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="flex flex-col gap-2">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={month}
        onMonthChange={setMonth}
        modifiers={{ holiday: holidayDates, event: eventDates }}
        modifiersClassNames={{
          holiday: cn(DOT_BASE, "text-red-600 after:bg-red-600"),
          event: cn(DOT_BASE, "after:bg-blue-600"),
        }}
      />
      {monthList.length > 0 && (
        <div className="mt-2 space-y-1 border-t-2 border-border pt-3 text-xs text-foreground">
          {monthList.map(({ e, date }) => (
            <div key={e.id} className="flex gap-2">
              <span className="w-6 shrink-0 text-right font-heading">
                {date.getDate()}
              </span>
              <span className={cn("flex-1", e.is_holiday && "text-red-600")}>
                {e.title || e.title_np || e.tithi || "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export type DualCalendarProps = {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

function DualCalendar({ selected, onSelect, className }: DualCalendarProps) {
  const [lang, setLang] = React.useState<"en" | "np">("en")

  return (
    <div className={cn("inline-flex flex-col gap-2", className)}>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={lang === "en" ? "default" : "neutral"}
          onClick={() => setLang("en")}
        >
          English
        </Button>
        <Button
          size="sm"
          variant={lang === "np" ? "default" : "neutral"}
          onClick={() => setLang("np")}
        >
          नेपाली
        </Button>
      </div>
      {lang === "en" ? (
        <EnglishCalendarWithEvents selected={selected} onSelect={onSelect} />
      ) : (
        <NepaliCalendar selected={selected} onSelect={onSelect} />
      )}
    </div>
  )
}

export { NepaliCalendar, DualCalendar }
