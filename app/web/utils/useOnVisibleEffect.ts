import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

const useOnVisibleEffect = (onVisible?: () => void) => {
  const { ref, inView: isInView } = useInView({
    threshold: 0.9,
  });

  useEffect(() => {
    if (isInView) {
      onVisible?.();
    }
  }, [isInView, onVisible]);

  return { ref };
};

export default useOnVisibleEffect;
