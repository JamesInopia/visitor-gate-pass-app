import type { Role } from "@/constants/roles";
import { supabase } from "@/lib/supabase";

export type Profile = {
  userId: number;
  authId: string | null;
  name: string;
  role: Role;
  email: string | null;
  contact: string | null;
  unitNo: string | null;
};

const BASE = process.env.EXPO_PUBLIC_API_URL;
if (!BASE) throw new Error("Set EXPO_PUBLIC_API_URL in .env");

function timeout(ms: number): Promise<never> {
  return new Promise((_, fail) =>
    setTimeout(() => fail(new Error("timeout")), ms),
  );
}

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  return { Authorization: "Bearer " + data.session?.access_token };
}

async function get(path: string) {
  const res = await Promise.race([
    fetch(BASE + path, { headers: await authHeader() }),
    timeout(8000),
  ]);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export const fetchProfile = (): Promise<Profile> => get("/api/me");
