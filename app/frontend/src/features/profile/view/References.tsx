import { Select, Typography } from "@material-ui/core";
import { MenuItem } from "components/Menu";
import { REFERENCES } from "features/constants";
import {
  REFERENCES_FILTER_A11Y_LABEL,
  referencesFilterLabels,
} from "features/profile/constants";
import React, { useState } from "react";
import makeStyles from "utils/makeStyles";

import ReferencesGivenList from "./ReferencesGivenList";
import ReferencesReceivedList from "./ReferencesReceivedList";

const useStyles = makeStyles((theme) => ({
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
      {referenceType !== "given" ? (
        <ReferencesReceivedList referenceType={referenceType} />
      ) : (
        <ReferencesGivenList />
      )}
    </div>
  );
}
