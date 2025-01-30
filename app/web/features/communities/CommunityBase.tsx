import { styled } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { useCommunity } from "features/communities/hooks";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import React from "react";

interface CommunityBaseProps {
  children(communityParams: { community: Community.AsObject }): React.ReactNode;
  communityId: number;
}

const StyledWrapper = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& > section": {
    margin: theme.spacing(3, 0),
  },
}));

export default function CommunityBase({
  children,
  communityId,
}: CommunityBaseProps) {
  const { t } = useTranslation([COMMUNITIES]);

  const {
    isLoading: isCommunityLoading,
    error: communityError,
    data: community,
  } = useCommunity(communityId);

  if (!communityId)
    return (
      <Alert severity="error">{t("communities:invalid_community_id")}</Alert>
    );

  if (isCommunityLoading) return <CenteredSpinner />;

  if (!community || communityError)
    return (
      <Alert severity="error">
        {communityError?.message || t("communities:error_loading_community")}
      </Alert>
    );

  return <StyledWrapper>{children({ community })}</StyledWrapper>;
}
