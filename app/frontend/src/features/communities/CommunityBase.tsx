import { Breadcrumbs, Link as MuiLink } from "@material-ui/core";
import { TabContext } from "@material-ui/lab";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import TabBar from "components/TabBar";
import JoinCommunityButton from "features/communities/CommunityPage/JoinCommunityButton";
import {
  COMMUNITY_TABS_A11Y_LABEL,
  communityTabBarLabels,
  ERROR_LOADING_COMMUNITY,
  INVALID_COMMUNITY_ID,
} from "features/communities/constants";
import { useCommunity } from "features/communities/hooks";
import { Community } from "proto/communities_pb";
import { CommunityParent } from "proto/groups_pb";
import React from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { CommunityTab, routeToCommunity } from "routes";
import makeStyles from "utils/makeStyles";

import HeaderImage from "./CommunityPage/HeaderImage";

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
  header: {
    marginBottom: theme.spacing(1),
  },
  breadcrumbsContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breadcrumbs: {
    "& ol": {
      justifyContent: "flex-start",
    },
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

  const { communityId: communityIdFromUrl, communitySlug } =
    useParams<{
      communityId: string;
      communitySlug?: string;
    }>();

  const {
    isLoading: isCommunityLoading,
    error: communityError,
    data: community,
  } = useCommunity(communityId ?? +communityIdFromUrl);

  const history = useHistory();

  const { page = "overview" } = useParams<{ page: string }>();

  // Use default tab from prop, otherwise derived state from community URL
  const tab =
    defaultTab ??
    (page in communityTabBarLabels ? (page as CommunityTab) : "overview");

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
      <HeaderImage community={community} className={classes.header} />
      <div className={classes.breadcrumbsContainer}>
        <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumbs}>
          {community.parentsList
            .map((parent) => parent.community)
            .filter(
              (communityParent): communityParent is CommunityParent.AsObject =>
                !!communityParent
            )
            .map((communityParent) => (
              <MuiLink
                component={Link}
                to={routeToCommunity(
                  communityParent.communityId,
                  communityParent.slug
                )}
                key={`breadcrumb-${communityParent?.communityId}`}
              >
                {communityParent.name}
              </MuiLink>
            ))}
        </Breadcrumbs>
        <JoinCommunityButton community={community} />
      </div>
      <TabContext value={tab}>
        <TabBar
          ariaLabel={COMMUNITY_TABS_A11Y_LABEL}
          setValue={(newTab) =>
            history.push(
              `${routeToCommunity(
                community.communityId,
                community.slug,
                newTab === "overview" ? undefined : newTab
              )}`
            )
          }
          labels={communityTabBarLabels}
        />
      </TabContext>
      {children({ community, communitySlug })}
    </div>
  );
}
