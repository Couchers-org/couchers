import { Hidden, makeStyles, useMediaQuery, useTheme } from "@material-ui/core";
import classNames from "classnames";
import React, { ReactNode } from "react";

import useOnVisibleEffect from "../utils/useOnVisibleEffect";
import CircularProgress from "./CircularProgress";

const useStyles = makeStyles((theme) => ({
  padder: {
    height: 1,
    width: theme.spacing(2),
  },
  root: {
    "& > *": {
      flex: "0 0 auto",
      marginInlineEnd: theme.spacing(2),
    },
    //this and below "padder" are required because browsers
    //ignore scroll-end padding
    "& > *:last-child": {
      marginInlineStart: 0,
    },
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    overflowX: "auto",
    padding: theme.spacing(2),
    WebkitOverflowScrolling: "touch",
  },
}));

interface HorizontalScrollerProps {
  fetchNext?: () => void;
  isFetching?: boolean;
  hasMore?: boolean;
  className?: string;
  children?: ReactNode;
}

/// HorizontalScroller only applies it's scrolling to xs breakpoint
export default function HorizontalScroller({
  fetchNext,
  isFetching,
  hasMore,
  className,
  children,
}: HorizontalScrollerProps) {
  const classes = useStyles();

  const { ref: loaderRef } = useOnVisibleEffect(fetchNext);

  const theme = useTheme();
  const isBelowXs = useMediaQuery(theme.breakpoints.down("xs"));

  return (
    <div className={classNames({ [classes.root]: isBelowXs }, className)}>
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
      <Hidden smUp>
        <div className={classes.padder} />
      </Hidden>
    </div>
  );
}
