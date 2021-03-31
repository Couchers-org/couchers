import { makeStyles } from "@material-ui/core";
import classNames from "classnames";
import Button from "components/Button";
import { PersonAddIcon } from "components/Icons";
import { PENDING_REQUEST_SENT } from "features/connections/constants";
import React from "react";

const useStyles = makeStyles((theme) => ({
  disabledButton: {
    backgroundColor: theme.palette.grey[100],
  },
}));

export default function PendingFriendRequestSent() {
  const classes = useStyles();
  return (
    <Button
      startIcon={<PersonAddIcon />}
      className={classNames({ [classes.disabledButton]: true })}
      disabled={true}
    >
      {PENDING_REQUEST_SENT}
    </Button>
  );
}
