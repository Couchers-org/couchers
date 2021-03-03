import { ListItem, makeStyles } from "@material-ui/core";
import Pill from "components/Pill";
import TextBody from "components/TextBody";
import UserSummary from "components/UserSummary";
import { Reference, ReferenceType, User } from "pb/api_pb";
import React from "react";
import { dateTimeFormatter, timestamp2Date } from "utils/date";

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

const useStyles = makeStyles((theme) => ({
  badgesContainer: {
    display: "flex",
    flexDirection: "column",
    marginInlineEnd: theme.spacing(2),
    minWidth: theme.spacing(9),
    "& > * + *": {
      marginBlockStart: theme.spacing(2),
    },
  },
  listItem: {
    alignItems: "flex-start",
    borderBlockEnd: `${theme.typography.pxToRem(1)} solid ${
      theme.palette.grey[300]
    }`,
    flexDirection: "column",
    "& > * + *": {
      marginBlockStart: theme.spacing(2),
    },
  },
  referenceBodyContainer: {
    display: "flex",
    width: "100%",
  },
}));

interface ReferenceListItemProps {
  user: User.AsObject;
  reference: Reference.AsObject;
}

export default function ReferenceListItem({
  user,
  reference,
}: ReferenceListItemProps) {
  const classes = useStyles();

  return (
    <ListItem className={classes.listItem}>
      <UserSummary user={user} />
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
