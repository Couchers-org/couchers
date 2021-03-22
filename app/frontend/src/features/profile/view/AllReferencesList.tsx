import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextBody from "components/TextBody";
import useUsers from "features/userQueries/useUsers";
import hasPages from "utils/hasPages";

import {
  getReferencesGivenHeading,
  getSeeMoreReferences,
  NO_REFERENCES,
  SEE_MORE_REFERENCES,
} from "../constants";
import {
  useReferencesGiven,
  useReferencesReceived,
} from "../hooks/referencesHooks";
import { useProfileUser } from "../hooks/useProfileUser";
import ReferenceList from "./ReferenceList";
import { useReferencesViewStyles } from "./ReferencesView";

export default function AllReferencesList() {
  const classes = useReferencesViewStyles();
  const user = useProfileUser();
  const {
    data: referencesGivenRes,
    error: referencesGivenError,
    isLoading: isReferencesGivenLoading,
    fetchNextPage: fetchReferencesGivenNextPage,
    isFetchingNextPage: isFetchingReferencesGivenNextPage,
    hasNextPage: hasReferencesGivenNextPage,
  } = useReferencesGiven(user);
  const {
    data: referencesReceivedRes,
    error: referencesReceivedError,
    isLoading: isReferencesReceivedLoading,
    fetchNextPage: fetchReferencesReceivedNextPage,
    isFetchingNextPage: isFetchingReferencesReceivedNextPage,
    hasNextPage: hasReferencesReceivedNextPage,
  } = useReferencesReceived(user, "all");

  const givenUserIds =
    referencesGivenRes?.pages
      .map((page) => page.referencesList.map((reference) => reference.toUserId))
      .flat() ?? [];
  const receivedUserIds =
    referencesReceivedRes?.pages
      .map((page) =>
        page.referencesList.map((reference) => reference.fromUserId)
      )
      .flat() ?? [];
  const {
    data: referenceUsers,
    isLoading: isReferenceUsersLoading,
  } = useUsers([...givenUserIds, ...receivedUserIds]);

  return (
    <>
      {referencesReceivedError || referencesGivenError ? (
        <Alert severity="error">
          {referencesReceivedError?.message ||
            referencesGivenError?.message ||
            ""}
        </Alert>
      ) : null}
      {isReferencesReceivedLoading ||
      isReferenceUsersLoading ||
      isReferencesGivenLoading ? (
        <CircularProgress />
      ) : (
        <>
          {hasPages(referencesReceivedRes, "referencesList") && (
            <>
              <ReferenceList
                isReceived
                referencePages={referencesReceivedRes.pages}
                referenceUsers={referenceUsers}
              />
              {hasReferencesReceivedNextPage && (
                <div className={classes.seeMoreReferencesButtonContainer}>
                  <Button
                    loading={isFetchingReferencesReceivedNextPage}
                    onClick={() => fetchReferencesReceivedNextPage()}
                  >
                    {getSeeMoreReferences(user.name)}
                  </Button>
                </div>
              )}
            </>
          )}
          {hasPages(referencesGivenRes, "referencesList") && (
            <>
              <Typography variant="h2">
                {getReferencesGivenHeading(user.name)}
              </Typography>
              <ReferenceList
                referencePages={referencesGivenRes.pages}
                referenceUsers={referenceUsers}
              />
              {hasReferencesGivenNextPage && (
                <div className={classes.seeMoreReferencesButtonContainer}>
                  <Button
                    loading={isFetchingReferencesGivenNextPage}
                    onClick={() => fetchReferencesGivenNextPage()}
                  >
                    {SEE_MORE_REFERENCES}
                  </Button>
                </div>
              )}
            </>
          )}
          {!(
            hasPages(referencesReceivedRes, "referencesList") ||
            hasPages(referencesGivenRes, "referencesList")
          ) && (
            <TextBody className={classes.noReferencesText}>
              {NO_REFERENCES}
            </TextBody>
          )}
        </>
      )}
    </>
  );
}
