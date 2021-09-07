import { useMediaQuery, useTheme } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import classNames from "classnames";
import React, { ReactNode } from "react";
import makeStyles from "utils/makeStyles";

import useOnVisibleEffect from "../utils/useOnVisibleEffect";
import CircularProgress from "./CircularProgress";

const useStyles = makeStyles((theme) => ({
  root: {
    alignItems: "stretch",
    display: "inline-flex",
    flexDirection: "row",
    height: "100%",
    width: "100%",
    padding: theme.spacing(2),
    WebkitOverflowScrolling: "touch",
    overflowX: "scroll",
    scrollSnapType: "x mandatory",
    scrollPadding: theme.spacing(1.5),
    "& > *": {
      flexShrink: 0,
    },
  },
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
  breakpoint = "xs",
  fetchNext,
  isFetching,
  hasMore,
  className,
  children,
}: HorizontalScrollerProps) {
  const classes = useStyles();

  const { ref: loaderRef } = useOnVisibleEffect(fetchNext);

  const theme = useTheme();
  const isBelowBreakpoint = useMediaQuery(theme.breakpoints.down(breakpoint));

  return (
    <div
      className={classNames({ [classes.root]: isBelowBreakpoint }, className)}
    >
      {children}
      {fetchNext && hasMore && (
        <div>
          {isFetching ? (
            <CircularProgress />
          ) : (
            <CircularProgress variant="determinate" value={0} ref={loaderRef} />
          )}
        </div>
      )}
    </div>
  );
}
