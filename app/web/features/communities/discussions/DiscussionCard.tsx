import { Card, CardContent, Skeleton, styled, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import FlagButton from "features/FlagButton";
import CopyOnClick from "features/mod/CopyOnClick";
import ModVisibleComponent from "features/mod/ModVisibleComponent";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { Discussion } from "proto/discussions_pb";
import { useMemo } from "react";
import { routeToDiscussion } from "routes";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import { timeAgo } from "utils/timeAgo";

import getContentSummary from "../getContentSummary";

const StyledCard = styled(Card)(({ theme }) => ({
  "&:hover": {
    backgroundColor: theme.palette.grey[50],
  },
  width: "100%",
}));

const StyledAvatar = styled(Avatar)({
  height: "3rem",
  width: "3rem",
});

const StyledAvatarFlagContainer = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  "&&": {
    padding: theme.spacing(2),
  },
  width: "100%",
}));

const StyledDiscussionSummary = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  marginInlineStart: theme.spacing(2),
}));

const StyledCommentsCount = styled(Typography)(({ theme }) => ({
  alignSelf: "flex-end",
  flexShrink: 0,
  color: theme.palette.primary.main,
}));

export const DISCUSSION_CARD_TEST_ID = "discussion-card";

export default function DiscussionCard({
  discussion,
  className,
}: {
  discussion: Discussion.AsObject;
  className?: string;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const { data: creator } = useLiteUser(discussion.creatorUserId);

  const date = discussion.created
    ? timestamp2Date(discussion.created)
    : undefined;
  const postedTime = date ? timeAgo(date) : null;
  const truncatedContent = useMemo(
    () =>
      getContentSummary({
        originalContent: discussion.content,
        maxLength: 300,
      }),
    [discussion.content],
  );

  const contentRef =
    (discussion.ownerCommunityId != 0
      ? `community/${discussion.ownerCommunityId}`
      : `group/${discussion.ownerGroupId}`) +
    `/discussion/${discussion.discussionId}`;

  return (
    <StyledCard className={className} data-testid={DISCUSSION_CARD_TEST_ID}>
      <Link href={routeToDiscussion(discussion.discussionId, discussion.slug)}>
        <StyledCardContent>
          <StyledAvatarFlagContainer>
            <StyledAvatar user={creator} isProfileLink={false} />
            <FlagButton
              contentRef={contentRef}
              authorUser={discussion.creatorUserId}
            />
          </StyledAvatarFlagContainer>
          <StyledDiscussionSummary>
            <Typography
              variant="body2"
              component="p"
              sx={{ marginBottom: theme.spacing(0.5) }}
            >
              {creator ? (
                t("communities:by_creator", { name: creator.name })
              ) : (
                <Skeleton sx={{ display: "inline-block", width: 80 }} />
              )}{" "}
              {postedTime && `• ${postedTime}`}
              <ModVisibleComponent>
                {" "}
                •{" "}
                <code>
                  discussionId:
                  <CopyOnClick text={discussion.discussionId.toString()} />
                </code>
              </ModVisibleComponent>
            </Typography>
            <Typography variant="h2" component="h3">
              {discussion.title}
            </Typography>
            <Typography variant="body1">{truncatedContent}</Typography>
            <StyledCommentsCount variant="body1">
              {t("communities:comments_count", {
                count: discussion.thread?.numResponses,
              })}
            </StyledCommentsCount>
          </StyledDiscussionSummary>
        </StyledCardContent>
      </Link>
    </StyledCard>
  );
}
