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

// Result of looking a code up WITHOUT recording anything.
export type ScanPreview =
  | ({
      ok: true;
      action: "enter" | "exit";
      firstEntry: boolean;
      idImageUrl?: string | null;
    } & PassInfo)
  | ({ ok: false; reason: DenyReason } & PassInfo);

export type EntryEvent = {
  id: string;
  kind: "enter" | "exit";
  at: string;
  visitorName: string;
  code: string;
  photoUrl?: string;
};

// `confirmed` is true when the admin checked the ID and let the visitor in. The server
// refuses to record a first entry without it; exits and re-entries do not need it.
export const scanGatepass = (
  code: string,
  confirmed = false,
): Promise<ScanResult> => post<ScanResult>("/api/scan", { code, confirmed });

export const fetchEntryLog = (): Promise<EntryEvent[]> =>
  get<EntryEvent[]>("/api/entry-log");

// Look the pass up and say whether this would be the visitor's first entry.
// Records nothing.
export const previewScan = (code: string): Promise<ScanPreview> =>
  post<ScanPreview>("/api/scan/preview", { code });
