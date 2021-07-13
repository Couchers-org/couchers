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

import { LOAD_MORE_ORGANISERS, ORGANISERS } from "./constants";
import { useEventOrganisers } from "./hooks";

export const ORGANISERS_DIALOG_LABEL_ID = "organisers";

interface EventOrganisersDialogProps {
  eventId: number;
  open: boolean;
  onClose(): void;
}

export default function EventOrganisersDialog({
  eventId,
  onClose,
  open,
}: EventOrganisersDialogProps) {
  const {
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isOrganisersRefetching,
    organiserIds,
    organisers,
  } = useEventOrganisers({
    eventId,
    type: "all",
  });

  return (
    <Dialog
      aria-labelledby={ORGANISERS_DIALOG_LABEL_ID}
      open={open}
      onClose={onClose}
    >
      <DialogTitle id={ORGANISERS_DIALOG_LABEL_ID}>{ORGANISERS}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error.message}</Alert>}
        {isLoading ? (
          <CircularProgress />
        ) : (
          !!organiserIds.length &&
          organisers &&
          organiserIds.map((id) => {
            const user = organisers.get(id);

            return user || isOrganisersRefetching ? (
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
            {LOAD_MORE_ORGANISERS}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
