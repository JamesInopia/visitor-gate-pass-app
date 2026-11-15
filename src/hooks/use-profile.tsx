import { AppState } from "react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { fetchProfile, type Profile } from "@/data/profile";

type State =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; profile: Profile; refresh: () => Promise<void> };

const ProfileContext = createContext<State>({ status: "loading" });

export function ProfileProvider({
  children,
}: {
  children: (state: State) => ReactNode;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  // Re-reads the profile without showing the loading screen. Used when the
  // role can change behind the app's back (e.g. an admin approves a visitor
  // who asked to become a tenant). Failures are ignored; the old profile stays.
  const refresh = useCallback(
    () =>
      fetchProfile()
        .then((next) =>
          setState((cur) =>
            cur.status === "ready" &&
            JSON.stringify(cur.profile) !== JSON.stringify(next)
              ? { ...cur, profile: next }
              : cur,
          ),
        )
        .catch(() => {}),
    [],
  );

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchProfile()
      .then((profile) => setState({ status: "ready", profile, refresh }))
      .catch(() => setState({ status: "error", retry: load }));
  }, [refresh]);

  useEffect(load, [load]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return (
    <ProfileContext.Provider value={state}>
      {children(state)}
    </ProfileContext.Provider>
  );
}

export const useProfileState = () => useContext(ProfileContext);

export function useProfile(): Profile {
  const state = useContext(ProfileContext);
  if (state.status !== "ready")
    throw new Error("useProfile used before the profile loaded");
  return state.profile;
}

/** Silently re-reads the signed-in user's profile (role, unit, name). */
export function useRefreshProfile(): () => Promise<void> {
  const state = useContext(ProfileContext);
  return state.status === "ready" ? state.refresh : async () => {};
}
