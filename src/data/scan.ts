import { get, post } from "@/lib/api";

export type DenyReason = "invalid" | "expired" | "not_yet" | "revoked";

type PassInfo = {
  visitorName?: string;
  hostName?: string;
  unitNo?: string | null;
  purpose?: string | null;
  startsAt?: string;
  expiresAt?: string;
  code?: string;
  at?: string;
};

export type ScanResult =
  | ({ ok: true; action: "enter" | "exit" } & PassInfo)
  | ({ ok: false; reason: DenyReason } & PassInfo);

export type EntryEvent = {
  id: string;
  kind: "enter" | "exit";
  at: string;
  visitorName: string;
  code: string;
};

export const scanGatepass = (code: string): Promise<ScanResult> =>
  post<ScanResult>("/api/scan", { code });

export const fetchEntryLog = (): Promise<EntryEvent[]> =>
  get<EntryEvent[]>("/api/entry-log");
