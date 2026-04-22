import { TabContext } from "@mui/lab";
import { Breadcrumbs, styled, Typography } from "@mui/material";
import BetaFlag from "components/BetaFlag";
import StyledLink from "components/StyledLink";
import TabBar from "components/TabBar";
import { useTranslation } from "i18n";
import { COMMUNITIES, PUBLIC_TRIPS } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Community } from "proto/communities_pb";
import { CommunityParent } from "proto/groups_pb";
import { ReactNode } from "react";
import { CommunityTab, routeToCommunity } from "routes";

import JoinCommunityButton from "./JoinCommunityButton";

const isPublicTripsEnabled = process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod";

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

  const router = useRouter();
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
        <StyledBreadcrumbs aria-label="breadcrumb">
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
