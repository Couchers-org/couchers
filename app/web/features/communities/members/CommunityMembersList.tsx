import { Pagination, styled } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
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
}: {
  communityId: Community.AsObject["communityId"];
}) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const PAGE_SIZE = 20;

  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading, error } = useListMembers({
    communityId,
    pageSize: PAGE_SIZE,
    pageNumber,
  });

  const memberUserIdsList = data?.memberUserIdsList ?? [];
  const numPages = Math.ceil((data?.totalItems ?? 0) / PAGE_SIZE) ?? 1;

  const handlePageNumberChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPageNumber(value);
  };

  return (
    <>
      <SectionTitle icon={<PersonIcon />} variant="h2">
        {t("communities:members_title")}
      </SectionTitle>

      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : memberUserIdsList?.length > 0 ? (
        <>
          <UsersList
            userIds={memberUserIdsList}
            endChildren={
              <PaginationWrapper>
                <Pagination
                  count={numPages}
                  page={pageNumber}
                  color="primary"
                  onChange={handlePageNumberChange}
                  size="large"
                />
              </PaginationWrapper>
            }
            titleIsLink
          />
        </>
      ) : (
        !error && <TextBody>{t("communities:members_empty_state")}</TextBody>
      )}
    </>
  );
}
