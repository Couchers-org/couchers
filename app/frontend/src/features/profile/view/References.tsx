import { List, makeStyles, Select, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import { MenuItem } from "components/Menu";
import TextBody from "components/TextBody";
import { REFERENCES } from "features/constants";
import {
  getReferencesGivenHeading,
  NO_REFERENCES,
  REFERENCES_FILTER_A11Y_LABEL,
  referencesFilterLabels,
} from "features/profile/constants";
import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { User } from "pb/api_pb";
import { ListReferencesRes } from "pb/references_pb";
import { referencesGivenKey, referencesReceivedKey } from "queryKeys";
import React, { useState } from "react";
import { useInfiniteQuery } from "react-query";
import { service } from "service/index";
import hasPages from "utils/hasPages";

import ReferenceListItem from "./ReferenceListItem";

const useStyles = makeStyles((theme) => ({
  header: {
    marginTop: 0,
  },
  headerContainer: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    paddingBlockStart: theme.spacing(2),
    width: "100%",
  },
  seeMoreReferencesButtonContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  noReferencesText: {
    marginBlockStart: theme.spacing(1),
  },

  referencesContainer: {
    display: "flex",
    flexFlow: "row wrap",
  },
  referencesList: {
    "& > *": {
      paddingBlockEnd: theme.spacing(3),
    },
    width: "100%",
  },
  referenceTypeSelect: {
    paddingInlineStart: theme.spacing(1),
  },
  userSummary: {
    width: "100%",
  },
}));

interface UserReferencesProps {
  user: User.AsObject;
}

export type ReferenceTypeState = keyof typeof referencesFilterLabels;

export default function References({ user }: UserReferencesProps) {
  const classes = useStyles();
  const [referenceType, setReferenceType] = useState<ReferenceTypeState>("all");

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setReferenceType(event.target.value as ReferenceTypeState);
  };

  return (
    <div className={classes.referencesContainer}>
      <div className={classes.headerContainer}>
        <Typography className={classes.header} variant="h1">
          {REFERENCES}
        </Typography>
        <Select
          classes={{ select: classes.referenceTypeSelect }}
          displayEmpty
          inputProps={{ "aria-label": REFERENCES_FILTER_A11Y_LABEL }}
          onChange={handleChange}
          value={referenceType}
        >
          {Object.entries(referencesFilterLabels).map(([key, label]) => {
            const value = key === "all" || key === "given" ? key : Number(key);
            return (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            );
          })}
        </Select>
      </div>
      {referenceType === "all" ? (
        <AllReferencesList user={user} />
      ) : referenceType !== "given" ? (
        <ReferencesReceivedList user={user} referenceType={referenceType} />
      ) : (
        <p>References given to others...</p>
      )}
    </div>
  );
}

function ReferencesReceivedList({
  user,
  referenceType,
}: {
  user: User.AsObject;
  referenceType: Exclude<ReferenceTypeState, "given">;
}) {
  const classes = useStyles();
  const {
    data: referencesRes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isReferencesLoading,
    error: referencesError,
  } = useInfiniteQuery<ListReferencesRes.AsObject, GrpcError>({
    queryFn: ({ pageParam: pageToken }: { pageParam?: string }) =>
      service.references.getReferencesReceivedForUser({
        pageToken,
        referenceType,
        userId: user.userId,
      }),
    queryKey: referencesReceivedKey(user.userId, referenceType),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });

  const userIds =
    referencesRes?.pages
      .map((page) =>
        page.referencesList.map((reference) => reference.fromUserId)
      )
      .flat() ?? [];
  const { data: referenceUsers, isLoading: isReferenceUsersLoading } = useUsers(
    userIds
  );

  return (
    <>
      {referencesError && (
        <Alert severity="error">{referencesError.message}</Alert>
      )}
      {isReferenceUsersLoading || isReferencesLoading ? (
        <CircularProgress />
      ) : referencesRes &&
        referencesRes.pages.length &&
        referencesRes.pages[0].referencesList.length ? (
        <>
          <List className={classes.referencesList}>
            {referencesRes.pages
              .map((page) =>
                page.referencesList.map((reference) => {
                  const userToShow = referenceUsers?.get(reference.fromUserId);
                  return userToShow ? (
                    <ReferenceListItem
                      key={reference.referenceId}
                      isReceived
                      user={userToShow}
                      reference={reference}
                    />
                  ) : null;
                })
              )
              .flat()}
          </List>
          {hasNextPage && (
            <div className={classes.seeMoreReferencesButtonContainer}>
              <Button
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                See more references
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

function AllReferencesList({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  const {
    data: referencesGivenRes,
    error: referencesGivenError,
    isLoading: isReferencesGivenLoading,
    fetchNextPage: fetchReferencesGivenNextPage,
    isFetchingNextPage: isFetchingReferencesGivenNextPage,
    hasNextPage: hasReferencesGivenNextPage,
  } = useInfiniteQuery<ListReferencesRes.AsObject, GrpcError>({
    queryFn: ({ pageParam: pageToken }: { pageParam?: string }) =>
      service.references.getReferencesGivenByUser({
        pageToken,
        userId: user.userId,
      }),
    queryKey: referencesGivenKey(user.userId),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });
  const {
    data: referencesReceivedRes,
    error: referencesReceivedError,
    isLoading: isReferencesReceivedLoading,
    fetchNextPage: fetchReferencesReceivedNextPage,
    isFetchingNextPage: isFetchingReferencesReceivedNextPage,
    hasNextPage: hasReferencesReceivedNextPage,
  } = useInfiniteQuery<ListReferencesRes.AsObject, GrpcError>({
    queryFn: ({ pageParam: pageToken }: { pageParam?: string }) =>
      service.references.getReferencesReceivedForUser({
        pageToken,
        userId: user.userId,
      }),
    queryKey: referencesReceivedKey(user.userId, "all"),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });

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
              <List className={classes.referencesList}>
                {referencesReceivedRes.pages
                  .map((page) =>
                    page.referencesList.map((reference) => {
                      const userToShow = referenceUsers?.get(
                        reference.fromUserId
                      );
                      return userToShow ? (
                        <ReferenceListItem
                          key={reference.referenceId}
                          isReceived
                          user={userToShow}
                          reference={reference}
                        />
                      ) : null;
                    })
                  )
                  .flat()}
              </List>
              {hasReferencesReceivedNextPage && (
                <div className={classes.seeMoreReferencesButtonContainer}>
                  <Button
                    loading={isFetchingReferencesReceivedNextPage}
                    onClick={() => fetchReferencesReceivedNextPage()}
                  >
                    See more references for {user.name}
                  </Button>
                </div>
              )}
            </>
          )}
          {hasPages(referencesGivenRes, "referencesList") && (
            <>
              <Typography variant="h1">
                {getReferencesGivenHeading(user.name)}
              </Typography>
              <List className={classes.referencesList}>
                {referencesGivenRes.pages
                  .map((page) =>
                    page.referencesList.map((reference) => {
                      const userToShow = referenceUsers?.get(
                        reference.toUserId
                      );
                      return userToShow ? (
                        <ReferenceListItem
                          key={reference.referenceId}
                          isReceived={false}
                          user={userToShow}
                          reference={reference}
                        />
                      ) : null;
                    })
                  )
                  .flat()}
              </List>
              {hasReferencesGivenNextPage && (
                <div className={classes.seeMoreReferencesButtonContainer}>
                  <Button
                    loading={isFetchingReferencesGivenNextPage}
                    onClick={() => fetchReferencesGivenNextPage()}
                  >
                    See more references
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
