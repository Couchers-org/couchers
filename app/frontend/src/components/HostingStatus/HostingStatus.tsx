import { makeStyles } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { CouchIcon } from "components/Icons";
import IconText from "components/IconText";
import { hostingStatusLabels } from "features/profile/constants";
import { HostingStatus as THostingStatus } from "pb/api_pb";
import React from "react";

const useStyles = makeStyles({
  hostingAbilityContainer: {
    alignItems: "center",
    display: "flex",
  },
});

export interface HostingStatusProps {
  hostingStatus?: THostingStatus;
}

export default function HostingStatus({ hostingStatus }: HostingStatusProps) {
  const classes = useStyles();

  return (
    <div className={classes.hostingAbilityContainer}>
      {hostingStatus ? (
        <IconText icon={CouchIcon} text={hostingStatusLabels[hostingStatus]} />
      ) : (
        <Skeleton width={100} />
      )}
    </div>
  );
}
