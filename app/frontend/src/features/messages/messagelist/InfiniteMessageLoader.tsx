import { Box, makeStyles } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import classNames from "classnames";
import React, { ReactNode, useCallback, useLayoutEffect, useRef } from "react";

import useOnVisibleEffect from "../useOnVisibleEffect";
import { messageElementId } from "./MessageView";

const useStyles = makeStyles((theme) => ({
  loader: {
    width: "100%",
    position: "absolute",
    top: 0,
    paddingTop: theme.spacing(1),
    "& > *": {
      display: "block",
      marginInlineStart: "auto",
      marginInlineEnd: "auto",
    },
  },
  scroll: {
    ...theme.shape.scrollBar,
    position: "relative",
  },
}));

interface InfiniteMessageLoaderProps {
  earliestMessageId?: number;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  className?: string;
  children: ReactNode;
}

export default function InfiniteMessageLoader({
  earliestMessageId,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  isError,
  className,
  children,
}: InfiniteMessageLoaderProps) {
  const classes = useStyles();

  const scrollRef = useRef<HTMLElement>(null);
  const prevScrollHeight = useRef<number | undefined>(undefined);
  const prevTopMessageId = useRef<number | null>(null);

  const handleLoadMoreVisible = useCallback(() => {
    prevScrollHeight.current = scrollRef.current?.scrollHeight;
    if (earliestMessageId) {
      prevTopMessageId.current = earliestMessageId;
    }
    fetchNextPage();
  }, [earliestMessageId, fetchNextPage]);

  const { ref: loadMoreRef } = useOnVisibleEffect(handleLoadMoreVisible);

  useLayoutEffect(() => {
    if (isFetchingNextPage) return;
    const messageEl = document.getElementById(
      messageElementId(prevTopMessageId.current ?? 0)
    );
    messageEl?.scrollIntoView();
  }, [isFetchingNextPage]);

  //scroll to the bottom on page load
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scroll(0, scrollRef.current.scrollHeight);
  }, [scrollRef]);

  return (
    <Box className={classNames(classes.scroll, className)} ref={scrollRef}>
      {hasNextPage && !isError && (
        <Box className={classes.loader}>
          {isFetchingNextPage ? (
            <CircularProgress />
          ) : (
            <CircularProgress
              variant="determinate"
              value={0}
              ref={loadMoreRef}
            />
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}
