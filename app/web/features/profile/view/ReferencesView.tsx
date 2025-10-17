import { ListReferencesRes } from "@couchers/services/references";
import { styled } from "@mui/material";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import TextBody from "@/components/TextBody";
import { useLiteUsers } from "@/features/userQueries/useLiteUsers";
import { useTranslation } from "@/i18n";
import { GLOBAL, PROFILE } from "@/i18n/namespaces";
import { theme } from "@/theme";
import hasAtLeastOnePage from "@/utils/hasAtLeastOnePage";

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

const SeeMoreReferencesButtonContainer = styled("div")(() => ({
  display: "flex",
  justifyContent: "center",
  width: "100%",
}));

const ReferencesView = ({
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
}: ReferencesViewProps) => {
  const { t } = useTranslation([GLOBAL, PROFILE]);

  return (
    <>
      {referencesError && (
        <Alert severity="error">{referencesError.message}</Alert>
      )}
      {isReferenceUsersLoading || isReferencesLoading ? (
        <CenteredSpinner />
      ) : hasAtLeastOnePage(referencesRes, "referencesList") ? (
        <>
          <ReferenceList
            isReceived={isReceived}
            referencePages={referencesRes.pages}
            referenceUsers={referenceUsers}
          />
          {hasNextPage && (
            <SeeMoreReferencesButtonContainer>
              <Button
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {t("profile:see_more_references")}
              </Button>
            </SeeMoreReferencesButtonContainer>
          )}
        </>
      ) : (
        <TextBody sx={{ marginBlockStart: theme.spacing(1) }}>
          {t("profile:no_references")}
        </TextBody>
      )}
    </>
  );
};

export default ReferencesView;
