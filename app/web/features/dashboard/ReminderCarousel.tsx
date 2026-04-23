import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { Box, styled } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import IconButton from "components/IconButton";
import { RpcError } from "grpc-web";
import { GetRemindersRes } from "proto/account_pb";
import { useEffect, useRef, useState } from "react";
import { service } from "service";

import { remindersKey } from "../queryKeys";
import ReminderItem from "./ReminderItem";

const CARD_WIDTH = 280;
const CARD_GAP = 16;

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  width: "100%",
}));

const StyledScroller = styled(Box)({
  display: "flex",
  gap: `${CARD_GAP}px`,
  flex: 1,
  minWidth: 0,
  overflowX: "auto",
  scrollSnapType: "x mandatory",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
});

const StyledCardSlot = styled(Box)({
  flex: `0 0 ${CARD_WIDTH}px`,
  scrollSnapAlign: "start",
});

const StyledArrow = styled(IconButton)({
  backgroundColor: "var(--mui-palette-primary-main)",
  color: "var(--mui-palette-primary-contrastText)",
  "&:hover": {
    backgroundColor: "var(--mui-palette-primary-dark)",
  },
  "&.Mui-disabled": {
    backgroundColor: "var(--mui-palette-grey-300)",
    color: "var(--mui-palette-grey-500)",
  },
});

export default function ReminderCarousel() {
  const { data, error } = useQuery<GetRemindersRes.AsObject, RpcError>({
    queryKey: [remindersKey],
    queryFn: () => service.account.getReminders(),
  });

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const reminders = data?.remindersList ?? [];

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollState();
  }, [reminders.length]);

  const scrollByCard = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left: direction * (CARD_WIDTH + CARD_GAP),
      behavior: "smooth",
    });
  };

  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!reminders.length) return null;

  return (
    <StyledContainer>
      <StyledArrow
        aria-label="scroll left"
        onClick={() => scrollByCard(-1)}
        disabled={!canScrollLeft}
      >
        <ChevronLeftIcon />
      </StyledArrow>

      <StyledScroller ref={scrollerRef} onScroll={updateScrollState}>
        {reminders.map((reminder, i) => (
          <StyledCardSlot key={i}>
            <ReminderItem reminder={reminder} />
          </StyledCardSlot>
        ))}
      </StyledScroller>

      <StyledArrow
        aria-label="scroll right"
        onClick={() => scrollByCard(1)}
        disabled={!canScrollRight}
      >
        <ChevronRightIcon />
      </StyledArrow>
    </StyledContainer>
  );
}
