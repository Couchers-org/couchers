import { Link as MuiLink } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import { EmailIcon } from "components/Icons";
import TextBody from "components/TextBody";
import {
  DISCUSSIONS_EMPTY_STATE,
  DISCUSSIONS_TITLE,
  NEW_POST_LABEL,
  SEE_MORE_DISCUSSIONS_LABEL,
} from "features/communities/constants";
import { useListDiscussions } from "features/communities/hooks";
import Link from "next/link";
import { Community } from "proto/communities_pb";
import { composingDiscussionHash, routeToCommunity } from "routes";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import { SectionTitle, useCommunityPageStyles } from "../CommunityPage";
import DiscussionCard from "./DiscussionCard";
import useDiscussionsListStyles from "./useDiscussionsListStyles";

export default function DiscussionsSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = {
    ...useCommunityPageStyles(),
    ...useDiscussionsListStyles(),
  };

  const {
    isLoading: isDiscussionsLoading,
    error: discussionsError,
    data: discussions,
    hasNextPage: discussionsHasNextPage,
  } = useListDiscussions(community.communityId);

  return (
    <section>
      <div className={classes.discussionsHeader}>
        <SectionTitle icon={<EmailIcon />} variant="h2">
          {DISCUSSIONS_TITLE}
        </SectionTitle>
      </div>
      {discussionsError && (
        <Alert severity="error">{discussionsError.message}</Alert>
      )}
      <Link
        href={`${routeToCommunity(
          community.communityId,
          community.slug,
          "discussions"
        )}#${composingDiscussionHash}`}
        passHref
      >
        <Button
          size="small"
          className={classes.createResourceButton}
          component="a"
        >
          {NEW_POST_LABEL}
        </Button>
      </Link>
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
            <Link
              href={routeToCommunity(
                community.communityId,
                community.slug,
                "discussions"
              )}
              passHref
            >
              <MuiLink component="a">{SEE_MORE_DISCUSSIONS_LABEL}</MuiLink>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
