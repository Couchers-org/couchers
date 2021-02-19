import { Box, makeStyles } from "@material-ui/core";
import classNames from "classnames";
import React, { ReactNode } from "react";

import useOnVisibleEffect from "../utils/useOnVisibleEffect";
import CircularProgress from "./CircularProgress";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    padding: theme.spacing(2),
    "& > *": {
      flex: "0 0 auto",
    },
    ...theme.shape.scrollBar,
  },
  loader: {},
}));

/// TODO: Improve for desktop (left/right arrows, index dots display)
/// TODO: Padding is not shows at end of list (maybe storybook only?)

interface HorizontalScrollerProps {
  fetchNext?: () => void;
  isFetching?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function HorizontalScroller({
  fetchNext,
  isFetching,
  className,
  children,
}: HorizontalScrollerProps) {
  const classes = useStyles();

  const { ref: loaderRef } = useOnVisibleEffect(fetchNext);

  return (
    <Box className={classNames(classes.root, className)}>
      {children}
      {fetchNext && (
        <Box className={classes.loader}>
          {isFetching ? (
            <CircularProgress opaque />
          ) : (
            <CircularProgress
              opaque
              variant="determinate"
              value={0}
              ref={loaderRef}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
