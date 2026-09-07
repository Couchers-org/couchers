import { JSONValue } from "@growthbook/growthbook";
import { useFeatureValue } from "@growthbook/growthbook-react";
import { Alert as MuiAlert, AlertColor } from "@mui/material";
import Sentry from "platform/sentry";
import { usePersistedState } from "platform/usePersistedState";
import React, { useEffect } from "react";

type ParsedGlobalMessage =
  | { status: "none" }
  | { status: "invalid" }
  | { status: "ok"; severity: AlertColor; message: string };

const SEVERITIES: readonly AlertColor[] = ["success", "info", "warning", "error"];

// the flag holds hand-authored JSON and this banner renders on every page, so anything that isn't
// the expected shape is reported and ignored rather than left to throw inside MuiAlert
function parseGlobalMessage(flag: JSONValue): ParsedGlobalMessage {
  if (flag === null) return { status: "none" };
  if (typeof flag !== "object" || Array.isArray(flag)) return { status: "invalid" };
  // an absent or empty message is how the banner is turned off
  if (flag.message === undefined || flag.message === "") return { status: "none" };
  const severity = SEVERITIES.find((s) => s === flag.severity);
  if (typeof flag.message !== "string" || !severity) return { status: "invalid" };
  return { status: "ok", severity, message: flag.message };
}

export function GlobalMessage() {
  const flag = useFeatureValue<JSONValue>("global_message", null);
  // dismissal is keyed on the banner's contents, so publishing anything different re-shows it
  const [dismissed, setDismissed] = usePersistedState<string | null>("globalmessage.dismissed", null);

  const parsed = parseGlobalMessage(flag);
  // the payload is refetched on a timer, so key the report on the value rather than on the object
  // identity, which changes on every refresh
  const invalid = parsed.status === "invalid" ? JSON.stringify(flag) : null;

  useEffect(() => {
    if (invalid === null) return;
    Sentry.captureException(new Error("Invalid global_message feature flag value"), {
      tags: { component: "GlobalMessage" },
      extra: { value: invalid },
    });
  }, [invalid]);

  if (parsed.status !== "ok") return null;

  const key = `${parsed.severity}:${parsed.message}`;
  if (key === dismissed) return null;

  return (
    <MuiAlert severity={parsed.severity} onClose={() => setDismissed(key)}>
      <span dangerouslySetInnerHTML={{ __html: parsed.message }} />
    </MuiAlert>
  );
}
