import { List, makeStyles, Select, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import { MenuItem } from "components/Menu";
import TextBody from "components/TextBody";
import {
  getReferencesGivenHeading,
  NO_REFERENCES,
  REFERENCES,
  REFERENCES_FILTER_A11Y_LABEL,
  referencesFilterLabels,
} from "features/constants";
import { referencesQueryStaleTime } from "features/profile/constants";
import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { GetReferencesRes, User } from "pb/api_pb";
import { referencesKey } from "queryKeys";
import React, { useState } from "react";
import { useQueries, useQuery } from "react-query";
import { service } from "service/index";

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

type ReferenceTypeState = keyof typeof referencesFilterLabels;

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
      ) : (
        <FilteredReferencesList
          isReceived={referenceType !== "given"}
          user={user}
          referenceType={referenceType}
        />
      )}
    </div>
  );
}

function FilteredReferencesList({
  isReceived,
  user,
  referenceType,
}: {
  isReceived: boolean;
  user: User.AsObject;
  referenceType: ReferenceTypeState;
}) {
  const classes = useStyles();
  const {
    data: references,
    isLoading: isReferencesLoading,
    error: referencesError,
  } = useQuery<GetReferencesRes.AsObject, GrpcError>({
    cacheTime: referencesQueryStaleTime,
    queryFn: () =>
      isReceived
        ? service.user.getReferencesReceived({
            count: 50,
            offset: 0,
            userId: user.userId,
          })
        : service.user.getReferencesGiven({
            count: 50,
            offset: 0,
            userId: user.userId,
          }),
    queryKey: referencesKey(user.userId, isReceived ? "received" : "given"),
    staleTime: referencesQueryStaleTime,
  });

  const { data: referenceUsers, isLoading: isReferenceUsersLoading } = useUsers(
    references?.referencesList.map((reference) =>
      isReceived ? reference.fromUserId : reference.toUserId
    ) ?? []
  );

  // Show only the matching reference type if viewing received references, otherwise display
  // all given references
  const referencesToRender = isReceived
    ? references?.referencesList.filter(
        (reference) => reference.referenceType === referenceType
      )
    : references?.referencesList;

  return (
    <>
      {referencesError && (
        <Alert severity="error">{referencesError.message}</Alert>
      )}
      {isReferenceUsersLoading || isReferencesLoading ? (
        <CircularProgress />
      ) : referencesToRender && referencesToRender.length > 0 ? (
        <List className={classes.referencesList}>
          {referencesToRender.map((reference) => {
            const userToShow = referenceUsers?.get(
              isReceived ? reference.fromUserId : reference.toUserId
            );
            return userToShow ? (
              <ReferenceListItem
                key={reference.referenceId}
                isReceived={isReceived}
                user={userToShow}
                reference={reference}
              />
            ) : null;
          })}
        </List>
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
  const referencesQueries = useQueries<GetReferencesRes.AsObject, GrpcError>([
    {
      cacheTime: referencesQueryStaleTime,
      queryFn: () =>
        service.user.getReferencesReceived({
          count: 50,
          offset: 0,
          userId: user.userId,
        }),
      queryKey: referencesKey(user.userId, "received"),
      staleTime: referencesQueryStaleTime,
    },
    {
      cacheTime: referencesQueryStaleTime,
      queryFn: () =>
        service.user.getReferencesGiven({
          count: 50,
          offset: 0,
          userId: user.userId,
        }),
      queryKey: referencesKey(user.userId, "given"),
      staleTime: referencesQueryStaleTime,
    },
  ]);

  const userIds = referencesQueries
    .map((query) => {
      return (
        query.data?.referencesList.map((r) =>
          r.fromUserId === user.userId ? r.toUserId : r.fromUserId
        ) ?? []
      );
    })
    .flat();
  const { data: referenceUsers, isLoading: isReferenceUsersLoading } = useUsers(
    userIds
  );
  const [
    {
      data: referencesReceived,
      error: referencesReceivedError,
      isLoading: isReferencesReceivedLoading,
    },
    {
      data: referencesGiven,
      error: referencesGivenError,
      isLoading: isReferencesGivenLoading,
    },
  ] = referencesQueries;

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
          {referencesReceived && referencesReceived.totalMatches > 0 && (
            <List className={classes.referencesList}>
              {referencesReceived.referencesList.map((reference) => {
                const userToShow = referenceUsers?.get(reference.fromUserId);
                return userToShow ? (
                  <ReferenceListItem
                    key={reference.referenceId}
                    isReceived
                    user={userToShow}
                    reference={reference}
                  />
                ) : null;
              })}
            </List>
          )}
          {referencesGiven && referencesGiven.totalMatches > 0 && (
            <>
              <Typography variant="h1">
                {getReferencesGivenHeading(user.name)}
              </Typography>
              <List className={classes.referencesList}>
                {referencesGiven.referencesList.map((reference) => {
                  const userToShow = referenceUsers?.get(reference.toUserId);
                  return userToShow ? (
                    <ReferenceListItem
                      key={reference.referenceId}
                      isReceived={false}
                      user={userToShow}
                      reference={reference}
                    />
                  ) : null;
                })}
              </List>
            </>
          )}
          {!referencesReceived?.totalMatches &&
            !referencesGiven?.totalMatches && (
              <TextBody className={classes.noReferencesText}>
                {NO_REFERENCES}
              </TextBody>
            )}
        </>
      )}
    </>
  );
}
