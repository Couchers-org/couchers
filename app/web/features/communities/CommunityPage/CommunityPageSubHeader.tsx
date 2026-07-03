import { TabContext } from "@mui/lab";
import { Breadcrumbs, styled, Typography } from "@mui/material";
import BetaFlag from "components/BetaFlag";
import StyledLink from "components/StyledLink";
import TabBar from "components/TabBar";
import { useListSubCommunities } from "features/communities/hooks";
import { useTranslation } from "i18n";
import { COMMUNITIES, PUBLIC_TRIPS } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Community } from "proto/communities_pb";
import { CommunityParent } from "proto/groups_pb";
import { ReactNode, useEffect } from "react";
import { CommunityTab, routeToCommunity } from "routes";

import JoinCommunityButton from "./JoinCommunityButton";
import SubCommunitiesDropdown from "./SubCommunitiesDropdown";

const StyledBreadcrumbsContainer = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const StyledBreadcrumbs = styled(Breadcrumbs)(() => ({
  "& ol": {
    justifyContent: "flex-start",
  },
}));

export default function CommunityPageSubHeader({
  community,
  tab,
}: {
  community: Community.AsObject;
  tab: CommunityTab;
}) {
  const { t } = useTranslation([COMMUNITIES, PUBLIC_TRIPS]);
  const isPublicTripsEnabled = process.env.NODE_ENV !== "production";

  const router = useRouter();

  // MUI's Breadcrumbs inserts a separator per child element regardless of what that child
  // renders to, so a leaf `SubCommunitiesDropdown` (which itself returns null) would still leave
  // a dangling separator. Read the same (cached, deduped) query here to omit the element
  // entirely when there's nothing to drill into.
  const {
    data: subCommunitiesData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useListSubCommunities(community.communityId);
  // Fetch every page so the dropdown's client-side search sees all children, not just page one.
  // Child counts are bounded (tens), so this is cheap.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const subCommunities =
    subCommunitiesData?.pages.flatMap((page) => page.communitiesList) ?? [];
  const communityTabBarLabels: Partial<
    Record<CommunityTab, string | ReactNode>
  > = {
    overview: t("communities:overview_label"),
    info: t("communities:local_info_label"),
    ...(community.smallCommunityFeaturesEnabled && {
      ...(isPublicTripsEnabled && {
        "public-trips": (
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            {t("publicTrips:label")}
            <BetaFlag />
          </span>
        ),
      }),
      discussions: t("communities:discussions_label"),
      events: t("communities:events_label"),
    }),
    members: t("communities:members_label"),
  };

  return (
    <>
      <StyledBreadcrumbsContainer>
        <StyledBreadcrumbs
          aria-label={t("communities:community_breadcrumb_a11y")}
        >
          {community.parentsList
            .map((parent) => parent.community)
            .filter(
              (communityParent): communityParent is CommunityParent.AsObject =>
                !!communityParent,
            )
            .map((communityParent, index, array) =>
              index === array.length - 1 ? (
                <Typography
                  variant="body1"
                  color="var(--mui-palette-text-primary)"
                  key={`breadcrumb-${communityParent?.communityId}`}
                >
                  {communityParent.name}
                </Typography>
              ) : (
                <StyledLink
                  href={routeToCommunity(
                    communityParent.communityId,
                    communityParent.slug,
                  )}
                  key={`breadcrumb-${communityParent?.communityId}`}
                >
                  {communityParent.name}
                </StyledLink>
              ),
            )}
          {subCommunities.length > 0 && (
            <SubCommunitiesDropdown subCommunities={subCommunities} />
          )}
        </StyledBreadcrumbs>
        <JoinCommunityButton community={community} />
      </StyledBreadcrumbsContainer>
      <TabContext value={tab}>
        <TabBar
          ariaLabel={t("communities:community_tabs_a11y_label")}
          setValue={(newTab) =>
            router.push(
              `${routeToCommunity(
                community.communityId,
                community.slug,
                newTab === "overview" ? undefined : newTab,
              )}`,
            )
          }
          labels={communityTabBarLabels}
        />
      </TabContext>
    </>
  );
}
