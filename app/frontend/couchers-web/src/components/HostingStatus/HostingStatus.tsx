import { Skeleton } from "@material-ui/lab";
import { CouchIcon } from "components/Icons";
import IconText from "components/IconText";
import { HostingStatus as THostingStatus } from "couchers-core/src/proto/api_pb";
import { hostingStatusLabels } from "features/profile/constants";
import React from "react";
import makeStyles from "utils/makeStyles";

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
