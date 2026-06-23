import { Collapse, styled } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { EmailIcon } from "components/Icons";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import TextBody from "components/TextBody";
import useAccountInfo from "features/auth/useAccountInfo";
import { SectionTitle } from "features/communities/CommunityPage";
import { useListDiscussions } from "features/communities/hooks";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { useEffect, useState } from "react";
import { theme } from "theme";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import CreateDiscussionForm from "./CreateDiscussionForm";
import DiscussionCard from "./DiscussionCard";

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

const StyledLoadMoreButton = styled("div")(() => ({
  alignSelf: "center",
  display: "flex",
  justifyContent: "center",
  width: "100%",
}));

const StyledCreateResourceButton = styled(Button)(() => ({
  margin: theme.spacing(2, 0),
}));

const StyledNewPostButtonContainer = styled("div")(() => ({
  "& > * + *": {
    marginInlineStart: theme.spacing(2),
  },
  display: "flex",
  alignItems: "center",
  minHeight: theme.typography.pxToRem(40),
}));

export default function DiscussionsListPage({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([COMMUNITIES]);

  const { data: accountInfo } = useAccountInfo();
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const [isCreatingNewPost, setIsCreatingNewPost] = useState(
    hash.includes("new"),
  );
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // If #new hash auto-opened the form but profile is incomplete, show dialog instead
  useEffect(() => {
    if (accountInfo && !accountInfo.profileComplete && isCreatingNewPost) {
      setIsCreatingNewPost(false);
      setProfileDialogOpen(true);
    }
  }, [accountInfo, isCreatingNewPost]);

  const handleNewPostClick = () => {
    if (accountInfo !== undefined && !accountInfo.profileComplete) {
      setProfileDialogOpen(true);
    } else {
      setIsCreatingNewPost(true);
    }
  };

  const {
    isLoading: isDiscussionsLoading,
    isFetching: isDiscussionsFetching,
    error: discussionsError,
    data: discussions,
    hasNextPage: discussionsHasNextPage,
    fetchNextPage,
  } = useListDiscussions(community.communityId);

  // loading is false when refetched since there's old data in cache already
  const isRefetching = !isDiscussionsLoading && isDiscussionsFetching;

  return (
    <>
      <ProfileIncompleteDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        attempted_action="create_discussion"
      />
      <StyledDiscussionsHeader>
        <SectionTitle icon={<EmailIcon />}>
          {t("communities:discussions_title")}
        </SectionTitle>
      </StyledDiscussionsHeader>
      {discussionsError && (
        <Alert severity="error">{discussionsError.message}</Alert>
      )}
      <Collapse in={!isCreatingNewPost}>
        <StyledNewPostButtonContainer>
          <StyledCreateResourceButton onClick={handleNewPostClick}>
            {t("communities:new_post_label")}
          </StyledCreateResourceButton>
          {isRefetching && <CenteredSpinner />}
        </StyledNewPostButtonContainer>
      </Collapse>
      <Collapse in={isCreatingNewPost}>
        <CreateDiscussionForm
          communityId={community.communityId}
          onCancel={() => setIsCreatingNewPost(false)}
          onPostSuccess={() => setIsCreatingNewPost(false)}
        />
      </Collapse>
      <StyledDiscussionsContainer>
        {isDiscussionsLoading ? (
          <CenteredSpinner />
        ) : hasAtLeastOnePage(discussions, "discussionsList") ? (
          discussions.pages
            .flatMap((res) => res.discussionsList)
            .map((discussion) => (
              <DiscussionCard
                discussion={discussion}
                key={`discussioncard-${discussion.thread!.threadId}`}
              />
            ))
        ) : (
          <TextBody>{t("communities:discussions_empty_state")}</TextBody>
        )}
        {discussionsHasNextPage && (
          <StyledLoadMoreButton>
            <Button onClick={() => fetchNextPage()}>
              {t("communities:see_more_discussions_label")}
            </Button>
          </StyledLoadMoreButton>
        )}
      </StyledDiscussionsContainer>
    </>
  );
}
