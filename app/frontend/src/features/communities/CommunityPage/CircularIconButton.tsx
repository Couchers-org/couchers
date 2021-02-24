import {
  IconButton,
  IconButtonProps,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React, { ReactNode } from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  button: {
    borderRadius: "50%",
    boxShadow: "0 2px 4px",
    marginBottom: theme.spacing(0.5),
    "&:active": {
      transform: "translateY(1px)",
      boxShadow: "0 1px 4px",
    },
  },
}));

interface CircularIconButtonProps extends IconButtonProps {
  children?: ReactNode;
  label: string;
  id: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function CircularIconButton({
  children,
  onClick,
  id,
  label,
  disabled = false,
  ...otherProps
}: CircularIconButtonProps) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <IconButton
        {...otherProps}
        id={id}
        onClick={onClick}
        className={classes.button}
        children={children}
        disabled={disabled}
      />
      <Typography variant="caption" align="center">
        <label htmlFor={id}>{label}</label>
      </Typography>
    </div>
  );
}
