import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Redirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    if (router.asPath === to) {
      console.warn("Prevented redirect to same page");
      return;
    }
    router.push(to);
  }, [router, to]);
  return null;
}
