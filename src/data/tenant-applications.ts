import { get, post } from "@/lib/api";

export type TenantApplicationStatus = "pending" | "approved" | "rejected";

export type TenantApplication = {
  id: string;
  status: TenantApplicationStatus;
  fullName: string;
  email: string;
  unitNo: string;
  requestedAt: string;
  respondedAt: string | null;
  reviewNote: string | null;
};

export type NewTenantApplication = {
  fullName: string;
  email: string;
  unitNo: string;
};

export const fetchMyTenantApplications = (): Promise<TenantApplication[]> =>
  get<TenantApplication[]>("/api/tenant-applications");

export const createTenantApplication = (
  input: NewTenantApplication,
): Promise<TenantApplication> =>
  post<TenantApplication>("/api/tenant-applications", input);
