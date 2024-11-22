import { Alert as MuiAlert } from "@mui/material";
import { usePersistedState } from "platform/usePersistedState";
import React, { useEffect } from "react";

interface GlobalMessageData {
  // the unix timestamp (as a string with milliseconds) when the message was issued
  epoch: string;
  severity: "success" | "info" | "warning" | "error";
  message: string;
}

const TIME_BETWEEN_CHECKS_MS = 300_000; // 5 min

export function GlobalMessage() {
  // data from the global message file
  const [data, setData] = usePersistedState<GlobalMessageData | null>(
    "globalmessage.data",
    null
  );
  // last time we queried it
  const [lastCheck, setLastCheck] = usePersistedState<number | null>(
    "globalmessage.lastcheck",
    null
  );
  // the epoch value of the last message we dismissed
  const [dismissedEpoch, setDismissedEpoch] = usePersistedState<string | null>(
    "globalmessage.dismissed",
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_GLOBAL_MESSAGE_URL
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        setData(await response.json());
        setLastCheck(new Date().getTime());
      } catch (error) {
        console.error("Error fetching global message:", error);
      }
    };
    if (
      !lastCheck ||
      new Date().getTime() - lastCheck > TIME_BETWEEN_CHECKS_MS
    ) {
      fetchData();
    }
  }, [setData, setLastCheck, lastCheck]);

  const dismiss = () => {
    if (!data) return;
    setDismissedEpoch(data!.epoch);
  };

  return data && data.epoch && data.epoch != dismissedEpoch ? (
    <MuiAlert severity={data.severity} onClose={dismiss}>
      <span dangerouslySetInnerHTML={{ __html: data.message }} />
    </MuiAlert>
  ) : null;
}
