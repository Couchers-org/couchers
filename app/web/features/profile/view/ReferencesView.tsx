import { styled } from "@mui/material";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import TextBody from "components/TextBody";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { ListReferencesRes } from "proto/references_pb";
import { useEffect, useRef } from "react";
import { theme } from "theme";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import ReferenceList from "./ReferenceList";

// Type utility to ensure data is properly typed for ListReferencesRes
export type ListReferencesInfiniteQueryResult = Omit<
  UseInfiniteQueryResult<ListReferencesRes.AsObject, RpcError>,
  "data"
> & {
  data: InfiniteData<ListReferencesRes.AsObject> | undefined;
};

interface ReferencesViewProps {
  isReceived?: boolean;
  isReferenceUsersLoading: boolean;
  referencesQuery: ListReferencesInfiniteQueryResult;
  referenceUsers: ReturnType<typeof useLiteUsers>["data"];
}

const SeeMoreReferencesButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  width: "100%",
}));

export default function ReferencesView({
  isReceived,
  isReferenceUsersLoading,
  referencesQuery: {
    data: referencesRes,
    error: referencesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isReferencesLoading,
  },
  referenceUsers,
}: ReferencesViewProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const scrollPositionRef = useRef<number | null>(null);

  // Restore scroll position after loading more references
  useEffect(() => {
    if (!isFetchingNextPage && scrollPositionRef.current !== null) {
      // Restore the scroll position
      window.scrollTo(0, scrollPositionRef.current);
      scrollPositionRef.current = null;
    }
  }, [isFetchingNextPage]);

  const handleFetchMore = () => {
    // Store current scroll position before fetching
    scrollPositionRef.current = window.scrollY;
    fetchNextPage();
  };

  return (
    <>
      {referencesError && <Alert severity="error">{referencesError.message}</Alert>}
      {isReferenceUsersLoading || isReferencesLoading ? (
        <CenteredSpinner />
      ) : hasAtLeastOnePage(referencesRes, "referencesList") ? (
        <>
          <ReferenceList isReceived={isReceived} referencePages={referencesRes.pages} referenceUsers={referenceUsers} />
          {hasNextPage && (
            <SeeMoreReferencesButtonContainer>
              <Button loading={isFetchingNextPage} onClick={handleFetchMore}>
                {t("profile:see_more_references")}
              </Button>
            </SeeMoreReferencesButtonContainer>
          )}
        </>
      ) : (
        <TextBody sx={{ marginBlockStart: theme.spacing(1) }}>{t("profile:no_references")}</TextBody>
      )}
    </>
  );
}
