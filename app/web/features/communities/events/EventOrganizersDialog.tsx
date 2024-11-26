import Alert from "components/Alert";
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

import { useEventOrganizers } from "./hooks";

export const ORGANIZERS_DIALOG_LABEL_ID = "organizers";

interface EventOrganizersDialogProps {
  eventId: number;
  open: boolean;
  onClose(): void;
}

export default function EventOrganizersDialog({
  eventId,
  onClose,
  open,
}: EventOrganizersDialogProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const {
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    organizerIds,
  } = useEventOrganizers({
    enabled: open,
    eventId,
    type: "all",
  });

  return (
    <Dialog
      aria-labelledby={ORGANIZERS_DIALOG_LABEL_ID}
      open={open}
      onClose={onClose}
    >
      <DialogTitle id={ORGANIZERS_DIALOG_LABEL_ID}>
        {t("communities:organizers")}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error.message}</Alert>}
        <UsersList userIds={organizerIds} />
      </DialogContent>
      {hasNextPage && (
        <DialogActions>
          <Button loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {t("communities:load_more_organizers")}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
