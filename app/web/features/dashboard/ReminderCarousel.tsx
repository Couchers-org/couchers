import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "@mui/icons-material";
import { Box, styled, useMediaQuery } from "@mui/material";
import Alert from "components/Alert";
import CardTrack, { useCardTrack } from "components/CardTrack";
import IconButton from "components/IconButton";
import { useTranslation } from "next-i18next";
import { usePersistedState } from "platform/usePersistedState";
import { Reminder } from "proto/account_pb";

import { DASHBOARD } from "../../i18n/namespaces";
import { theme } from "../../theme";
import ReminderItem from "./ReminderItem";
import useGetDashboard from "./useGetDashboard";

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
  if (reminder.respondToPublicTripOfferReminder?.hostRequestId != null) {
    return `respond_public_trip_offer:${reminder.respondToPublicTripOfferReminder.hostRequestId}`;
  }
  if (reminder.confirmPublicTripOfferReminder?.hostRequestId != null) {
    return `confirm_public_trip_offer:${reminder.confirmPublicTripOfferReminder.hostRequestId}`;
  }
  return null;
}

function pruneStaleEntries(
  dismissedReminders: Record<string, number>,
  currentDismissalTime: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [reminderId, dismissalTime] of Object.entries(dismissedReminders)) {
    if (currentDismissalTime - dismissalTime < ONE_WEEK_MS) {
      out[reminderId] = dismissalTime;
    }
  }
  return out;
}

function isStillDismissed(dismissedReminders: Record<string, number>, key: string): boolean {
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
  const { t } = useTranslation(DASHBOARD);

  const { data, error } = useGetDashboard((dashboard) => dashboard.reminders);

  const [dismissedReminders, setDismissedReminders] = usePersistedState<Record<string, number>>(
    "dismissedReminders",
    {},
  );

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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

  const track = useCardTrack({ maxCardsPerScroll: 1 });

  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!visibleReminders.length) return null;

  return (
    <StyledContainer>
      <StyledArrow
        aria-label={t("dashboard:reminder.carousel_scroller.left_arrow_a11y")}
        size={isMobile ? "small" : "medium"}
        onClick={track.navProps.onPrevious}
        disabled={!track.canScrollLeft}
      >
        <ChevronLeftIcon />
      </StyledArrow>

      <CardTrack
        track={track}
        cardWidth={CARD_WIDTH_DESKTOP}
        mobileCardWidth={CARD_WIDTH_MOBILE}
        gap={CARD_GAP}
        sx={{
          flex: 1,
          minWidth: 0,
          ...(isMobile && visibleReminders.length === 1 ? { justifyContent: "center" } : {}),
        }}
      >
        {visibleReminders.map(({ id, reminder }) => (
          <ReminderItem key={id} reminder={reminder} onDismiss={() => handleDismiss(id)} />
        ))}
      </CardTrack>

      <StyledArrow
        aria-label={t("dashboard:reminder.carousel_scroller.right_arrow_a11y")}
        size={isMobile ? "small" : "medium"}
        onClick={track.navProps.onNext}
        disabled={!track.canScrollRight}
      >
        <ChevronRightIcon />
      </StyledArrow>
    </StyledContainer>
  );
}
