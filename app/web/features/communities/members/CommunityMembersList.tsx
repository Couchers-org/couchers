import { styled, Typography } from "@mui/material";
import { Box } from "@mui/system";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import CircularProgress from "components/CircularProgress";
import { PersonIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { useCallback } from "react";
import useOnVisibleEffect from "utils/useOnVisibleEffect";

import { SectionTitle } from "../CommunityPage";
import { useListMembers } from "../hooks";
import MemberCard from "./MemberCard";

const MembersGrid = styled("div")(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(2),
  marginBlockStart: theme.spacing(2),
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 20rem), 1fr))",
}));

const LoadMoreWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  width: "100%",
  marginTop: theme.spacing(2),
}));

export default function CommunityMembersList({
  communityId,
  memberCount,
}: {
  communityId: Community.AsObject["communityId"];
  memberCount?: Community.AsObject["memberCount"];
}) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const PAGE_SIZE = 20;

  const {
    data,
    isFetching,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useListMembers({
    communityId,
    pageSize: PAGE_SIZE,
  });

  const memberUserIds =
    data?.pages.flatMap((page) => page.memberUserIdsList) ?? [];

  const { data: membersById, isLoading: isLoadingMembers } =
    useLiteUsers(memberUserIds);

  const handleLoadMoreVisible = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  const { ref: loadMoreRef } = useOnVisibleEffect(handleLoadMoreVisible);

  const members = memberUserIds
    .map((userId) => membersById?.get(userId))
    .filter((user): user is NonNullable<typeof user> => !!user);

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <SectionTitle icon={<PersonIcon />} variant="h2">
          {t("communities:members_title")}
        </SectionTitle>
        <Typography variant="body2" sx={{ margin: 2 }}>
          {memberCount} {t("communities:total_members")}
        </Typography>
      </Box>
      {error && <Alert severity="error">{error.message}</Alert>}
      {(isLoading || isLoadingMembers) && <CenteredSpinner />}
      {!isLoading && !isLoadingMembers && members.length > 0 && (
        <MembersGrid>
          {members.map((member) => (
            <MemberCard key={member.userId} user={member} />
          ))}
        </MembersGrid>
      )}
      {!error && !isFetching && memberUserIds.length === 0 && (
        <TextBody>{t("communities:members_empty_state")}</TextBody>
      )}
      {hasNextPage && !error && (
        <LoadMoreWrapper>
          {isFetchingNextPage ? (
            <CircularProgress />
          ) : (
            <CircularProgress
              variant="determinate"
              value={0}
              ref={loadMoreRef}
            />
          )}
        </LoadMoreWrapper>
      )}
    </>
  );
}
