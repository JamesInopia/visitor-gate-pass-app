export function problemFor(
  e: unknown,
  notFound = "That request is not there any more.",
  conflict = "You already have a pending request for that tenant.",
) {
  if (e instanceof Error && e.message === "timeout")
    return "The server took too long. Try again.";
  if (e instanceof TypeError)
    return "No connection. Check your Wi-Fi and try again.";
  if (e instanceof Error && e.message === "400")
    return "Check the details and try again.";
  if (e instanceof Error && e.message === "401") return "Sign in again.";
  if (e instanceof Error && e.message === "403")
    return "You are not allowed to do that.";
  if (e instanceof Error && e.message === "404") return notFound;
  if (e instanceof Error && e.message === "409") return conflict;
  return "Something went wrong.";
}

export type Status = "loading" | "empty" | "error" | "content";
