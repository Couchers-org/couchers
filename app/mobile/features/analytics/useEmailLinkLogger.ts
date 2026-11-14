import { useEffect } from "react";
import { Linking } from "react-native";

import { logEvent } from "@/service/analytics";

let initialUrlLogged = false;

function logEmailLink(url: string | null): void {
  if (!url) return;
  const parsed = new URL(url);
  const zz = parsed.searchParams.get("zz");
  if (!zz) return;
  logEvent("email.link_opened", { zz, path: parsed.pathname });
}

export function useEmailLinkLogger() {
  useEffect(() => {
    if (!initialUrlLogged) {
      initialUrlLogged = true;
      Linking.getInitialURL().then(logEmailLink);
    }

    const subscription = Linking.addEventListener("url", ({ url }) =>
      logEmailLink(url),
    );
    return () => {
      subscription.remove();
    };
  }, []);
}
