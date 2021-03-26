import { Box, makeStyles } from "@material-ui/core";
import classNames from "classnames";
import CircularProgress from "components/CircularProgress";
import { messageElementId } from "features/messages/messagelist/MessageView";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  className?: string;
  // I'm not sure on the appropriate type, but I needed children.props
  // and kept getting "Error: Property 'props' does not exist on type 'boolean | ReactChild | ReactFragment | ReactPortal'"".
  // and "Error: Property 'props' does not exist on type 'string'" even though props DOES exist
  children: any;
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

  // Scroll to bottom on load
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scroll(0, scrollRef.current.scrollHeight);
  }, []);

  //**  Keep place or keep at bottom on window resize (i.e. keyboard popup on mobile (hopefully)) **//
  // Save the current height outside of the eventlistener
  const [currentClientHeight, setCurrentClientHeight] = useState(0);
  useLayoutEffect(() => {
    scrollRef.current && setCurrentClientHeight(scrollRef.current.clientHeight);
  });

  useLayoutEffect(() => {
    const updateMessagePosition = () => {
      if (!scrollRef.current) return;
      const currentlyAtBottom =
        scrollRef.current.scrollHeight -
          scrollRef.current.scrollTop -
          currentClientHeight <=
        0;
      if (currentlyAtBottom) {
        // Send to bottom on window resize
        scrollRef.current.scroll(0, scrollRef.current.scrollHeight);
      }
      setCurrentClientHeight(scrollRef.current.clientHeight);
    };

    if (!scrollRef.current) return;
    window.addEventListener("resize", updateMessagePosition);
    return () => window.removeEventListener("resize", updateMessagePosition);
  }, [currentClientHeight]);

  //** Scroll to the bottom on new message  **//
  // Saving messages count to know whether a new message has been created
  const { messageId } = children.props.messages[0];
  const [newestMessageID, setNewestMessageID] = useState(messageId);

  useEffect(() => {
    if (!scrollRef.current) return;
    // If messageID has changed, new message has come in, so scroll to bottom
    if (messageId !== newestMessageID) {
      scrollRef.current.scroll(0, scrollRef.current.scrollHeight);
      setNewestMessageID(messageId);
    }
  });

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
