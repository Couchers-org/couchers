import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextBody from "components/TextBody";
import useUsers from "features/userQueries/useUsers";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { ListReferencesRes } from "proto/references_pb";
import { UseInfiniteQueryResult } from "react-query";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import ReferenceList from "./ReferenceList";

interface ReferencesViewProps {
  isReceived?: boolean;
  isReferenceUsersLoading: boolean;
  referencesQuery: UseInfiniteQueryResult<ListReferencesRes.AsObject, RpcError>;
  referenceUsers: ReturnType<typeof useUsers>["data"];
}

export const useReferencesViewStyles = makeStyles((theme) => ({
  noReferencesText: {
    marginBlockStart: theme.spacing(1),
  },
  seeMoreReferencesButtonContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
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
  const classes = useReferencesViewStyles();

  return (
    <>
      {referencesError && (
        <Alert severity="error">{referencesError.message}</Alert>
      )}
      {isReferenceUsersLoading || isReferencesLoading ? (
        <CircularProgress />
      ) : hasAtLeastOnePage(referencesRes, "referencesList") ? (
        <>
          <ReferenceList
            isReceived={isReceived}
            referencePages={referencesRes.pages}
            referenceUsers={referenceUsers}
          />
          {hasNextPage && (
            <div className={classes.seeMoreReferencesButtonContainer}>
              <Button
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {t("profile:see_more_references")}
              </Button>
            </div>
          )}
        </>
      ) : (
        <TextBody className={classes.noReferencesText}>
          {t("profile:no_references")}
        </TextBody>
      )}
    </>
  );
}
