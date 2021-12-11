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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(["communities"]);
  const {
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isOrganizersRefetching,
    organizerIds,
    organizers,
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
        {isLoading ? (
          <CircularProgress />
        ) : (
          !!organizerIds.length &&
          organizers &&
          organizerIds.map((id) => {
            const user = organizers.get(id);

            return user || isOrganizersRefetching ? (
              <UserSummary
                headlineComponent="h3"
                key={id}
                nameOnly
                smallAvatar
                user={user}
              />
            ) : null;
          })
        )}
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
