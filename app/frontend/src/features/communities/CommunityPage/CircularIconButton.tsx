import { IconButton, IconButtonProps, makeStyles } from "@material-ui/core";
import React, { ReactNode } from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: "50%",
    boxShadow: "0 2px 4px",
    "&:active": {
      transform: "translateY(1px)",
      boxShadow: "0 1px 4px",
    },
  },
}));

interface CircularIconButtonProps extends IconButtonProps {
  children?: ReactNode;
  onClick: () => void;
}

export default function CircularIconButton({
  children,
  onClick,
  ...otherProps
}: CircularIconButtonProps) {
  const classes = useStyles();
  return (
    <IconButton
      {...otherProps}
      onClick={onClick}
      className={classes.root}
      children={children}
    />
  );
}
