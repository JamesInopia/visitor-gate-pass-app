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
  | { status: "ready"; profile: Profile };

const ProfileContext = createContext<State>({ status: "loading" });

export function ProfileProvider({
  children,
}: {
  children: (state: State) => ReactNode;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchProfile()
      .then((profile) => setState({ status: "ready", profile }))
      .catch(() => setState({ status: "error", retry: load }));
  }, []);

  useEffect(load, [load]);

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
