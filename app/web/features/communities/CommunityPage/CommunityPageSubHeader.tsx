import { Community } from "@couchers/services/communities";
import { CommunityParent } from "@couchers/services/groups";
import { TabContext } from "@mui/lab";
import { Breadcrumbs, Typography, styled } from "@mui/material";
import { useRouter } from "next/router";

import StyledLink from "@/components/StyledLink";
import TabBar from "@/components/TabBar";
import { useTranslation } from "@/i18n";
import { COMMUNITIES } from "@/i18n/namespaces";
import { CommunityTab, routeToCommunity } from "@/routes";

import JoinCommunityButton from "./JoinCommunityButton";

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

const CommunityPageSubHeader = ({
  community,
  tab,
}: {
  community: Community.AsObject;
  tab: CommunityTab;
}) => {
  const { t } = useTranslation([COMMUNITIES]);

  const router = useRouter();
  const communityTabBarLabels: Partial<Record<CommunityTab, string>> = {
    overview: t("communities:overview_label"),
    info: t("communities:local_info_label"),
    ...(community.discussionsEnabled && {
      discussions: t("communities:discussions_label"),
    }),
    ...(community.eventsEnabled && { events: t("communities:events_label") }),
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
                  color="textPrimary"
                  key={`breadcrumb-${communityParent.communityId}`}
                >
                  {communityParent.name}
                </Typography>
              ) : (
                <StyledLink
                  href={routeToCommunity(
                    communityParent.communityId,
                    communityParent.slug,
                  )}
                  key={`breadcrumb-${communityParent.communityId}`}
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
            void router.push(
              routeToCommunity(
                community.communityId,
                community.slug,
                newTab === "overview" ? undefined : newTab,
              ),
            )
          }
          labels={communityTabBarLabels}
        />
      </TabContext>
    </>
  );
};

export default CommunityPageSubHeader;
