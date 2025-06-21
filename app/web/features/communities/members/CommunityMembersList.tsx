import { styled, Typography } from "@mui/material";
import { Box } from "@mui/system";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import CursorPagination from "components/CursorPagination";
import { PersonIcon } from "components/Icons";
import TextBody from "components/TextBody";
import UsersList from "components/UsersList";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { useState } from "react";

import { SectionTitle } from "../CommunityPage";
import { useListMembers } from "../hooks";

const PaginationWrapper = styled("div")(({ theme }) => ({
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
  const PAGE_SIZE = 2;

  const [pageNumber, setPageNumber] = useState(1);

  const { data, isFetching, isLoading, error, hasNextPage, fetchNextPage } =
    useListMembers({
      communityId,
      pageSize: PAGE_SIZE,
    });

  // @TODO Nicole WIP - the final page is going missing with userID 1
  const memberUserIdsList =
    data?.pages && data.pages[pageNumber - 1]?.memberUserIdsList;

  const handelPreviousPageClick = () => {
    setPageNumber(pageNumber - 1);
  };

  const handleNextPageClick = () => {
    fetchNextPage();
    setPageNumber(pageNumber + 1);
  };

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
      {isLoading ? (
        <CenteredSpinner />
      ) : (
        <>
          <UsersList
            userIds={memberUserIdsList}
            endChildren={
              <PaginationWrapper>
                <CursorPagination
                  hasNextPage={hasNextPage}
                  onNext={handleNextPageClick}
                  hasPreviousPage={pageNumber > 1}
                  onPrevious={handelPreviousPageClick}
                  isLoading={isLoading}
                />
              </PaginationWrapper>
            }
            titleIsLink
          />
        </>
      )}
      {!error && !isFetching && (
        <TextBody>{t("communities:members_empty_state")}</TextBody>
      )}
    </>
  );
}
