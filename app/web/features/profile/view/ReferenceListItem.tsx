import { ListItem } from "@material-ui/core";
import Pill from "components/Pill";
import TextBody from "components/TextBody";
import UserSummary from "components/UserSummary";
import { referenceBadgeLabel } from "features/profile/constants";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { User } from "proto/api_pb";
import { Reference } from "proto/references_pb";
import { dateTimeFormatter, timestamp2Date } from "utils/date";
import makeStyles from "utils/makeStyles";

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
  referenceText: {
    whiteSpace: "pre-wrap",
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
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, COMMUNITIES]);
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
              {referenceBadgeLabel(t)[reference.referenceType]}
            </Pill>
          )}
          {reference.writtenTime && (
            <Pill variant="rounded">
              {dateTimeFormatter(locale).format(
                timestamp2Date(reference.writtenTime)
              )}
            </Pill>
          )}
        </div>
        <TextBody className={classes.referenceText}>{reference.text}</TextBody>
      </div>
    </ListItem>
  );
}
