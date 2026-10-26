import type { Gatepass, GatepassRequest } from "@/data/requests";
import {
  formatMinutes,
  formatVisitDate,
  isAllDay,
  isPastDateKey,
  minutesOfDay,
  toDateKey,
} from "@/lib/visit-date";

export type Phase =
  | "pending"
  | "denied"
  | "cancelled"
  | "upcoming"
  | "active"
  | "expired";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(value: Date) {
  return value.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const visitDateOf = (r: GatepassRequest) =>
  r.visitDate ?? toDateKey(new Date(r.requestedAt));

export function windowLabel(pass: Gatepass) {
  if (isAllDay(pass.startsAt, pass.expiresAt)) return "All day";
  return `${formatMinutes(minutesOfDay(new Date(pass.startsAt)))} – ${formatMinutes(
    minutesOfDay(new Date(pass.expiresAt)),
  )}`;
}

export function phaseOf(r: GatepassRequest, now = new Date()): Phase {
  if (r.status === "cancelled") return "cancelled";
  if (r.status === "denied") return "denied";
  if (r.status === "pending")
    return isPastDateKey(visitDateOf(r), now) ? "expired" : "pending";
  if (!r.pass) return "active";
  if (now >= new Date(r.pass.expiresAt)) return "expired";
  if (now < new Date(r.pass.startsAt)) return "upcoming";
  return "active";
}

export function takesEffectLabel(startsAt: Date, now: Date, allDay = false) {
  const diff = startsAt.getTime() - now.getTime();
  if (diff < HOUR) return "Takes effect in less than an hour";
  const days = Math.round((startOfDay(startsAt) - startOfDay(now)) / DAY);
  if (days <= 0)
    return `Takes effect in ${plural(Math.floor(diff / HOUR), "hour")}`;
  if (days === 1)
    return allDay
      ? "Takes effect tomorrow"
      : `Takes effect tomorrow at ${formatTime(startsAt)}`;
  return `Takes effect in ${plural(days, "day")}`;
}

export function describe(r: GatepassRequest, now = new Date()) {
  const phase = phaseOf(r, now);
  const visit = formatVisitDate(visitDateOf(r));
  const schedule = r.pass
    ? `${visit} · ${windowLabel(r.pass)}`
    : `Visit on ${visit}`;

  switch (phase) {
    case "pending":
      return {
        phase,
        schedule,
        badge: "Pending",
        detail: `Waiting for ${r.hostName} to respond`,
      };
    case "denied":
      return {
        phase,
        schedule,
        badge: "Denied",
        detail: "This request was denied",
      };
    case "cancelled":
      return {
        phase,
        schedule,
        badge: "Cancelled",
        detail: "Cancelled because another request was approved",
      };
    case "upcoming":
      return {
        phase,
        schedule,
        badge: "Approved",
        detail: takesEffectLabel(
          new Date(r.pass!.startsAt),
          now,
          isAllDay(r.pass!.startsAt, r.pass!.expiresAt),
        ),
      };
    case "active":
      return {
        phase,
        schedule,
        badge: "Active",
        detail: r.pass
          ? `Active now · expires ${formatDateTime(r.pass.expiresAt)}`
          : "Active now",
      };
    case "expired":
      return {
        phase,
        schedule,
        badge: "Expired",
        detail:
          r.status === "pending"
            ? "The visit date has passed"
            : "This gatepass has expired",
      };
  }
}

export function describeForTenant(r: GatepassRequest, now = new Date()) {
  const d = describe(r, now);
  if (d.phase === "pending")
    return { ...d, detail: `Requested ${formatDateTime(r.requestedAt)}` };
  return d;
}
