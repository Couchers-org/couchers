import type { NextRouter } from "next/router";
import { useRouter } from "next/router";
import { useRef, useState } from "react";

// Needed to prevent infinite loop when calling push from useEffect in dynamic routes
// See https://github.com/vercel/next.js/issues/18127#issuecomment-950907739
const useStablePush = (): NextRouter["push"] => {
  const router = useRouter();
  const routerRef = useRef(router);

  routerRef.current = router;

  // eslint-disable-next-line react/hook-use-state
  const [{ push }] = useState<Pick<NextRouter, "push">>({
    push: (path) => routerRef.current.push(path),
  });

  return push;
};

export default useStablePush;
