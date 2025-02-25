import { styled } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HorizontalScroller from "components/HorizontalScroller";
import { PersonIcon } from "components/Icons";
import TextBody from "components/TextBody";
import UsersList from "components/UsersList";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import { SectionTitle } from "../CommunityPage";
import { useListMembers } from "../hooks";

const StyledHorizontalScroller = styled(HorizontalScroller)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    //break out of page padding
    left: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
    position: "relative",
    right: "50%",
    width: "100vw",
  },
  [theme.breakpoints.up("sm")]: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: theme.spacing(2),
  },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: theme.spacing(3),
  },
  width: "100%",
  overflow: "hidden",
}));

const LoadMoreButtonWrapper = styled("div")(({ theme }) => ({
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

  const { data, isLoading, isFetching, error, fetchNextPage, hasNextPage } =
    useListMembers(communityId);

  const memberUserIdsList = data?.pages.flatMap(
    (page) => page.memberUserIdsList,
  );

  return (
    <>
      <SectionTitle icon={<PersonIcon />} variant="h2">
        {t("communities:members_title")}
      </SectionTitle>

      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : hasAtLeastOnePage(data, "memberUserIdsList") ? (
        <>
          <StyledHorizontalScroller>
            <UsersList
              userIds={memberUserIdsList}
              endChildren={
                hasNextPage && (
                  <LoadMoreButtonWrapper>
                    <Button
                      loading={isFetching}
                      onClick={() => fetchNextPage()}
                    >
                      Load more
                    </Button>
                  </LoadMoreButtonWrapper>
                )
              }
              titleIsLink
            />
          </StyledHorizontalScroller>
        </>
      ) : (
        !error && <TextBody>{t("communities:members_empty_state")}</TextBody>
      )}
    </>
  );
}
