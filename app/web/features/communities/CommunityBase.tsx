import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import { useCommunity } from "features/communities/hooks";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import React from "react";
import makeStyles from "utils/makeStyles";

export const useCommunityBaseStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
    "& > section": {
      margin: theme.spacing(3, 0),
    },
  },
  center: {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },
}));

interface CommunityBaseProps {
  children(communityParams: { community: Community.AsObject }): React.ReactNode;
  communityId: number;
}

export default function CommunityBase({
  children,
  communityId,
}: CommunityBaseProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const classes = useCommunityBaseStyles();

  const {
    isLoading: isCommunityLoading,
    error: communityError,
    data: community,
  } = useCommunity(communityId);

  if (!communityId)
    return (
      <Alert severity="error">{t("communities:invalid_community_id")}</Alert>
    );

  if (isCommunityLoading)
    return <CircularProgress className={classes.center} />;

  if (!community || communityError)
    return (
      <Alert severity="error">
        {communityError?.message || t("communities:error_loading_community")}
      </Alert>
    );

  return <div className={classes.root}>{children({ community })}</div>;
}
