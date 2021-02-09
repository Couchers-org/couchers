import { Box, makeStyles } from "@material-ui/core";
import classNames from "classnames";
import React from "react";

import { hostingStatusLabels } from "../features/profile/constants";
import { User } from "../pb/api_pb";
import { CouchIcon } from "./Icons";
import TextBody from "./TextBody";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    alignItems: "center",
  },
  hostStatusLabel: {
    marginInlineStart: theme.spacing(1),
  },
}));

interface HostStatusProps {
  user: User.AsObject;
  className?: string;
}

export default function HostStatus({ user, className }: HostStatusProps) {
  const classes = useStyles();
  return (
    <Box className={classNames(className, classes.root)}>
      <CouchIcon />
      <TextBody className={classes.hostStatusLabel}>
        {hostingStatusLabels[user.hostingStatus]}
      </TextBody>
    </Box>
  );
}
