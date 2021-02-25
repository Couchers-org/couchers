import { Hidden, makeStyles } from "@material-ui/core";
import classNames from "classnames";
import React, { ReactNode } from "react";

import useOnVisibleEffect from "../utils/useOnVisibleEffect";
import CircularProgress from "./CircularProgress";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    padding: theme.spacing(2),
    flexDirection: "row",
    alignItems: "center",
    "& > *": {
      flex: "0 0 auto",
      marginInlineEnd: theme.spacing(2),
      [theme.breakpoints.up("md")]: {
        marginBottom: theme.spacing(2),
      },
    },
    [theme.breakpoints.up("md")]: {
      flexWrap: "wrap",
    },
    [theme.breakpoints.down("sm")]: {
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      alignItems: "center",
      //this and below "padder" are required because browsers
      //ignore scroll-end padding
      "& > *:last-child": {
        marginInlineStart: 0,
      },
    },
  },
  padder: {
    width: theme.spacing(2),
    height: 1,
  },
}));

interface HorizontalScrollerProps {
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
  const classes = useStyles();

  const { ref: loaderRef } = useOnVisibleEffect(fetchNext);

  return (
    <div className={classNames(classes.root, className)}>
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
      <Hidden mdUp>
        <div className={classes.padder} />
      </Hidden>
    </div>
  );
}
