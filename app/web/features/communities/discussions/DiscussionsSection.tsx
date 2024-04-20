import { Link as MuiLink } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import { EmailIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { useListDiscussions } from "features/communities/hooks";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
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
  const { t } = useTranslation([COMMUNITIES]);
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
          {t("communities:discussions_title")}
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
          {t("communities:new_post_label")}
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
          <TextBody>{t("communities:discussions_empty_state")}</TextBody>
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
              <MuiLink component="a">
                {t("communities:see_more_discussions_label")}
              </MuiLink>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
