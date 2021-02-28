import { Dialog, DialogContent, makeStyles } from "@material-ui/core";
import React, { useState } from "react";
import { useQueryClient } from "react-query";
import { Link } from "react-router-dom";

import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import NewComment from "../../../components/Comments/NewComment";
import IconButton from "../../../components/IconButton";
import { AddIcon, EmailIcon, MoreIcon } from "../../../components/Icons";
import TextBody from "../../../components/TextBody";
import { Community } from "../../../pb/communities_pb";
import { routeToCommunityDiscussions } from "../../../routes";
import { useListDiscussions, useNewDiscussionMutation } from "../useCommunity";
import { useCommunityPageStyles } from "./CommunityPage";
import DiscussionCard from "./DiscussionCard";
import SectionTitle from "./SectionTitle";

const useStyles = makeStyles((theme) => ({
  discussionsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newPostButton: {
    margin: theme.spacing(1),
  },
  discussionsContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    "& > *": {
      width: "100%",
      [theme.breakpoints.up("sm")]: {
        width: `calc(50% - ${theme.spacing(1)})`,
      },
      [theme.breakpoints.up("md")]: {
        width: `calc(33.33% - ${theme.spacing(1)})`,
      },
    },
    //preserve grid in the last row
    "&::after": {
      content: "''",
      flexBasis: "100%",
      [theme.breakpoints.up("sm")]: {
        flexBasis: `calc(50% - ${theme.spacing(1)})`,
      },
      [theme.breakpoints.up("md")]: {
        flexBasis: `calc(33.33% - ${theme.spacing(1)})`,
      },
    },
  },
  discussionCard: {
    marginBottom: theme.spacing(1),
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
          {`${community.name} discussions`}
        </SectionTitle>
        <IconButton
          aria-label="New post"
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
                title: "test",
                content,
                ownerCommunityId: community.communityId,
              })
            }
          />
        </DialogContent>
      </Dialog>
      <div className={classes.discussionsContainer}>
        {isDiscussionsLoading && <CircularProgress />}
        {discussions &&
        discussions.pages.length > 0 &&
        discussions.pages[0].discussionsList.length === 0 ? (
          <TextBody>No discussions to show yet.</TextBody>
        ) : (
          discussions?.pages
            .flatMap((res) => res.discussionsList)
            .map((discussion) => (
              <DiscussionCard
                discussion={discussion}
                className={classes.discussionCard}
                key={`discussioncard-${discussion.threadId}`}
              />
            ))
        )}
        {discussionsHasNextPage && (
          <div className={classes.loadMoreButton}>
            <Link
              to={routeToCommunityDiscussions(
                community.communityId,
                community.slug
              )}
            >
              <IconButton aria-label="See more discussions">
                <MoreIcon />
              </IconButton>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
