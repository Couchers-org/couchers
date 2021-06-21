import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextBody from "components/TextBody";
import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { ListReferencesRes } from "proto/references_pb";
import { UseInfiniteQueryResult } from "react-query";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { NO_REFERENCES, SEE_MORE_REFERENCES } from "../constants";
import ReferenceList from "./ReferenceList";

interface ReferencesViewProps {
  isReceived?: boolean;
  isReferenceUsersLoading: boolean;
  referencesQuery: UseInfiniteQueryResult<
    ListReferencesRes.AsObject,
    GrpcError
  >;
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
                {SEE_MORE_REFERENCES}
              </Button>
            </div>
          )}
        </>
      ) : (
        <TextBody className={classes.noReferencesText}>
          {NO_REFERENCES}
        </TextBody>
      )}
    </>
  );
}
