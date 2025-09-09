import { Typography, styled } from "@mui/material";

import HtmlMeta from "@/components/HtmlMeta";
import CommunityBase from "@/features/communities/CommunityBase";
import CommunityInfoPage from "@/features/communities/CommunityInfoPage";
import EditCommunityPage from "@/features/communities/EditCommunityInfoPage";
import PageHeader from "@/features/communities/PageHeader";
import {
  DiscussionsListPage,
  DiscussionsSection,
} from "@/features/communities/discussions";
import CommunityEventsList from "@/features/communities/events/CommunityEventsList";
import EventsSection from "@/features/communities/events/EventsSection";
import CommunityMembersList from "@/features/communities/members/CommunityMembersList";
import { useTranslation } from "@/i18n";
import { COMMUNITIES } from "@/i18n/namespaces";
import { CommunityTab } from "@/routes";
import { theme } from "@/theme";

import CommunityPageSubHeader from "./CommunityPageSubHeader";
import InfoPageSection from "./InfoPageSection";

const StyledTitle = styled(Typography)(() => ({
  marginTop: theme.spacing(3),
}));

const CommunityPage = ({
  communityId,
  tab = "overview",
  isEdit = false,
}: {
  communityId: number;
  tab: CommunityTab | undefined;
  isEdit: boolean | undefined;
}) => {
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
                {community.eventsEnabled && (
                  <EventsSection community={community} />
                )}
                {community.discussionsEnabled && (
                  <DiscussionsSection community={community} />
                )}
              </>
            ) : tab === "info" ? (
              isEdit ? (
                <EditCommunityPage communityId={community.communityId} />
              ) : (
                <CommunityInfoPage community={community} />
              )
            ) : tab === "discussions" ? (
              <DiscussionsListPage community={community} />
            ) : tab === "events" ? (
              <CommunityEventsList community={community} />
            ) : (
              <CommunityMembersList
                communityId={community.communityId}
                memberCount={community.memberCount}
              />
            )}
          </>
        );
      }}
    </CommunityBase>
  );
};

export default CommunityPage;
