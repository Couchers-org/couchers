import { useRouter } from "next/router";
import { useEffect } from "react";

import log from "@/log";

const Redirect = ({ to }: { to: string }) => {
  const router = useRouter();
  useEffect(() => {
    if (router.asPath === to) {
      log.warn("Prevented redirect to same page");
      return;
    }
    void router.push(to);
  }, [router, to]);
  return null;
};

export default Redirect;
