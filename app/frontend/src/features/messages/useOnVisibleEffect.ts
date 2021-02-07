import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export default function useOnVisibleEffect<Param>(
  param: Param,
  onVisible?: (param: Param) => void
) {
  const { ref, inView } = useInView({
    threshold: 0.9,
  });

  useEffect(() => {
    if (inView) {
      onVisible?.(param);
    }
  }, [inView, onVisible, param]);

  return { ref };
}
