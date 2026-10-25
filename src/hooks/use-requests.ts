import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { problemFor, type Status } from "@/data/problem";
import { fetchRequests, type GatepassRequest } from "@/data/requests";

export function useRequests() {
  const [status, setStatus] = useState<Status>("loading");
  const [requests, setRequests] = useState<GatepassRequest[]>([]);
  const [problem, setProblem] = useState("");
  const latest = useRef(0);
  const loaded = useRef(false);

  const load = useCallback((quiet: boolean) => {
    const mine = ++latest.current;
    if (!quiet) setStatus("loading");
    fetchRequests()
      .then((rows) => {
        if (mine !== latest.current) return;
        loaded.current = true;
        setRequests(rows);
        setStatus(rows.length === 0 ? "empty" : "content");
      })
      .catch((e) => {
        if (mine !== latest.current || loaded.current) return;
        setProblem(problemFor(e));
        setStatus("error");
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load]),
  );

  return {
    status,
    requests,
    problem,
    retry: () => load(false),
    refresh: () => load(true),
  };
}
