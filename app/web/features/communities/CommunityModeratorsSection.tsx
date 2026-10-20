import { styled, Typography } from "@mui/material";
import Button from "components/Button";
import { CommunityLeadersIcon } from "components/Icons";
import UsersList from "components/UsersList";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { useState } from "react";
import { theme } from "theme";

import CommunityModeratorsDialog from "./CommunityModeratorsDialog";
import { SectionTitle } from "./CommunityPage";
import { useListAdmins } from "./hooks";

const StyledSection = styled("section")(() => ({
  display: "grid",
  rowGap: theme.spacing(2),
}));

const StyledLoadMoreModeratorsButton = styled(Button)(() => ({
  justifySelf: "center",
}));

interface CommunityModeratorsSectionProps {
  community: Community.AsObject;
}

export default function CommunityModeratorsSection({ community }: CommunityModeratorsSectionProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const { adminIds, error, hasNextPage } = useListAdmins(community.communityId, "summary");
  const [isModeratorsDialogOpen, setIsModeratorsDialogOpen] = useState(false);

  return (
    <StyledSection>
      <SectionTitle icon={<CommunityLeadersIcon />} variant="h2">
        {t("communities:community_moderators")}
      </SectionTitle>
      <UsersList
        error={error}
        userIds={adminIds}
        emptyListChildren={<Typography variant="body1">{t("communities:no_moderators")}</Typography>}
      />
      {hasNextPage && (
        <>
          <StyledLoadMoreModeratorsButton onClick={() => setIsModeratorsDialogOpen(true)}>
            {t("communities:see_all_moderators")}
          </StyledLoadMoreModeratorsButton>
          <CommunityModeratorsDialog
            community={community}
            onClose={() => setIsModeratorsDialogOpen(false)}
            open={isModeratorsDialogOpen}
          />
        </>
      )}
    </StyledSection>
  );
}
