import { Box } from "@material-ui/core";
import classNames from "classnames";
import CircularProgress from "components/CircularProgress";
import useAuthStore from "features/auth/useAuthStore";
import { messageElementId } from "features/messages/messagelist/MessageView";
import { Message } from "proto/conversations_pb";
import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import makeStyles from "utils/makeStyles";
import useOnVisibleEffect from "utils/useOnVisibleEffect";

const useStyles = makeStyles((theme) => ({
  loader: {
    "& > *": {
      display: "block",
      marginInlineEnd: "auto",
      marginInlineStart: "auto",
    },
    paddingTop: theme.spacing(1),
    position: "absolute",
    top: 0,
    width: "100%",
  },
  scroll: {
    ...theme.shape.scrollBar,
    position: "relative",
  },
}));

interface InfiniteMessageLoaderProps {
  earliestMessageId?: number;
  latestMessage?: Message.AsObject;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  className?: string;
  children: ReactNode;
}

export default function InfiniteMessageLoader({
  earliestMessageId,
  latestMessage,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  isError,
  className,
  children,
}: InfiniteMessageLoaderProps) {
  const classes = useStyles();
  const currentUserId = useAuthStore().authState.userId;

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

  // Scroll to bottom on load
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scroll(0, scrollRef.current.scrollHeight);
  }, []);

  //**  Keep place or keep at bottom on window resize (i.e. keyboard popup on mobile (hopefully)) **//
  useEffect(() => {
    const updateMessagePosition = () => {
      if (!scrollRef.current) return;
      scrollRef.current.scroll(0, scrollRef.current.scrollHeight);
    };
    window.addEventListener("resize", updateMessagePosition);
    return () => window.removeEventListener("resize", updateMessagePosition);
  }, []);

  //** Scroll to the bottom after sending own new message  **//
  const savedMessageId = useRef(latestMessage?.messageId);
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const isUserMessage = latestMessage?.authorUserId === currentUserId;
    const isNewMessage = latestMessage?.messageId !== savedMessageId.current;
    if (isUserMessage && isNewMessage) {
      scrollRef.current.scroll(0, scrollRef.current.scrollHeight);
      savedMessageId.current = latestMessage?.messageId;
    }
  }, [latestMessage?.messageId, latestMessage?.authorUserId, currentUserId]);

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
