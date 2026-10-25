import type { GatepassRequest } from "@/data/requests";

export type Phase = "pending" | "denied" | "upcoming" | "active" | "expired";

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

export function phaseOf(r: GatepassRequest, now = new Date()): Phase {
  if (r.status === "pending") return "pending";
  if (r.status === "denied") return "denied";
  if (!r.pass) return "active";
  if (now >= new Date(r.pass.expiresAt)) return "expired";
  if (now < new Date(r.pass.startsAt)) return "upcoming";
  return "active";
}

export function takesEffectLabel(startsAt: Date, now: Date) {
  const diff = startsAt.getTime() - now.getTime();
  if (diff < HOUR) return "Takes effect in less than an hour";
  const days = Math.round((startOfDay(startsAt) - startOfDay(now)) / DAY);
  if (days <= 0)
    return `Takes effect in ${plural(Math.floor(diff / HOUR), "hour")}`;
  if (days === 1) return `Takes effect tomorrow at ${formatTime(startsAt)}`;
  return `Takes effect in ${plural(days, "day")}`;
}

export function describe(r: GatepassRequest, now = new Date()) {
  const phase = phaseOf(r, now);
  switch (phase) {
    case "pending":
      return {
        phase,
        badge: "Pending",
        detail: `Waiting for ${r.hostName} to respond`,
      };
    case "denied":
      return { phase, badge: "Denied", detail: "This request was denied" };
    case "upcoming":
      return {
        phase,
        badge: "Approved",
        detail: takesEffectLabel(new Date(r.pass!.startsAt), now),
      };
    case "active":
      return {
        phase,
        badge: "Active",
        detail: r.pass
          ? `Active now · expires ${formatDateTime(r.pass.expiresAt)}`
          : "Active now",
      };
    case "expired":
      return { phase, badge: "Expired", detail: "This gatepass has expired" };
  }
}

export const formatExpiryHours = (h: number) =>
  h === 24 ? "24 hours (default)" : plural(h, "hour");

export function describeForTenant(r: GatepassRequest, now = new Date()) {
  const d = describe(r, now);
  if (d.phase === "pending")
    return { ...d, detail: `Requested ${formatDateTime(r.requestedAt)}` };
  return d;
}
