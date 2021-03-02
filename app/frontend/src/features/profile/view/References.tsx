import {
  List,
  ListItem,
  makeStyles,
  Select,
  Typography,
} from "@material-ui/core";
import { Reference, ReferenceType, User } from "pb/api_pb";
import React, { useState } from "react";

import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { MenuItem } from "../../../components/Menu";
import Pill from "../../../components/Pill";
import TextBody from "../../../components/TextBody";
import UserSummary from "../../../components/UserSummary";
import { dateTimeFormatter, timestamp2Date } from "../../../utils/date";
import {
  NO_REFERENCES,
  REFERENCES,
  referencesFilterLabels,
  REFERENCES_FILTER_A11Y_LABEL,
} from "../../constants";
import useReferences from "./useReferences";

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
  noReferencesText: {
    marginBlockStart: theme.spacing(1),
  },
  referenceBodyContainer: {
    display: "flex",
    width: "100%",
  },
  referencesContainer: {
    display: "flex",
    flexFlow: "row wrap",
  },
  referencesList: {
    width: "100%",
    "& > *": {
      paddingBlockEnd: theme.spacing(3),
    },
  },
  referenceTypeSelect: {
    paddingInlineStart: theme.spacing(1),
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

export default function References({ user }: UserReferencesProps) {
  const classes = useStyles();
  const { error, isLoading, references, referenceUsers } = useReferences(user);
  const [referenceType, setReferenceType] = useState<"" | ReferenceType>("");

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setReferenceType(event.target.value as "" | ReferenceType);
  };

  const referencesToRender =
    referenceType === ""
      ? references
      : references?.filter(
          (reference) => reference.referenceType === referenceType
        );

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
            const value = key === "" ? key : Number(key);
            return (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            );
          })}
        </Select>
      </div>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : referencesToRender && referencesToRender.length > 0 ? (
        <List className={classes.referencesList}>
          {referencesToRender.map((reference) => {
            const author = referenceUsers?.get(reference.fromUserId);
            return author ? (
              <ReferenceListItem
                key={reference.referenceId}
                author={author}
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
    </div>
  );
}
