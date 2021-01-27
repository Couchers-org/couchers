import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export default function useOnVisibleEffect(
  messageId: number,
  onVisible?: (id: number) => void
) {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && onVisible) {
      onVisible(messageId);
    }
  }, [inView, onVisible, messageId]);

  return { ref };
}
