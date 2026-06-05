import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { Box, styled, useMediaQuery } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import IconButton from "components/IconButton";
import { RpcError } from "grpc-web";
import { usePersistedState } from "platform/usePersistedState";
import { GetRemindersRes, Reminder } from "proto/account_pb";
import { useEffect, useRef, useState } from "react";
import { service } from "service";

import { theme } from "../../theme";
import { remindersKey } from "../queryKeys";
import ReminderItem from "./ReminderItem";

const CARD_WIDTH_DESKTOP = 280;
const CARD_WIDTH_MOBILE = 200;
const CARD_GAP = 16;

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface ReminderWithId {
  id: string;
  reminder: Reminder.AsObject;
}

function getReminderId(reminder: Reminder.AsObject): string | null {
  if (reminder.respondToHostRequestReminder?.hostRequestId != null) {
    return `respond_host_request:${reminder.respondToHostRequestReminder.hostRequestId}`;
  }
  if (reminder.writeReferenceReminder?.hostRequestId != null) {
    return `write_reference:${reminder.writeReferenceReminder.hostRequestId}`;
  }
  if (reminder.completeProfileReminder) {
    return "complete_profile";
  }
  if (reminder.completeMyHomeReminder) {
    return "complete_my_home";
  }
  if (reminder.completeVerificationReminder) {
    return "complete_verification";
  }
  if (reminder.confirmHostRequestReminder?.hostRequestId != null) {
    return `confirm_host_request:${reminder.confirmHostRequestReminder.hostRequestId}`;
  }
  return null;
}

function pruneStaleEntries(
  dismissedReminders: Record<string, number>,
  currentDismissalTime: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [reminderId, dismissalTime] of Object.entries(
    dismissedReminders,
  )) {
    if (currentDismissalTime - dismissalTime < ONE_WEEK_MS) {
      out[reminderId] = dismissalTime;
    }
  }
  return out;
}

function isStillDismissed(
  dismissedReminders: Record<string, number>,
  key: string,
): boolean {
  const now = Date.now();
  const ts = dismissedReminders[key];
  if (ts === undefined) return false;
  return now - ts < ONE_WEEK_MS;
}

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
  flex: `0 0 ${CARD_WIDTH_DESKTOP}px`,
  scrollSnapAlign: "start",

  [theme.breakpoints.down("md")]: {
    flex: `0 0 ${CARD_WIDTH_MOBILE}px`,
  },
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

  const [dismissedReminders, setDismissedReminders] = usePersistedState<
    Record<string, number>
  >("dismissedReminders", {});

  const scrollerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const reminders = data?.remindersList ?? [];

  const visibleReminders = reminders.reduce<ReminderWithId[]>((acc, r) => {
    const id = getReminderId(r);
    if (id && !isStillDismissed(dismissedReminders, id)) {
      acc.push({ id, reminder: r });
    }
    return acc;
  }, []);

  const handleDismiss = (id: string) => {
    const dismissTime = Date.now();
    const pruned = pruneStaleEntries(dismissedReminders, dismissTime);
    setDismissedReminders({ ...pruned, [id]: dismissTime });
  };

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollState();
  }, [visibleReminders.length]);

  const scrollByCard = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left:
        direction *
        (isMobile
          ? CARD_WIDTH_MOBILE + CARD_GAP
          : CARD_WIDTH_DESKTOP + CARD_GAP),
      behavior: "smooth",
    });
  };

  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!visibleReminders.length) return null;

  const FADE = "40px";
  const scrollerMask =
    canScrollLeft && canScrollRight
      ? `linear-gradient(to right, transparent, black ${FADE}, black calc(100% - ${FADE}), transparent)`
      : canScrollLeft
        ? `linear-gradient(to right, transparent, black ${FADE})`
        : canScrollRight
          ? `linear-gradient(to left, transparent, black ${FADE})`
          : undefined;

  return (
    <StyledContainer>
      <StyledArrow
        aria-label="scroll left"
        size={isMobile ? "small" : "medium"}
        onClick={() => scrollByCard(-1)}
        disabled={!canScrollLeft}
      >
        <ChevronLeftIcon />
      </StyledArrow>

      <StyledScroller
        ref={scrollerRef}
        onScroll={updateScrollState}
        sx={{
          ...(isMobile && visibleReminders.length === 1
            ? { justifyContent: "center" }
            : {}),
          ...(scrollerMask
            ? { maskImage: scrollerMask, WebkitMaskImage: scrollerMask }
            : {}),
        }}
      >
        {visibleReminders.map(({ id, reminder }) => (
          <StyledCardSlot key={id}>
            <ReminderItem
              reminder={reminder}
              onDismiss={() => handleDismiss(id)}
            />
          </StyledCardSlot>
        ))}
      </StyledScroller>

      <StyledArrow
        aria-label="scroll right"
        size={isMobile ? "small" : "medium"}
        onClick={() => scrollByCard(1)}
        disabled={!canScrollRight}
      >
        <ChevronRightIcon />
      </StyledArrow>
    </StyledContainer>
  );
}
