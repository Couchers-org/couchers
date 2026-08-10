import { Alert as MuiAlert } from "@mui/material";
import { useFeatureValue } from "features/experimentation";
import { usePersistedState } from "platform/usePersistedState";
import React from "react";

// a type, not an interface, so it satisfies useFeatureValue's JSONValue constraint
type GlobalMessageData = {
  severity: "success" | "info" | "warning" | "error";
  message: string;
};

export function GlobalMessage() {
  const data = useFeatureValue<GlobalMessageData | null>("global_message", null);
  // dismissal is keyed on the banner's contents, so publishing anything different re-shows it
  const [dismissed, setDismissed] = usePersistedState<string | null>("globalmessage.dismissed", null);

  const key = data ? `${data.severity}:${data.message}` : null;

  const dismiss = () => {
    if (key) setDismissed(key);
  };

  return data && data.message && key != dismissed ? (
    <MuiAlert severity={data.severity} onClose={dismiss}>
      <span dangerouslySetInnerHTML={{ __html: data.message }} />
    </MuiAlert>
  ) : null;
}
