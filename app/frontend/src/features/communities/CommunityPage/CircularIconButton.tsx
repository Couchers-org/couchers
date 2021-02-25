import {
  IconButton,
  IconButtonProps,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React, { ReactNode } from "react";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  body: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  link: {
    textDecoration: "none",
  },
  button: {
    marginBottom: theme.spacing(0.5),
  },
}));

interface CircularIconButtonProps extends IconButtonProps {
  children?: ReactNode;
  label: string;
  id: string;
  linkTo?: string;
  disabled?: boolean;
}

export default function CircularIconButton({
  children,
  id,
  label,
  linkTo,
  disabled = false,
  ...otherProps
}: CircularIconButtonProps) {
  const classes = useStyles();

  const body = (
    <div className={classes.body}>
      <IconButton
        {...otherProps}
        id={id}
        className={classes.button}
        children={children}
        disabled={disabled}
      />
      <Typography variant="caption" align="center">
        <label htmlFor={id}>{label}</label>
      </Typography>
    </div>
  );

  if (linkTo)
    return (
      <Link to={linkTo} className={classes.link}>
        {body}
      </Link>
    );
  else return body;
}
