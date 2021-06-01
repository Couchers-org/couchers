import { useMediaQuery, useTheme } from "@material-ui/core";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";
import classNames from "classnames";
import React, { ReactNode } from "react";
import makeStyles from "utils/makeStyles";

import useOnVisibleEffect from "../utils/useOnVisibleEffect";
import CircularProgress from "./CircularProgress";

const useStyles = makeStyles((theme) => ({
  padder: {
    height: 1,
    width: 0.1,
  },
  root: {
    "& > *": {
      flexShrink: 0,
      width: "100%",
    },
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    overflowX: "auto",
    padding: theme.spacing(2),
    WebkitOverflowScrolling: "touch",
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
      {
        //this padding is required because browsers ignore scroll-end margins
        isBelowBreakpoint && <div className={classes.padder} />
      }
    </div>
  );
}
