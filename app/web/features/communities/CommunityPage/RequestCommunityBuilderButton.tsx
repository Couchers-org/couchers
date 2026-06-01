import Button from "components/Button";
import Snackbar from "components/Snackbar";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { useState } from "react";

import RequestCommunityBuilderDialog from "./RequestCommunityBuilderDialog";

export default function RequestCommunityBuilderButton({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (community.admin) return null;

  return (
    <>
      <Button variant="outlined" onClick={() => setDialogOpen(true)}>
        {t("communities:request_community_builder_button")}
      </Button>
      <RequestCommunityBuilderDialog
        communityId={community.communityId}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        afterSuccess={() => setShowSuccess(true)}
      />
      {showSuccess && (
        <Snackbar severity="success">
          {t("communities:request_community_builder_dialog.toast_success")}
        </Snackbar>
      )}
    </>
  );
}
