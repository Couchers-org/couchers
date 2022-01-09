import { Breadcrumbs, makeStyles, Typography } from "@material-ui/core";
import { TabContext } from "@material-ui/lab";
import StyledLink from "components/StyledLink";
import TabBar from "components/TabBar";
import { useRouter } from "next/router";
import { Community } from "proto/communities_pb";
import { CommunityParent } from "proto/groups_pb";
import { CommunityTab, routeToCommunity } from "routes";

import { COMMUNITY_TABS_A11Y_LABEL, communityTabBarLabels } from "../constants";
import JoinCommunityButton from "./JoinCommunityButton";

export const useCommunitySubHeaderStyles = makeStyles((theme) => ({
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

export default function CommunityPageSubHeader({
  community,
  tab,
}: {
  community: Community.AsObject;
  tab: CommunityTab;
}) {
  const classes = useCommunitySubHeaderStyles();

  const router = useRouter();
  return (
    <>
      <div className={classes.breadcrumbsContainer}>
        <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumbs}>
          {community.parentsList
            .map((parent) => parent.community)
            .filter(
              (communityParent): communityParent is CommunityParent.AsObject =>
                !!communityParent
            )
            .map((communityParent, index, array) =>
              index === array.length - 1 ? (
                <Typography
                  variant="body1"
                  color="textPrimary"
                  key={`breadcrumb-${communityParent?.communityId}`}
                >
                  {communityParent.name}
                </Typography>
              ) : (
                <StyledLink
                  href={routeToCommunity(
                    communityParent.communityId,
                    communityParent.slug
                  )}
                  key={`breadcrumb-${communityParent?.communityId}`}
                >
                  {communityParent.name}
                </StyledLink>
              )
            )}
        </Breadcrumbs>
        <JoinCommunityButton community={community} />
      </div>
      <TabContext value={tab}>
        <TabBar
          ariaLabel={COMMUNITY_TABS_A11Y_LABEL}
          setValue={(newTab) =>
            router.push(
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
    </>
  );
}
