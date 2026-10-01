import { START_DATE, DAILY_CONTENT, DailyTafsirEntry } from './dailyContent';

/**
 * START_DATE is configurable (defaults to '2026-10-01' / 1 October 2026).
 */
export const START_DATE_STR = START_DATE || '2026-10-01';

/**
 * Returns the current date, checking for simulated date query param (?date=YYYY-MM-DD)
 * or window.__SIMULATED_DATE__ if present during testing.
 */
export function getCurrentDate(): Date {
  if (typeof window !== 'undefined' && window.location) {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryDate = searchParams.get('date') || searchParams.get('simDate');
      if (queryDate) {
        const parsed = new Date(queryDate.includes('T') ? queryDate : `${queryDate}T12:00:00Z`);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      if ((window as unknown as { __SIMULATED_DATE__?: string | Date }).__SIMULATED_DATE__) {
        const sim = (window as unknown as { __SIMULATED_DATE__: string | Date }).__SIMULATED_DATE__;
        const parsed = sim instanceof Date ? sim : new Date(sim);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    } catch {
      // Fallback cleanly to current real date
    }
  }
  return new Date();
}

/**
 * Extracts the calendar date parts { year, month, day } in Europe/London timezone.
 */
export function getLondonDateParts(date: Date = getCurrentDate()): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  return { year, month, day };
}

/**
 * Returns the calendar date string in YYYY-MM-DD format for Europe/London timezone.
 */
export function getLondonDateString(date: Date = getCurrentDate()): string {
  const { year, month, day } = getLondonDateParts(date);
  const yyyy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates the calendar day number relative to START_DATE in Europe/London.
 * 1 October 2026 → Day 1
 * 2 October 2026 → Day 2
 * 3 October 2026 → Day 3
 * 4 October 2026 → Day 4
 * etc.
 * 
 * Supports calling as:
 * - getLondonDayNumber() -> from current London date
 * - getLondonDayNumber(simulatedDate) -> from simulated Date
 * - getLondonDayNumber('2026-10-02') -> from date string
 * - getLondonDayNumber(startDateStr, simulatedDate)
 */
export function getLondonDayNumber(
  dateOrStartDate?: Date | string,
  maybeDate?: Date | string
): number {
  let currentDate = getCurrentDate();
  let startDateStr = START_DATE_STR;

  if (typeof dateOrStartDate === 'string') {
    if (maybeDate instanceof Date) {
      startDateStr = dateOrStartDate;
      currentDate = maybeDate;
    } else if (typeof maybeDate === 'string') {
      startDateStr = dateOrStartDate;
      currentDate = new Date(maybeDate.includes('T') ? maybeDate : `${maybeDate}T12:00:00Z`);
    } else {
      // Single string passed: check if it's a date to test (e.g. '2026-10-02')
      if (dateOrStartDate.includes('-') || dateOrStartDate.includes(' ')) {
        const parsed = new Date(dateOrStartDate.includes('T') ? dateOrStartDate : `${dateOrStartDate}T12:00:00Z`);
        if (!isNaN(parsed.getTime())) {
          currentDate = parsed;
        } else {
          startDateStr = dateOrStartDate;
        }
      } else {
        startDateStr = dateOrStartDate;
      }
    }
  } else if (dateOrStartDate instanceof Date) {
    currentDate = dateOrStartDate;
    if (typeof maybeDate === 'string') {
      startDateStr = maybeDate;
    }
  }

  const { year: currYear, month: currMonth, day: currDay } = getLondonDateParts(currentDate);

  let startYear = 2026;
  let startMonth = 10;
  let startDay = 1;

  if (startDateStr.includes('-')) {
    const parts = startDateStr.split('-').map(Number);
    startYear = parts[0];
    startMonth = parts[1];
    startDay = parts[2];
  } else {
    const parsedStart = new Date(startDateStr);
    if (!isNaN(parsedStart.getTime())) {
      const parts = getLondonDateParts(parsedStart);
      startYear = parts.year;
      startMonth = parts.month;
      startDay = parts.day;
    }
  }

  const utcStart = Date.UTC(startYear, startMonth - 1, startDay);
  const utcCurr = Date.UTC(currYear, currMonth - 1, currDay);

  const diffMs = utcCurr - utcStart;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays + 1;
}

/**
 * Finds that day's content from the content dataset.
 * - Direct match if day exists in DAILY_CONTENT (Days 1, 2, 3)
 * - If day exceeds prototype (e.g. Day 4+), smoothly cycles content records
 *   while preserving the actual calculated day number.
 */
export function findContentForDay(dayNumber: number): DailyTafsirEntry | undefined {
  if (dayNumber < 1) {
    return DAILY_CONTENT[0];
  }
  const match = DAILY_CONTENT.find((entry) => entry.day === dayNumber);
  if (match) {
    return match;
  }
  // Smooth prototype rollover for Day 4+ until Juz 30 full entries are loaded
  const index = (dayNumber - 1) % DAILY_CONTENT.length;
  const base = DAILY_CONTENT[index];
  if (base) {
    return {
      ...base,
      day: dayNumber,
    };
  }
  return undefined;
}

/**
 * Kept for backward compatibility
 */
export function getTodayInitialIndex(totalEntries: number = DAILY_CONTENT.length): number {
  const dayNumber = getLondonDayNumber();
  if (dayNumber < 1) {
    return 0;
  }
  if (dayNumber > totalEntries) {
    return totalEntries - 1;
  }
  return dayNumber - 1;
}

