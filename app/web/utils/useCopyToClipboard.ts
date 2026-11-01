import { useCallback, useEffect, useRef, useState } from "react";

type CopyStatus = "idle" | "copied" | "failed";

// status goes back to "idle" after resetAfterMs, so feedback like "Copied!" can be shown temporarily
export default function useCopyToClipboard(resetAfterMs = 2000) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    async (text: string) => {
      let result: CopyStatus;
      try {
        // clipboard is undefined outside secure contexts, which throws here too
        await navigator.clipboard.writeText(text);
        result = "copied";
      } catch {
        // shown to the user instead of thrown: the browser or user can deny clipboard access
        result = "failed";
      }
      setStatus(result);
      setCopiedText(text);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setStatus("idle");
        setCopiedText(null);
      }, resetAfterMs);
    },
    [resetAfterMs],
  );

  return { copy, status, copiedText };
}
