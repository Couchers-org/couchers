import { Community } from "@couchers/services/communities";
import { Link as MuiLink, styled } from "@mui/material";
import Link from "next/link";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import { EmailIcon } from "@/components/Icons";
import TextBody from "@/components/TextBody";
import { SectionTitle } from "@/features/communities/CommunityPage";
import { useListDiscussions } from "@/features/communities/hooks";
import { useTranslation } from "@/i18n";
import { COMMUNITIES } from "@/i18n/namespaces";
import { COMPOSING_DISCUSSION_HASH, routeToCommunity } from "@/routes";
import { theme } from "@/theme";
import hasAtLeastOnePage from "@/utils/hasAtLeastOnePage";

import DiscussionCard from "./DiscussionCard";

const StyledLoadMoreButton = styled("div")(() => ({
  alignSelf: "center",
  display: "flex",
  justifyContent: "center",
  width: "100%",
}));

const StyledCreateResourceButton = styled(Button)(() => ({
  margin: theme.spacing(2, 0),
}));

const StyledDiscussionsHeader = styled("div")(() => ({
  alignItems: "center",
  display: "flex",
}));

const StyledDiscussionsContainer = styled("div")(() => ({
  "& > *": {
    width: "100%",
  },
  "& > :not(:last-child)": {
    marginBlockEnd: theme.spacing(3),
  },
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  paddingBlockEnd: theme.spacing(5),
}));

const DiscussionsSection = ({
  community,
}: {
  community: Community.AsObject;
}) => {
  const { t } = useTranslation([COMMUNITIES]);

  const {
    isLoading: isDiscussionsLoading,
    error: discussionsError,
    data: discussions,
    hasNextPage: hasDiscussionsNextPage,
  } = useListDiscussions(community.communityId);

  return (
    <section>
      <StyledDiscussionsHeader>
        <SectionTitle icon={<EmailIcon />} variant="h2">
          {t("communities:discussions_title")}
        </SectionTitle>
      </StyledDiscussionsHeader>
      {discussionsError && (
        <Alert severity="error">{discussionsError.message}</Alert>
      )}

      <StyledCreateResourceButton
        size="small"
        component="a"
        href={`${routeToCommunity(
          community.communityId,
          community.slug,
          "discussions",
        )}#${COMPOSING_DISCUSSION_HASH}`}
      >
        {t("communities:new_post_label")}
      </StyledCreateResourceButton>
      <StyledDiscussionsContainer>
        {isDiscussionsLoading ? (
          <CenteredSpinner />
        ) : hasAtLeastOnePage(discussions, "discussionsList") ? (
          discussions.pages
            .flatMap((res) => res.discussionsList)
            .map((discussion) => (
              <DiscussionCard
                discussion={discussion}
                key={`discussioncard-${discussion.thread?.threadId || 0}`}
              />
            ))
        ) : (
          <TextBody>{t("communities:discussions_empty_state")}</TextBody>
        )}
        {hasDiscussionsNextPage && (
          <StyledLoadMoreButton>
            <MuiLink
              component={Link}
              underline="hover"
              href={routeToCommunity(
                community.communityId,
                community.slug,
                "discussions",
              )}
            >
              {t("communities:see_more_discussions_label")}
            </MuiLink>
          </StyledLoadMoreButton>
        )}
      </StyledDiscussionsContainer>
    </section>
  );
};

export default DiscussionsSection;
