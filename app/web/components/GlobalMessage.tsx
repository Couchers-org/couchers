import { JSONValue } from "@growthbook/growthbook";
import { useFeatureValue } from "@growthbook/growthbook-react";
import { Alert as MuiAlert, AlertColor } from "@mui/material";
import Sentry from "platform/sentry";
import { usePersistedState } from "platform/usePersistedState";
import React, { useEffect } from "react";

type GlobalMessageData = { severity: AlertColor; message: string };

const SEVERITIES: readonly AlertColor[] = ["success", "info", "warning", "error"];

// { "severity": "info", "message": "Logins are <b>down</b>" }
function parseGlobalMessage(flag: JSONValue): GlobalMessageData | null {
  if (flag === null) return null;
  if (typeof flag !== "object" || Array.isArray(flag)) throw new Error("global_message is not an object");

  const { message } = flag;
  if (message === undefined || message === "") return null;
  if (typeof message !== "string") throw new Error("global_message.message is not a string");

  const severity = SEVERITIES.find((s) => s === flag.severity);
  if (!severity) throw new Error("global_message.severity is not a known severity");

  return { severity, message };
}

export function GlobalMessage() {
  const flag = useFeatureValue<JSONValue>("global_message", null);
  // dismissal is keyed on the banner's contents, so publishing anything different re-shows it
  const [dismissed, setDismissed] = usePersistedState<string | null>("globalmessage.dismissed", null);

  const flagJson = JSON.stringify(flag);
  let data: GlobalMessageData | null = null;
  let error: string | null = null;
  try {
    data = parseGlobalMessage(flag);
  } catch (e) {
    error = (e as Error).message;
  }

  // deps are strings because GrowthBook rebuilds the flag object on every refresh
  useEffect(() => {
    if (error === null) return;
    Sentry.captureException(new Error(error), {
      tags: { component: "GlobalMessage" },
      extra: { flag: flagJson },
    });
  }, [error, flagJson]);

  if (data === null) return null;

  const key = `${data.severity}:${data.message}`;
  if (key === dismissed) return null;

  return (
    <MuiAlert severity={data.severity} onClose={() => setDismissed(key)}>
      <span dangerouslySetInnerHTML={{ __html: data.message }} />
    </MuiAlert>
  );
}
