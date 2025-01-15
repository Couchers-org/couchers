import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export default function useOnVisibleEffect(onVisible?: () => void) {
  const { ref, inView } = useInView({
    threshold: 0.9,
  });

  useEffect(() => {
    if (inView) {
      onVisible?.();
    }
  }, [inView, onVisible]);

  return { ref };
}
