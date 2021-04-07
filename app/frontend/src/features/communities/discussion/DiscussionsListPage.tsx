import { Collapse, makeStyles } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import { EmailIcon } from "components/Icons";
import TextBody from "components/TextBody";
import {
  DiscussionCard,
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
import { Community } from "pb/communities_pb";
import { useState } from "react";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import CreateDiscussionForm from "./CreateDiscussionForm";

const useStyles = makeStyles((theme) => ({
  discussionsContainer: {
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
  },
  discussionsHeader: {
    alignItems: "center",
    display: "flex",
  },
  newPostButton: {
    marginBlockStart: theme.spacing(3),
    marginBlockEnd: theme.spacing(3),
  },
}));

export default function DiscussionsListPage({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = { ...useCommunityPageStyles(), ...useStyles() };

  //temporary
  const [isCreatingNewPost, setIsCreatingNewPost] = useState(false);

  const {
    isLoading: isDiscussionsLoading,
    error: discussionsError,
    data: discussions,
    hasNextPage: discussionsHasNextPage,
    fetchNextPage,
  } = useListDiscussions(community.communityId);

  return (
    <>
      <div className={classes.discussionsHeader}>
        <SectionTitle icon={<EmailIcon />}>{DISCUSSIONS_TITLE}</SectionTitle>
      </div>
      <Button
        className={classes.newPostButton}
        onClick={() => setIsCreatingNewPost(true)}
      >
        {NEW_POST_LABEL}
      </Button>
      {discussionsError && (
        <Alert severity="error">{discussionsError.message}</Alert>
      )}
      <Collapse in={isCreatingNewPost}>
        <CreateDiscussionForm
          communityId={community.communityId}
          onCancel={() => setIsCreatingNewPost(false)}
        />
      </Collapse>
      <div className={classes.discussionsContainer}>
        {isDiscussionsLoading && <CircularProgress />}
        {hasAtLeastOnePage(discussions, "discussionsList") ? (
          discussions.pages
            .flatMap((res) => res.discussionsList)
            .map((discussion) => (
              <DiscussionCard
                discussion={discussion}
                key={`discussioncard-${discussion.threadId}`}
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
