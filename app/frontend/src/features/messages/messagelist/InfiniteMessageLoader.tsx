import { Box, makeStyles, Typography } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import classNames from "classnames";
import React, { ReactNode, useCallback, useEffect, useRef } from "react";

import useOnVisibleEffect from "../useOnVisibleEffect";

const useStyles = makeStyles((theme) => ({
  loader: {
    //px for easier scroll compensation
    width: "100%",
    position: "absolute",
    top: 0,
    paddingTop: theme.spacing(1),
    "& > *": {
      display: "block",
      marginInline: "auto",
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
    //unset the secondary loadMoreRef to prevent double-fetch
    hasScrolled.current = false;
    prevScrollHeight.current = scrollRef.current?.scrollHeight;
    if (earliestMessageId) {
      prevTopMessageId.current = earliestMessageId;
    }
    fetchNextPage();
  }, [earliestMessageId, fetchNextPage]);

  const { ref: loadMoreRef } = useOnVisibleEffect(null, handleLoadMoreVisible);

  //because scrolling happens when once fetch is complete
  //loadMoreRef is visible again briefly before the scroll
  //so gets called a second time.
  //So we use a second ref which is unset on fetch and
  //re-set after scroll.
  const hasScrolled = useRef<boolean>(true);
  const loadMoreRefAfterScroll = (node: Element | null | undefined) =>
    hasScrolled ? loadMoreRef(node) : undefined;

  useEffect(() => {
    if (isFetchingNextPage) return;
    const messageEl = document.getElementById(
      `message-${prevTopMessageId.current}`
    );
    messageEl?.scrollIntoView();
    //scroll is complete, put the loadMoreRef back
    hasScrolled.current = true;
  }, [isFetchingNextPage, loadMoreRef]);

  //scroll to the bottom on page load
  useEffect(() => {
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
              ref={loadMoreRefAfterScroll}
            />
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}
