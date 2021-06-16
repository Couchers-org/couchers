import { Select, Typography } from "@material-ui/core";
import Button from "components/Button";
import { AddIcon } from "components/Icons";
import { MenuItem } from "components/Menu";
import { REFERENCES } from "features/constants";
import {
  REFERENCES_FILTER_A11Y_LABEL,
  referencesFilterLabels,
  WRITE_REFERENCE,
} from "features/profile/constants";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { User } from "proto/api_pb";
import { ReferenceType } from "proto/references_pb";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { leaveReferenceBaseRoute, referenceTypeRoute } from "routes";
import makeStyles from "utils/makeStyles";

import ReferencesGivenList from "./ReferencesGivenList";
import ReferencesReceivedList from "./ReferencesReceivedList";

const useStyles = makeStyles((theme) => ({
  button: {
    display: "block",
    flexShrink: 0,
    marginInlineStart: theme.spacing(1),
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  buttonContainer: {
    "& > button": {
      marginInline: theme.spacing(2),
    },
    display: "flex",
    width: "100%",
    justifyContent: "flex-end",
    marginInlineEnd: theme.spacing(2),
  },
  referencesContainer: {
    display: "flex",
    flexFlow: "row wrap",
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
  referenceTypeSelect: {
    paddingInlineStart: theme.spacing(1),
  },
}));

export type ReferenceTypeState = keyof typeof referencesFilterLabels;

export default function References() {
  const classes = useStyles();
  const [referenceType, setReferenceType] = useState<ReferenceTypeState>("all");
  const { userId, friends } = useProfileUser();
  const { data: availableReferences } = useListAvailableReferences(userId);

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setReferenceType(event.target.value as ReferenceTypeState);
  };

  return (
    <div className={classes.referencesContainer}>
      <div className={classes.headerContainer}>
        <Typography className={classes.header} variant="h1">
          {REFERENCES}
        </Typography>
        {availableReferences?.canWriteFriendReference &&
          friends === User.FriendshipStatus.FRIENDS && (
            <div className={classes.buttonContainer}>
              <Link
                to={{
                  pathname: `${leaveReferenceBaseRoute}/${
                    referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
                  }/${userId}`,
                }}
              >
                <Button startIcon={<AddIcon />}>{WRITE_REFERENCE}</Button>
              </Link>
            </div>
          )}
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
      {referenceType !== "given" ? (
        <ReferencesReceivedList referenceType={referenceType} />
      ) : (
        <ReferencesGivenList />
      )}
    </div>
  );
}
