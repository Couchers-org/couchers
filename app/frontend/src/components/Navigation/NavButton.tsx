import { makeStyles, Typography } from "@material-ui/core";
import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  link: {
    transition: theme.transitions.create(["color", "padding-top"], {
      duration: theme.transitions.duration.short,
    }),
    padding: theme.spacing(1, 1.5),
    maxWidth: theme.spacing(21),
    color: theme.palette.text.secondary,
    flex: "1",
    fontSize: "2rem",
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
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
      exact={route === "/"}
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
