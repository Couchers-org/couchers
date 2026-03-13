import { styled } from "@mui/material";
import { Breakpoint } from "@mui/material/styles";
import React, { ReactNode } from "react";
import useIsMobile from "utils/useIsMobile";

import useOnVisibleEffect from "../utils/useOnVisibleEffect";
import CircularProgress from "./CircularProgress";

interface CustomWrapperProps {
  isBelowBreakpoint: boolean;
}

const StyledWrapper = styled("div")<CustomWrapperProps>(
  ({ theme, isBelowBreakpoint }) => ({
    ...(isBelowBreakpoint && {
      alignItems: "stretch",
      display: "inline-flex",
      flexDirection: "row",
      height: "100%",
      width: "100vw",
      padding: theme.spacing(2),
      WebkitOverflowScrolling: "touch",
      overflowX: "scroll",
      scrollSnapType: "x mandatory",
      scrollPadding: theme.spacing(1.5),
      "& > *": {
        flexShrink: 0,
      },
    }),
  }),
);

const StyledLoaderContainer = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
}));

interface HorizontalScrollerProps {
  //horizontal scroller will only apply at this breakpoint and below
  breakpoint?: Breakpoint;
  fetchNext?: () => void;
  isFetching?: boolean;
  hasMore?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function HorizontalScroller({
  fetchNext,
  isFetching,
  hasMore,
  className,
  children,
}: HorizontalScrollerProps) {
  const { ref: loaderRef } = useOnVisibleEffect(fetchNext);

  const isMobile = useIsMobile();

  return (
    <StyledWrapper className={className} isBelowBreakpoint={isMobile}>
      {children}
      {fetchNext && hasMore && (
        <StyledLoaderContainer>
          {isFetching ? (
            <CircularProgress />
          ) : (
            <CircularProgress variant="determinate" value={0} ref={loaderRef} />
          )}
        </StyledLoaderContainer>
      )}
    </StyledWrapper>
  );
}
