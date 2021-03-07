import { ListItem, makeStyles } from "@material-ui/core";
import Pill from "components/Pill";
import TextBody from "components/TextBody";
import UserSummary from "components/UserSummary";
import { referenceBadgeLabel } from "features/constants";
import { Reference, User } from "pb/api_pb";
import React from "react";
import { dateTimeFormatter, timestamp2Date } from "utils/date";

const useStyles = makeStyles((theme) => ({
  badgesContainer: {
    "& > * + *": {
      marginBlockStart: theme.spacing(2),
    },
    display: "flex",
    flexDirection: "column",
    marginInlineEnd: theme.spacing(2),
    minWidth: theme.spacing(9),
  },
  listItem: {
    "& > * + *": {
      marginBlockStart: theme.spacing(2),
    },
    alignItems: "flex-start",
    borderBlockEnd: `${theme.typography.pxToRem(1)} solid ${
      theme.palette.grey[300]
    }`,
    flexDirection: "column",
  },
  referenceBodyContainer: {
    display: "flex",
    width: "100%",
  },
}));

export const REFERENCE_LIST_ITEM_TEST_ID = "reference-list-item";

interface ReferenceListItemProps {
  isReceived: boolean;
  user: User.AsObject;
  reference: Reference.AsObject;
}

export default function ReferenceListItem({
  isReceived,
  user,
  reference,
}: ReferenceListItemProps) {
  const classes = useStyles();

  return (
    <ListItem
      className={classes.listItem}
      data-testid={REFERENCE_LIST_ITEM_TEST_ID}
    >
      <UserSummary user={user} />
      <div className={classes.referenceBodyContainer}>
        <div className={classes.badgesContainer}>
          {isReceived && (
            <Pill variant="rounded">
              {referenceBadgeLabel[reference.referenceType]}
            </Pill>
          )}
          {reference.writtenTime && (
            <Pill variant="rounded">
              {dateTimeFormatter.format(timestamp2Date(reference.writtenTime))}
            </Pill>
          )}
        </div>
        <TextBody>{reference.text}</TextBody>
      </div>
    </ListItem>
  );
}
