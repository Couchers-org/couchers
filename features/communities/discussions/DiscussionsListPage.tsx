import { Collapse, makeStyles } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import { EmailIcon } from "components/Icons";
import TextBody from "components/TextBody";
import {
  SectionTitle,
  useCommunityPageStyles,
} from "features/communities/CommunityPage";
import { useListDiscussions } from "features/communities/hooks";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { useState } from "react";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import CreateDiscussionForm from "./CreateDiscussionForm";
import DiscussionCard from "./DiscussionCard";
import useDiscussionsListStyles from "./useDiscussionsListStyles";

const useStyles = makeStyles((theme) => ({
  newPostButtonContainer: {
    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },
    display: "flex",
    alignItems: "center",
    minHeight: theme.typography.pxToRem(40),
  },
}));

export default function DiscussionsListPage({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const classes = {
    ...useCommunityPageStyles(),
    ...useDiscussionsListStyles(),
    ...useStyles(),
  };
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const [isCreatingNewPost, setIsCreatingNewPost] = useState(
    hash.includes("new")
  );
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
      <div className={classes.discussionsHeader}>
        <SectionTitle icon={<EmailIcon />}>
          {t("communities:discussions_title")}
        </SectionTitle>
      </div>
      {discussionsError && (
        <Alert severity="error">{discussionsError.message}</Alert>
      )}
      <Collapse in={!isCreatingNewPost}>
        <div className={classes.newPostButtonContainer}>
          <Button
            className={classes.createResourceButton}
            onClick={() => setIsCreatingNewPost(true)}
          >
            {t("communities:new_post_label")}
          </Button>
          {isRefetching && <CircularProgress />}
        </div>
      </Collapse>
      <Collapse in={isCreatingNewPost}>
        <CreateDiscussionForm
          communityId={community.communityId}
          onCancel={() => setIsCreatingNewPost(false)}
          onPostSuccess={() => setIsCreatingNewPost(false)}
        />
      </Collapse>
      <div className={classes.discussionsContainer}>
        {isDiscussionsLoading ? (
          <CircularProgress />
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
          <div className={classes.loadMoreButton}>
            <Button onClick={() => fetchNextPage()}>
              {t("communities:see_more_discussions_label")}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
