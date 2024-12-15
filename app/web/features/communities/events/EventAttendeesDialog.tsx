import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import UsersList from "components/UsersList";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";

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
  const { t } = useTranslation([COMMUNITIES]);
  const {
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    attendeesIds,
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
        <UsersList error={error} userIds={attendeesIds} />
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
