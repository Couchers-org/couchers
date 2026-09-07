import { JSONValue } from "@growthbook/growthbook";
import { useFeatureValue } from "@growthbook/growthbook-react";
import { Alert as MuiAlert, AlertColor } from "@mui/material";
import Sentry from "platform/sentry";
import { usePersistedState } from "platform/usePersistedState";
import React, { useEffect } from "react";

type ParsedGlobalMessage =
  | { status: "off" }
  | { status: "invalid" }
  | { status: "ok"; severity: AlertColor; message: string };

const SEVERITIES: readonly AlertColor[] = ["success", "info", "warning", "error"];

/**
 * Interprets the raw flag value, which is JSON typed by hand into the GrowthBook console and so
 * can be anything at all. What we want is:
 *
 *     { "severity": "info", "message": "Logins are <b>down</b>" }
 *
 * "off" and "invalid" are told apart because switching the banner off is routine, whereas a value
 * we can't render is a mistake worth reporting: since the flag is only ever set during an
 * incident, a silently absent banner is the worst way to find out about a typo.
 */
function parseGlobalMessage(flag: JSONValue): ParsedGlobalMessage {
  if (flag === null) {
    return { status: "off" };
  }

  if (typeof flag !== "object" || Array.isArray(flag)) {
    return { status: "invalid" };
  }

  const { severity: rawSeverity, message } = flag;

  // clearing the message out is the other way to switch the banner off
  if (message === undefined || message === "") {
    return { status: "off" };
  }

  if (typeof message !== "string") {
    return { status: "invalid" };
  }

  const severity = SEVERITIES.find((s) => s === rawSeverity);
  if (severity === undefined) {
    return { status: "invalid" };
  }

  return { status: "ok", severity, message };
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
