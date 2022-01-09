import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import UserSummary from "components/UserSummary";
import { useTranslation } from "next-i18next";

import { useEventAttendees } from "./hooks";

export const ATTENDEES_DIALOG_LABEL_ID = "attendees";

interface EventAttendeesDialogProps {
  eventId: number;
  open: boolean;
  onClose(): void;
}

export default function EventAttendeesDialog({
  eventId,
  onClose,
  open,
}: EventAttendeesDialogProps) {
  const { t } = useTranslation(["communities"]);
  const {
    error,
    fetchNextPage,
    hasNextPage,
    isAttendeesRefetching,
    isFetchingNextPage,
    isLoading,
    attendeesIds,
    attendees,
  } = useEventAttendees({
    enabled: open,
    eventId,
    type: "all",
  });

  return (
    <Dialog
      aria-labelledby={ATTENDEES_DIALOG_LABEL_ID}
      open={open}
      onClose={onClose}
    >
      <DialogTitle id={ATTENDEES_DIALOG_LABEL_ID}>
        {t("communities:attendees")}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error.message}</Alert>}
        {isLoading ? (
          <CircularProgress />
        ) : !!attendeesIds.length && attendees ? (
          attendeesIds.map((id) => {
            const user = attendees.get(id);

            return user || isAttendeesRefetching ? (
              <UserSummary
                headlineComponent="h3"
                key={id}
                nameOnly
                smallAvatar
                user={user}
              />
            ) : null;
          })
        ) : null}
      </DialogContent>
      {hasNextPage && (
        <DialogActions>
          <Button loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {t("communities:load_more_attendees")}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
