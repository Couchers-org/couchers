import React, { useEffect, useState } from "react";

interface SafeLinesEllipsisProps {
  text: string;
  maxLine?: number;
  ellipsis?: string;
  trimRight?: boolean;
  basedOn?: string;
}

const SafeLinesEllipsis: React.FC<SafeLinesEllipsisProps> = ({
  text,
  maxLine = 1,
  ellipsis = "...",
  trimRight = true,
  basedOn = "letters",
}) => {
  const [mounted, setMounted] = useState(false);
  const [LinesEllipsis, setLinesEllipsis] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    const loadComponent = async () => {
      try {
        const component = await import("react-lines-ellipsis");
        setLinesEllipsis(() => component.default);
      } catch (error) {
        console.error("Failed to load LinesEllipsis:", error);
      }
    };

    loadComponent();
  }, []);

  if (!mounted || !LinesEllipsis) {
    return <span>{text}</span>;
  }

  return (
    <LinesEllipsis
      text={text}
      maxLine={maxLine}
      ellipsis={ellipsis}
      trimRight={trimRight}
      basedOn={basedOn}
    />
  );
};

export default SafeLinesEllipsis;
