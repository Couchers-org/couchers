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
import {
  DISCUSSIONS_EMPTY_STATE,
  DISCUSSIONS_TITLE,
  NEW_POST_LABEL,
  SEE_MORE_DISCUSSIONS_LABEL,
} from "features/communities/constants";
import { useListDiscussions } from "features/communities/hooks";
import { Community } from "proto/communities_pb";
import { useState } from "react";
import { useLocation } from "react-router-dom";
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
  const classes = {
    ...useCommunityPageStyles(),
    ...useDiscussionsListStyles(),
    ...useStyles(),
  };
  const hash = useLocation().hash;
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
        <SectionTitle icon={<EmailIcon />}>{DISCUSSIONS_TITLE}</SectionTitle>
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
            {NEW_POST_LABEL}
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
          <TextBody>{DISCUSSIONS_EMPTY_STATE}</TextBody>
        )}
        {discussionsHasNextPage && (
          <div className={classes.loadMoreButton}>
            <Button onClick={() => fetchNextPage()}>
              {SEE_MORE_DISCUSSIONS_LABEL}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
