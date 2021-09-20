import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  ERROR_LOADING_COMMUNITY,
  INVALID_COMMUNITY_ID,
} from "features/communities/constants";
import { useCommunity } from "features/communities/hooks";
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
  communityId?: number;
}

export default function CommunityBase({
  children,
  communityId,
}: CommunityBaseProps) {
  const classes = useCommunityBaseStyles();

  const {
    isLoading: isCommunityLoading,
    error: communityError,
    data: community,
    queryCommunityId,
  } = useCommunity(communityId);

  if (!queryCommunityId)
    return <Alert severity="error">{INVALID_COMMUNITY_ID}</Alert>;

  if (isCommunityLoading)
    return <CircularProgress className={classes.center} />;

  if (!community || communityError)
    return (
      <Alert severity="error">
        {communityError?.message || ERROR_LOADING_COMMUNITY}
      </Alert>
    );

  return <div className={classes.root}>{children({ community })}</div>;
}
