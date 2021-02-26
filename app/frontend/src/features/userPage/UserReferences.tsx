import { List, ListItem, makeStyles } from "@material-ui/core";
import { Error as GrpcError } from "grpc-web";
import React from "react";
import { useQuery } from "react-query";

import Alert from "../../components/Alert";
import CircularProgress from "../../components/CircularProgress";
import Pill from "../../components/Pill";
import TextBody from "../../components/TextBody";
import UserSummary from "../../components/UserSummary";
import {
  GetReferencesRes,
  Reference,
  ReferenceType,
  User,
} from "../../pb/api_pb";
import { service } from "../../service";
import { timestamp2Date } from "../../utils/date";
import useUsers from "../userQueries/useUsers";
import UserSection from "./UserSection";

const useStyles = makeStyles((theme) => ({
  badgesContainer: {
    display: "flex",
    flexDirection: "column",
    "& > * + *": {
      marginBlockStart: theme.spacing(2),
    },
    marginInlineEnd: theme.spacing(2),
    minWidth: theme.spacing(9),
  },
  listItem: {
    flexDirection: "column",
    alignItems: "flex-start",
    "& > * + *": {
      marginBlockStart: theme.spacing(2),
    },
    borderBlockEnd: `${theme.typography.pxToRem(1)} solid ${
      theme.palette.grey[300]
    }`,
  },
  referenceBodyContainer: {
    display: "flex",
    width: "100%",
  },
  referencesList: {
    "& > *": {
      paddingBlockEnd: theme.spacing(3),
    },
  },
  userSummary: {
    width: "100%",
  },
}));

interface ReferenceListItemProps {
  author: User.AsObject;
  reference: Reference.AsObject;
}

function ReferenceTypePill({ type }: { type: ReferenceType }) {
  let badgeLabel = "";
  switch (type) {
    case ReferenceType.FRIEND:
      badgeLabel = "Friend";
      break;
    case ReferenceType.HOSTED:
      badgeLabel = "Guest";
      break;
    case ReferenceType.SURFED:
      badgeLabel = "Hosted";
      break;
    default:
      break;
  }

  return <Pill variant="rounded">{badgeLabel}</Pill>;
}

const dateTimeFormatter = new Intl.DateTimeFormat(navigator.language, {
  month: "short",
  year: "numeric",
});

function ReferenceListItem({ author, reference }: ReferenceListItemProps) {
  const classes = useStyles();

  return (
    <ListItem className={classes.listItem}>
      <UserSummary user={author} />
      <div className={classes.referenceBodyContainer}>
        <div className={classes.badgesContainer}>
          <ReferenceTypePill type={reference.referenceType} />
          {reference.writtenTime && (
            <Pill variant="rounded">
              {dateTimeFormatter.format(timestamp2Date(reference.writtenTime))}
            </Pill>
          )}
        </div>
        <div>
          <TextBody>{reference.text}</TextBody>
        </div>
      </div>
    </ListItem>
  );
}

interface UserReferencesProps {
  user: User.AsObject;
}

export default function UserReferences({ user }: UserReferencesProps) {
  const classes = useStyles();

  const {
    data: referencesReceived,
    isLoading: isReferencesReceivedLoading,
    error: referencesReceivedError,
  } = useQuery<GetReferencesRes.AsObject, GrpcError>(
    ["references", { userId: user.userId, type: "received" }],
    () =>
      service.user.getReferencesReceived({
        count: 10,
        userId: user.userId,
        offset: 0,
      })
  );

  const { data: referenceUsers, isLoading: isReferenceUsersLoading } = useUsers(
    referencesReceived?.referencesList.map(
      (reference) => reference.fromUserId
    ) ?? []
  );

  return (
    <UserSection title="References">
      {referencesReceivedError && (
        <Alert severity="error">{referencesReceivedError.message}</Alert>
      )}
      {isReferencesReceivedLoading || isReferenceUsersLoading ? (
        <CircularProgress />
      ) : (
        referencesReceived && (
          <List className={classes.referencesList}>
            {referencesReceived.referencesList.map((reference, index) => {
              const author = referenceUsers?.get(reference.fromUserId);
              return author ? (
                <ReferenceListItem
                  key={`reference-${index}`}
                  author={author}
                  reference={reference}
                />
              ) : null;
            })}
          </List>
        )
      )}
    </UserSection>
  );
}
