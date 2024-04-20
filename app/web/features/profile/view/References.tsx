import { Select, Typography } from "@material-ui/core";
import Button from "components/Button";
import { AddIcon } from "components/Icons";
import { MenuItem } from "components/Menu";
import { referencesFilterLabels } from "features/profile/constants";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import Link from "next/link";
import { User } from "proto/api_pb";
import { ReferenceType } from "proto/references_pb";
import React, { useState } from "react";
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

export type ReferenceTypeState = keyof ReturnType<
  typeof referencesFilterLabels
>;

export default function References() {
  const { t } = useTranslation([GLOBAL, PROFILE]);
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
          {t("profile:heading.references")}
        </Typography>
        {availableReferences?.canWriteFriendReference &&
          friends === User.FriendshipStatus.FRIENDS && (
            <div className={classes.buttonContainer}>
              <Link
                href={{
                  pathname: `${leaveReferenceBaseRoute}/${
                    referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
                  }/${userId}`,
                }}
                passHref
              >
                <Button startIcon={<AddIcon />} component="a">
                  {t("profile:write_reference")}
                </Button>
              </Link>
            </div>
          )}
        <Select
          classes={{ select: classes.referenceTypeSelect }}
          displayEmpty
          inputProps={{
            "aria-label": t("profile:references_filter_a11y_label"),
          }}
          onChange={handleChange}
          value={referenceType}
        >
          {Object.entries(referencesFilterLabels(t)).map(([key, label]) => {
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
