import { File } from "expo-file-system";
import { Platform } from "react-native";

import { del, get, patch, patchVoid, postForm } from "@/lib/api";
import type { IdPhoto } from "@/lib/pick-id-photo";

export type RequestStatus = "pending" | "approved" | "denied" | "cancelled";

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
  visitDate: string | null;
  visitorContact?: string | null;
  requestedAt: string;
  respondedAt: string | null;
  pass: Gatepass | null;
};

export type NewRequest = {
  hostName: string;
  unitNo: string;
  visitDate: string;
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
  form.append("visitDate", input.visitDate);
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

export const approveRequest = (
  id: string,
  window: { startsAt: string; expiresAt: string },
): Promise<GatepassRequest> =>
  patch<GatepassRequest>("/api/requests/" + id, {
    decision: "approve",
    ...window,
  });

export const denyRequest = (id: string): Promise<void> =>
  patchVoid("/api/requests/" + id, { decision: "deny" });
