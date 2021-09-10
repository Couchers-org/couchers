import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  ERROR_LOADING_COMMUNITY,
  INVALID_COMMUNITY_ID,
} from "features/communities/constants";
import { useCommunity } from "features/communities/hooks";
import { Community } from "proto/communities_pb";
import React from "react";
import { useParams } from "react-router-dom";
import { CommunityTab } from "routes";
import makeStyles from "utils/makeStyles";

import CommunityPageSubHeader from "./CommunityPage/CommunityPageSubHeader";
import PageHeader from "./PageHeader";

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
  children(communityParams: {
    community: Community.AsObject;
    communitySlug?: string;
  }): React.ReactNode;
  communityId?: number;
  defaultTab?: CommunityTab;
}

export default function CommunityBase({
  children,
  communityId,
  defaultTab,
}: CommunityBaseProps) {
  const classes = useCommunityBaseStyles();

  const { communityId: communityIdFromUrl, communitySlug } = useParams<{
    communityId: string;
    communitySlug?: string;
  }>();

  const {
    isLoading: isCommunityLoading,
    error: communityError,
    data: community,
  } = useCommunity(communityId ?? +communityIdFromUrl);

  if (!communityId && !communityIdFromUrl)
    return <Alert severity="error">{INVALID_COMMUNITY_ID}</Alert>;

  if (isCommunityLoading)
    return <CircularProgress className={classes.center} />;

  if (!community || communityError)
    return (
      <Alert severity="error">
        {communityError?.message || ERROR_LOADING_COMMUNITY}
      </Alert>
    );

  return (
    <div className={classes.root}>
      {community.mainPage && <PageHeader page={community.mainPage} />}
      <CommunityPageSubHeader community={community} defaultTab={defaultTab} />
      {children({ community, communitySlug })}
    </div>
  );
}
