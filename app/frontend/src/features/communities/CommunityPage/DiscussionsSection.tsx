import { Dialog, DialogContent, makeStyles } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import NewComment from "components/Comments/NewComment";
import IconButton from "components/IconButton";
import { AddIcon, EmailIcon, MoreIcon } from "components/Icons";
import TextBody from "components/TextBody";
import {
  useListDiscussions,
  useNewDiscussionMutation,
} from "features/communities/useCommunity";
import {
  DISCUSSIONS_EMPTY_STATE,
  DISCUSSIONS_TITLE,
  NEW_POST_LABEL,
  SEE_MORE_DISCUSSIONS_LABEL,
} from "features/constants";
import { Community } from "pb/communities_pb";
import React, { useState } from "react";
import { useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { routeToCommunityDiscussions } from "routes";

import { useCommunityPageStyles } from "./CommunityPage";
import DiscussionCard from "./DiscussionCard";
import SectionTitle from "./SectionTitle";

const useStyles = makeStyles((theme) => ({
  discussionCard: {
    marginBottom: theme.spacing(1),
  },
  discussionsContainer: {
    "& > *": {
      [theme.breakpoints.up("sm")]: {
        width: `calc(50% - ${theme.spacing(1)})`,
      },
      [theme.breakpoints.up("md")]: {
        width: `calc(33.33% - ${theme.spacing(1)})`,
      },
      width: "100%",
    },
    //preserve grid in the last row
    "&::after": {
      [theme.breakpoints.up("sm")]: {
        flexBasis: `calc(50% - ${theme.spacing(1)})`,
      },
      [theme.breakpoints.up("md")]: {
        flexBasis: `calc(33.33% - ${theme.spacing(1)})`,
      },
      content: "''",
      flexBasis: "100%",
    },
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  discussionsHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  },
  newPostButton: {
    margin: theme.spacing(1),
  },
}));

export default function DiscussionsSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = { ...useCommunityPageStyles(), ...useStyles() };

  //temporary
  const [isNewCommentOpen, setIsNewCommentOpen] = useState(false);

  const {
    isLoading: isDiscussionsLoading,
    error: discussionsError,
    data: discussions,
    hasNextPage: discussionsHasNextPage,
  } = useListDiscussions(community.communityId);

  const queryClient = useQueryClient();
  const newDiscussionMutation = useNewDiscussionMutation(queryClient);

  return (
    <>
      <div className={classes.discussionsHeader}>
        <SectionTitle icon={<EmailIcon />}>
          {DISCUSSIONS_TITLE(community.name)}
        </SectionTitle>
        <IconButton
          aria-label={NEW_POST_LABEL}
          onClick={() => setIsNewCommentOpen(true)}
        >
          <AddIcon />
        </IconButton>
      </div>
      {discussionsError && (
        <Alert severity="error">{discussionsError.message}</Alert>
      )}
      {
        //This comment adding dialog is temporary
      }
      <Dialog
        open={isNewCommentOpen}
        onClose={() => setIsNewCommentOpen(false)}
      >
        <DialogContent>
          {newDiscussionMutation.error && (
            <Alert severity="error">
              {newDiscussionMutation.error.message}
            </Alert>
          )}
          <NewComment
            onComment={async (content) =>
              newDiscussionMutation.mutate({
                content,
                ownerCommunityId: community.communityId,
                title: "test",
              })
            }
          />
        </DialogContent>
      </Dialog>
      <div className={classes.discussionsContainer}>
        {isDiscussionsLoading && <CircularProgress />}
        {discussions &&
          (discussions.pages.length > 0 &&
          discussions.pages[0].discussionsList.length === 0 ? (
            <TextBody>{DISCUSSIONS_EMPTY_STATE}</TextBody>
          ) : (
            discussions.pages
              .flatMap((res) => res.discussionsList)
              .map((discussion) => (
                <DiscussionCard
                  discussion={discussion}
                  className={classes.discussionCard}
                  key={`discussioncard-${discussion.threadId}`}
                />
              ))
          ))}
        {discussionsHasNextPage && (
          <div className={classes.loadMoreButton}>
            <Link
              to={routeToCommunityDiscussions(
                community.communityId,
                community.slug
              )}
            >
              <IconButton aria-label={SEE_MORE_DISCUSSIONS_LABEL}>
                <MoreIcon />
              </IconButton>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
