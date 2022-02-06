import { MutableRefObject, useEffect } from "react";

interface FontResizerProps {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  textRef: MutableRefObject<HTMLDivElement | null>;
}

const UseFontResizer = ({ containerRef, textRef }: FontResizerProps) => {
  useEffect(() => {
    if (
      containerRef.current &&
      containerRef.current.offsetWidth &&
      textRef.current &&
      textRef.current.offsetWidth
    ) {
      const scrollWidth = textRef.current.scrollWidth;
      const containerWidth = containerRef.current.offsetWidth;
      const oldFont = parseFloat(
        window.getComputedStyle(textRef.current, null).fontSize
      );

      if (scrollWidth >= containerWidth) {
        const difference = scrollWidth / containerWidth;
        const newSize = (containerWidth * oldFont) / scrollWidth / difference;
        if (newSize > 6) {
          // setNewFontSize(newSize)
          textRef.current.style.fontSize = `${newSize}px`;
        } else {
          // setNewFontSize(6)
          textRef.current.style.fontSize = "6px";
          textRef.current.style.overflowWrap = "anywhere";
          textRef.current.style.hyphens = "auto";
        }
      }
    }
  }, [containerRef, textRef]);
};

export default UseFontResizer;
