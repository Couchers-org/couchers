import { makeStyles } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import React from "react";

import { hostingStatusLabels } from "../../features/profile/constants";
import { HostingStatus as THostingStatus } from "../../pb/api_pb";
import { CouchIcon } from "../Icons";
import IconText from "../IconText";

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
        <IconText
          icon={CouchIcon}
          text={hostingStatusLabels.get(hostingStatus)}
        />
      ) : (
        <Skeleton width={100} />
      )}
    </div>
  );
}
