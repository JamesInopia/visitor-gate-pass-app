import { del, get } from "@/lib/api";

export type Notice = {
  id: string;
  kind: "denied";
  hostName: string;
  visitDate: string | null;
  createdAt: string;
};

export const fetchNotices = (): Promise<Notice[]> =>
  get<Notice[]>("/api/notices");

export const dismissNotice = (id: string): Promise<void> =>
  del("/api/notices/" + id);
