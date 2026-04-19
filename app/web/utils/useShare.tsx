import Snackbar from "components/Snackbar";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { ReactNode, useCallback, useState } from "react";

import { share, ShareContent } from "./nativeLink";

export function useShare(): {
  share: (content: ShareContent) => Promise<void>;
  shareStatus: ReactNode;
} {
  const { t } = useTranslation(GLOBAL);
  const [message, setMessage] = useState<{
    severity: "success" | "error";
    text: string;
    key: number;
  } | null>(null);

  const doShare = useCallback(
    async (content: ShareContent) => {
      const result = await share(content);
      if (result.method === "clipboard") {
        setMessage({
          severity: "success",
          text: t("global:share.link_copied"),
          key: Date.now(),
        });
      } else if (result.method === "unsupported") {
        setMessage({
          severity: "error",
          text: t("global:share.failed"),
          key: Date.now(),
        });
      }
    },
    [t],
  );

  const shareStatus = message ? (
    <Snackbar
      key={message.key}
      severity={message.severity}
      onClose={() => setMessage(null)}
    >
      {message.text}
    </Snackbar>
  ) : null;

  return { share: doShare, shareStatus };
}
