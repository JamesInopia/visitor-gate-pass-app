import { supabase } from "@/lib/supabase";

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

async function send(path: string, method: string, body?: unknown, ms = 8000) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await Promise.race([
    fetch(BASE + path, {
      method,
      headers: {
        ...(body === undefined || isForm
          ? {}
          : { "Content-Type": "application/json" }),
        ...(await authHeader()),
      },
      body:
        body === undefined
          ? undefined
          : isForm
            ? (body as FormData)
            : JSON.stringify(body),
    }),
    timeout(ms),
  ]);
  if (!res.ok) {
    let code: string | undefined;
    try {
      const data = await res.json();
      if (typeof data?.error === "string") code = data.error;
    } catch {}
    throw Object.assign(new Error(String(res.status)), { code });
  }
  return res;
}

export async function get<T>(path: string): Promise<T> {
  return (await send(path, "GET")).json();
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  return (await send(path, "POST", body)).json();
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  return (await send(path, "PATCH", body)).json();
}

export async function patchVoid(path: string, body: unknown): Promise<void> {
  await send(path, "PATCH", body);
}

export async function postForm<T>(path: string, form: FormData): Promise<T> {
  return (await send(path, "POST", form, 30000)).json();
}

export async function del(path: string): Promise<void> {
  await send(path, "DELETE");
}
