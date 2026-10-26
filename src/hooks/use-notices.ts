import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { dismissNotice, fetchNotices, type Notice } from "@/data/notices";

/**
 * Notices are a nice-to-have, so a failed load is ignored rather than shown
 * as an error. They reload every time the screen comes into focus.
 */
export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);

  const load = useCallback(() => {
    fetchNotices()
      .then(setNotices)
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const dismiss = useCallback(
    (id: string) => {
      setNotices((current) => current.filter((n) => n.id !== id));
      // If the server could not delete it, bring it back.
      dismissNotice(id).catch(load);
    },
    [load],
  );

  return { notices, dismiss };
}
