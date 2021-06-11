import { CircularProgress } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  AccessibleDialogProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import UserSummary from "components/UserSummary";
import { Community } from "proto/communities_pb";

import { COMMUNITY_MODERATORS, LOAD_MORE_MODERATORS } from "./constants";
import { useListAdmins } from "./hooks";

interface CommunityModeratorsDialogProps {
  community: Community.AsObject;
  onClose: AccessibleDialogProps["onClose"];
  open?: boolean;
}

export const DIALOG_LABEL_ID = "moderator-title";

export default function CommunityModeratorsDialog({
  community,
  onClose,
  open = false,
}: CommunityModeratorsDialogProps) {
  const {
    adminIds,
    adminUsers,
    error,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    hasNextPage,
  } = useListAdmins(community.communityId, "all");

  return (
    <Dialog aria-labelledby={DIALOG_LABEL_ID} open={open} onClose={onClose}>
      <DialogTitle id={DIALOG_LABEL_ID}>{COMMUNITY_MODERATORS}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error.message}</Alert>}
        {isLoading ? (
          <CircularProgress />
        ) : adminIds && adminIds.length > 0 && adminUsers ? (
          adminIds.map((id) => (
            <UserSummary
              avatarIsLink
              nameOnly
              smallAvatar
              key={id}
              headlineComponent="h3"
              user={adminUsers.get(id)}
            />
          ))
        ) : null}
      </DialogContent>
      {hasNextPage && (
        <DialogActions>
          <Button loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {LOAD_MORE_MODERATORS}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
