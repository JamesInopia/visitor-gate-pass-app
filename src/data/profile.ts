import type { Role } from "@/constants/roles";
import { get } from "@/lib/api";

export type Profile = {
  userId: number;
  authId: string | null;
  name: string;
  role: Role;
  email: string | null;
  contact: string | null;
  unitNo: string | null;
};

export const fetchProfile = (): Promise<Profile> => get<Profile>("/api/me");
