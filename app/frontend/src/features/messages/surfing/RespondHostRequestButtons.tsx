import React from "react";
import { HostRequest } from "../../../pb/requests_pb";
import { Box, BoxProps, makeStyles } from "@material-ui/core";
import Button from "../../../components/Button";
import classNames from "classnames";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-around",
    alignContent: "center",
  },
  button: {
    display: "block",
  },
}));

interface RespondHostRequestButtonsProps extends BoxProps {
  hostRequest?: HostRequest.AsObject;
}

export default function RespondHostRequestButtons({
  hostRequest,
  ...otherProps
}: RespondHostRequestButtonsProps) {
  const classes = useStyles();

  return (
    <Box
      {...otherProps}
      className={classNames(classes.root, otherProps.className)}
    >
      {!hostRequest && (
        <Button color="primary" loading className={classes.button} />
      )}
    </Box>
  );
}
