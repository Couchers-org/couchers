import Snackbar from "components/Snackbar";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { ReactNode, useCallback, useState } from "react";

import { share, ShareContent, ShareOutcome } from "./nativeLink";

export function useShare(): {
  share: (content: ShareContent) => Promise<ShareOutcome>;
  shareStatus: ReactNode;
} {
  const { t } = useTranslation(GLOBAL);
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const [nonce, setNonce] = useState(0);

  const doShare = useCallback(async (content: ShareContent) => {
    const result = await share(content);
    setOutcome(result);
    setNonce((n) => n + 1);
    return result;
  }, []);

  let shareStatus: ReactNode = null;
  if (outcome === "clipboard") {
    shareStatus = (
      <Snackbar key={nonce} severity="success" onClose={() => setOutcome(null)}>
        {t("global:share.link_copied")}
      </Snackbar>
    );
  } else if (outcome === "failed") {
    shareStatus = (
      <Snackbar key={nonce} severity="error" onClose={() => setOutcome(null)}>
        {t("global:share.failed")}
      </Snackbar>
    );
  }

  return { share: doShare, shareStatus };
}
