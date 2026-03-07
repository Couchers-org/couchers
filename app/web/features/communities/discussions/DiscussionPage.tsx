import { Skeleton, styled, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon } from "components/Icons";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import { discussionKey } from "features/queryKeys";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Discussion } from "proto/discussions_pb";
import { service } from "service";
import { theme } from "theme";
import { BROWSER_TIMEZONE, localizeDateTime, timestamp2Date } from "utils/date";

import CommunityBase from "../CommunityBase";
import CommunityPageSubHeader from "../CommunityPage/CommunityPageSubHeader";
import PageHeader from "../PageHeader";
import CommentTree from "./CommentTree";

const StyledPageHeader = styled(PageHeader)(() => ({
  alignItems: "center",
  display: "flex",
}));

const StyledDiscussionHeader = styled("div")(() => ({
  alignItems: "center",
  display: "flex",
}));

const StyledDiscussionBodyWrapper = styled("div")(() => ({
  paddingBlockEnd: theme.spacing(5),
}));

const StyledDiscussionTitle = styled(PageTitle)(() => ({
  marginInlineStart: theme.spacing(2),
}));

const StyledDiscussionContent = styled(Markdown)(() => ({
  marginBlockEnd: theme.spacing(3),
}));

const StyledCreatorContainer = styled("div")(() => ({
  creatorContainer: {
    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },
    alignItems: "center",
    display: "flex",
    marginBlockEnd: theme.spacing(3),
  },
}));

const StyledAvatar = styled(Avatar)(() => ({
  height: "3rem",
  width: "3rem",
}));

const StyledCreatorDetailsContainer = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
}));

export const CREATOR_TEST_ID = "creator";

export default function DiscussionPage({
  discussionId,
}: {
  discussionId: number;
}) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, COMMUNITIES]);
  const router = useRouter();

  const {
    data: discussion,
    error,
    isLoading: isDiscussionLoading,
  } = useQuery<Discussion.AsObject, RpcError>({
    queryKey: discussionKey(discussionId),
    queryFn: () => service.discussions.getDiscussion(discussionId),
  });

  const { data: discussionCreator, isLoading: isCreatorLoading } = useLiteUser(
    discussion?.creatorUserId,
  );

  return (
    <>
      <HtmlMeta title={discussion?.title} />
      {error && <Alert severity="error">{error.message}</Alert>}
      {isDiscussionLoading ? (
        <CenteredSpinner />
      ) : (
        discussion && (
          <CommunityBase communityId={discussion.ownerCommunityId}>
            {({ community }) => (
              <>
                {community.mainPage && (
                  <StyledPageHeader page={community.mainPage} />
                )}
                <CommunityPageSubHeader
                  community={community}
                  tab="discussions"
                />
                <StyledDiscussionBodyWrapper>
                  <StyledDiscussionHeader>
                    <HeaderButton
                      onClick={() => router.back()}
                      aria-label={t("communities:previous_page")}
                    >
                      <BackIcon />
                    </HeaderButton>
                    <StyledDiscussionTitle>
                      {discussion.title}
                    </StyledDiscussionTitle>
                  </StyledDiscussionHeader>
                  <StyledDiscussionContent source={discussion.content} />
                  <StyledCreatorContainer data-testid={CREATOR_TEST_ID}>
                    <StyledAvatar user={discussionCreator} />
                    <StyledCreatorDetailsContainer>
                      {isCreatorLoading ? (
                        <Skeleton width={100} />
                      ) : (
                        <Typography variant="body1">
                          {discussionCreator?.name ??
                            t("communities:unknown_user")}
                        </Typography>
                      )}
                      {isCreatorLoading ? (
                        <Skeleton width={100} />
                      ) : (
                        <Typography variant="body2">
                          {t("communities:discussion_creation_date", {
                            dateOnly: localizeDateTime(
                              timestamp2Date(discussion.created!),
                              {
                                timezone: BROWSER_TIMEZONE,
                                locale,
                                includeTime: false,
                              },
                            ),
                          })}
                        </Typography>
                      )}
                    </StyledCreatorDetailsContainer>
                  </StyledCreatorContainer>
                  <Typography variant="h2">
                    {t("communities:comments")}
                  </Typography>
                  <CommentTree threadId={discussion.thread!.threadId} />
                </StyledDiscussionBodyWrapper>
              </>
            )}
          </CommunityBase>
        )
      )}
    </>
  );
}
