import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { problemFor, type Status } from "@/data/problem";

export function useFocusList<T>(fetcher: () => Promise<T[]>) {
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<T[]>([]);
  const [problem, setProblem] = useState("");
  const latest = useRef(0);
  const loaded = useRef(false);

  const load = useCallback(
    (quiet: boolean) => {
      const mine = ++latest.current;
      if (!quiet) setStatus("loading");
      return fetcher()
        .then((rows) => {
          if (mine !== latest.current) return;
          loaded.current = true;
          setItems(rows);
          setStatus(rows.length === 0 ? "empty" : "content");
        })
        .catch((e) => {
          if (mine !== latest.current || loaded.current) return;
          setProblem(problemFor(e));
          setStatus("error");
        });
    },
    [fetcher],
  );

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load]),
  );

  return {
    status,
    items,
    problem,
    retry: () => load(false),
    refresh: () => load(true),
  };
}
