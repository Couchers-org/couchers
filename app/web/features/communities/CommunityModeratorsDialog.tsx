import Button from "components/Button";
import {
  AccessibleDialogProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import UsersList from "components/UsersList";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";

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
  const { t } = useTranslation([COMMUNITIES]);
  const { adminIds, error, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useListAdmins(community.communityId, "all");

  return (
    <Dialog aria-labelledby={DIALOG_LABEL_ID} open={open} onClose={onClose}>
      <DialogTitle id={DIALOG_LABEL_ID}>
        {t("communities:community_moderators")}
      </DialogTitle>
      <DialogContent>
        <UsersList userIds={adminIds} error={error} />
      </DialogContent>
      {hasNextPage && (
        <DialogActions>
          <Button loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {t("communities:load_more_moderators")}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
