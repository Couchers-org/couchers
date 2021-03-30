import {
  IconButton,
  IconButtonProps,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React, { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  body: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.up("md")]: {
      flexDirection: "row",
    },
  },
  linkActive: { color: theme.palette.primary.main },
  button: {
    color: "inherit",
    marginBottom: theme.spacing(0.5),
  },
  link: {
    textDecoration: "none",
    color: "inherit",
  },
  label: {
    textAlign: "center",
    [theme.breakpoints.up("md")]: {
      textAlign: "left",
    },
  },
}));

interface CircularIconButtonProps extends IconButtonProps {
  children?: ReactNode;
  label: string;
  id: string;
  linkTo?: string;
  disabled?: boolean;
  exact?: boolean;
}

export default function CircularIconButton({
  children,
  id,
  label,
  linkTo,
  disabled = false,
  exact,
  ...otherProps
}: CircularIconButtonProps) {
  const classes = useStyles();

  const body = (
    <div className={classes.body}>
      <IconButton
        {...otherProps}
        aria-labelledby={id}
        className={classes.button}
        children={children}
        disabled={disabled}
      />
      <Typography id={id} variant="caption" className={classes.label}>
        {label}
      </Typography>
    </div>
  );

  return linkTo ? (
    <NavLink
      to={linkTo}
      className={classes.link}
      activeClassName={classes.linkActive}
      exact={exact}
    >
      {body}
    </NavLink>
  ) : (
    body
  );
}
