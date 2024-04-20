import type { NextRouter } from "next/router";
import { useRouter } from "next/router";
import { useRef, useState } from "react";

// from https://github.com/vercel/next.js/issues/18127#issuecomment-950907739
export default function useStablePush(): NextRouter["push"] {
  const router = useRouter();
  const routerRef = useRef(router);

  routerRef.current = router;

  const [{ push }] = useState<Pick<NextRouter, "push">>({
    push: (path) => routerRef.current.push(path),
  });

  return push;
}
