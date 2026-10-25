import { del, get, post, postForm } from "@/lib/api";
import type { IdPhoto } from "@/lib/pick-id-photo";
import { File } from "expo-file-system";
import { Platform } from "react-native";

export type RequestStatus = "pending" | "approved" | "denied";

export type Gatepass = {
  code: string;
  startsAt: string;
  expiresAt: string;
};

export type GatepassRequest = {
  id: string;
  status: RequestStatus;
  visitorName: string;
  hostName: string;
  unitNo: string | null;
  purpose: string;
  contact?: string | null;
  requestedAt: string;
  respondedAt: string | null;
  pass: Gatepass | null;
};

export type NewRequest = {
  hostName: string;
  unitNo: string;
  purpose: string;
  contact: string;
  idImage: IdPhoto;
};

export const fetchRequests = (): Promise<GatepassRequest[]> =>
  get<GatepassRequest[]>("/api/requests");

export const fetchRequest = (id: string): Promise<GatepassRequest> =>
  get<GatepassRequest>("/api/requests/" + id);

export async function createRequest(
  input: NewRequest,
): Promise<GatepassRequest> {
  const form = new FormData();
  form.append("hostName", input.hostName);
  form.append("unitNo", input.unitNo);
  form.append("purpose", input.purpose);
  form.append("contact", input.contact);

  const { uri, name } = input.idImage;
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("idImage", blob, name);
  } else {
    form.append("idImage", new File(uri) as unknown as Blob);
  }

  return postForm<GatepassRequest>("/api/requests", form);
}

export const deleteRequest = (id: string): Promise<void> =>
  del("/api/requests/" + id);

export const EXPIRY_HOURS = [1, 2, 3, 6, 12, 24] as const;
export const DEFAULT_EXPIRY_HOURS = 24;

export type Decision =
  | { decision: "approve"; expiresInHours: number }
  | { decision: "deny" };

export const respondToRequest = (
  id: string,
  input: Decision,
): Promise<GatepassRequest> =>
  post<GatepassRequest>("/api/requests/" + id + "/respond", input);
