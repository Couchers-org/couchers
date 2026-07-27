import { styled } from "@mui/material";
import CircularProgress from "components/CircularProgress";
import { useAuthContext } from "features/auth/AuthProvider";
import { messageElementId } from "features/messages/messagelist/MessageView";
import { Message } from "proto/messages_pb";
import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { theme } from "theme";
import useOnVisibleEffect from "utils/useOnVisibleEffect";

const StyledWrapper = styled("div")(() => ({
  position: "relative",
  flex: 1,
  minHeight: 0,

  "&::-webkit-scrollbar": {
    background: "rgba(0,0,0,0)",
    height: "0.5rem",
    width: "0.5rem",
  },
  "&::-webkit-scrollbar:hover": {
    background: "rgba(0,0,0,0.1)",
    width: "0.5rem",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(0,0,0,0.2)",
    borderRadius: "20px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "rgba(0,0,0,0.3)",
  },
  overflowY: "auto",
  overflowX: "hidden",
  paddingInlineEnd: `0.5rem`,
  scrollbarHeight: "thin",
  scrollbarWidth: "thin",
}));

const StyledLoader = styled("div")(() => ({
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
  const { authState } = useAuthContext();

  const scrollRef = useRef<HTMLDivElement>(null);
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
      messageElementId(prevTopMessageId.current ?? 0),
    );
    messageEl?.scrollIntoView();
  }, [isFetchingNextPage]);

  // Scroll to bottom on load
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scroll(0, scrollRef.current.scrollHeight);
  }, []);

  //**  Keep at bottom on window resize only if user was already near the bottom **//
  useEffect(() => {
    const updateMessagePosition = () => {
      if (!scrollRef.current) return;

      // Only auto-scroll if user was already near the bottom
      // This prevents fighting with mobile keyboard focus behavior
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        scrollRef.current.scroll(0, scrollRef.current.scrollHeight);
      }
    };
    window.addEventListener("resize", updateMessagePosition);
    return () => window.removeEventListener("resize", updateMessagePosition);
  }, []);

  //** Scroll to the bottom after sending own new message  **//
  const savedMessageId = useRef(latestMessage?.messageId);
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const isUserMessage = latestMessage?.authorUserId === authState.userId;
    const isNewMessage = latestMessage?.messageId !== savedMessageId.current;
    if (isUserMessage && isNewMessage) {
      scrollRef.current.scroll(0, scrollRef.current.scrollHeight);
      savedMessageId.current = latestMessage?.messageId;
    }
  }, [latestMessage?.messageId, latestMessage?.authorUserId, authState.userId]);

  return (
    <StyledWrapper className={className} ref={scrollRef}>
      {hasNextPage && !isError && (
        <StyledLoader>
          {isFetchingNextPage ? (
            <CircularProgress />
          ) : (
            <CircularProgress
              variant="determinate"
              value={0}
              ref={loadMoreRef}
            />
          )}
        </StyledLoader>
      )}
      {children}
    </StyledWrapper>
  );
}
