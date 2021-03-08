import { makeStyles, Typography } from "@material-ui/core";
import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { baseRoute, profileRoute } from "../../routes";

const useStyles = makeStyles((theme) => ({
  link: {
    alignItems: "center",
    color: theme.palette.text.secondary,
    display: "flex",
    flex: "1",
    flexDirection: "column",
    fontSize: "2rem",
    maxWidth: theme.spacing(21),
    padding: theme.spacing(1, 1.5),
    textDecoration: "none",
    transition: theme.transitions.create(["color", "padding-top"], {
      duration: theme.transitions.duration.short,
    }),
  },
  selected: {
    color: theme.palette.secondary.dark,
  },
}));

export default function NavButton({
  route,
  label,
  children,
}: {
  route: string;
  label: string;
  children: ReactNode;
}) {
  const classes = useStyles();
  return (
    <NavLink
      activeClassName={classes.selected}
      exact={route === baseRoute || route === profileRoute}
      to={route}
      className={classes.link}
    >
      {children}
      <Typography variant="caption" noWrap>
        {label}
      </Typography>
    </NavLink>
  );
}
