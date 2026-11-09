import { get } from "@/lib/api";

export type Visit = {
  id: string;
  hostName: string | null;
  unitNo: string | null;
  purpose: string | null;
  dateEnter: string | null;
  dateExit: string | null;
};

export const fetchVisits = (): Promise<Visit[]> => get<Visit[]>("/api/visits");
