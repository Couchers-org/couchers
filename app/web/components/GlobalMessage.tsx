import { useFeatureValue } from "@growthbook/growthbook-react";
import { Alert as MuiAlert, AlertColor } from "@mui/material";
import { usePersistedState } from "platform/usePersistedState";
import React from "react";

// a type, not an interface, so it satisfies useFeatureValue's JSONValue constraint
type GlobalMessageData = {
  severity: string;
  message: string;
};

const SEVERITIES: readonly AlertColor[] = ["success", "info", "warning", "error"];

// the flag holds hand-authored JSON and this banner renders on every page, so anything that isn't
// exactly the expected shape is ignored rather than left to throw inside MuiAlert
function parseGlobalMessage(data: GlobalMessageData | null) {
  if (!data) return null;
  const { message } = data;
  if (typeof message !== "string" || !message) return null;
  const severity = SEVERITIES.find((s) => s === data.severity);
  return severity ? { severity, message } : null;
}

export function GlobalMessage() {
  const flag = useFeatureValue<GlobalMessageData | null>("global_message", null);
  // dismissal is keyed on the banner's contents, so publishing anything different re-shows it
  const [dismissed, setDismissed] = usePersistedState<string | null>("globalmessage.dismissed", null);

  const data = parseGlobalMessage(flag);
  if (!data) return null;

  const key = `${data.severity}:${data.message}`;
  if (key === dismissed) return null;

  return (
    <MuiAlert severity={data.severity} onClose={() => setDismissed(key)}>
      <span dangerouslySetInnerHTML={{ __html: data.message }} />
    </MuiAlert>
  );
}
