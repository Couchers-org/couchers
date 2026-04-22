import { styled, Typography } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import EditCommunityPage from "features/communities/EditCommunityInfoPage";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { CommunityTab } from "routes";
import { theme } from "theme";

import CommunityBase from "../CommunityBase";
import CommunityInfoPage from "../CommunityInfoPage";
import { DiscussionsListPage, DiscussionsSection } from "../discussions";
import CommunityEventsList from "../events/CommunityEventsList";
import EventsSection from "../events/EventsSection";
import CommunityMembersList from "../members/CommunityMembersList";
import PageHeader from "../PageHeader";
import CommunityPageSubHeader from "./CommunityPageSubHeader";
import InfoPageSection from "./InfoPageSection";

const StyledTitle = styled(Typography)(() => ({
  marginTop: theme.spacing(3),
}));

export default function CommunityPage({
  communityId,
  tab = "overview",
  edit = false,
}: {
  communityId: number;
  tab: CommunityTab | undefined;
  edit: boolean | undefined;
}) {
  const { t } = useTranslation([COMMUNITIES]);

  return (
    <CommunityBase communityId={communityId}>
      {({ community }) => {
        return (
          <>
            <HtmlMeta title={community.name} />
            {community.mainPage && <PageHeader page={community.mainPage} />}
            <CommunityPageSubHeader community={community} tab={tab} />

            {tab === "overview" ? (
              <>
                <StyledTitle variant="h1">
                  {t("communities:community_header", { name: community.name })}
                </StyledTitle>
                <InfoPageSection community={community} />
                {community.smallCommunityFeaturesEnabled && (
                  <>
                    <EventsSection community={community} />
                    <DiscussionsSection community={community} />
                  </>
                )}
              </>
            ) : tab === "info" ? (
              edit ? (
                <EditCommunityPage communityId={community.communityId} />
              ) : (
                <CommunityInfoPage community={community} />
              )
            ) : tab === "discussions" ? (
              <DiscussionsListPage community={community} />
            ) : tab === "events" ? (
              <CommunityEventsList community={community} />
            ) : tab === "members" ? (
              <CommunityMembersList
                communityId={community.communityId}
                memberCount={community.memberCount}
              />
            ) : null}
          </>
        );
      }}
    </CommunityBase>
  );
}
