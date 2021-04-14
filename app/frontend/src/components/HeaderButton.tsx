import { IconButton, IconButtonProps } from "@material-ui/core";
import React, { ReactNode } from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: "50%",
    boxShadow: "0px 0px 4px",
  },
}));

interface HeaderButtonProps extends IconButtonProps {
  children?: ReactNode;
  onClick: () => void;
}

export default function HeaderButton({
  children,
  onClick,
  ...otherProps
}: HeaderButtonProps) {
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
