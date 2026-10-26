const pad = (n: number) => String(n).padStart(2, "0");

export const MAX_DAYS_AHEAD = 30;
export const TIME_STEP = 30;
export const DAY_END = 24 * 60 - 1; // 11:59 PM

export const START_OPTIONS = Array.from(
  { length: 48 },
  (_, i) => i * TIME_STEP,
);

export const END_OPTIONS = [
  ...Array.from({ length: 47 }, (_, i) => (i + 1) * TIME_STEP),
  DAY_END,
];

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function upcomingDateKeys(now = new Date()) {
  return Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) =>
    toDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)),
  );
}

export const isPastDateKey = (key: string, now = new Date()) =>
  key < toDateKey(now);

export function formatVisitDate(key: string) {
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatVisitDateLong(key: string) {
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(mm)} ${h < 12 ? "AM" : "PM"}`;
}

export const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

export function windowFor(dateKey: string, startMin: number, endMin: number) {
  const day = fromDateKey(dateKey);
  const at = (min: number, sec: number, ms: number) =>
    new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      Math.floor(min / 60),
      min % 60,
      sec,
      ms,
    );
  return {
    startsAt: at(startMin, 0, 0).toISOString(),
    expiresAt:
      endMin === DAY_END
        ? at(endMin, 59, 999).toISOString()
        : at(endMin, 0, 0).toISOString(),
  };
}

export function isAllDay(startsAt: string, expiresAt: string) {
  return (
    minutesOfDay(new Date(startsAt)) === 0 &&
    minutesOfDay(new Date(expiresAt)) === DAY_END
  );
}
