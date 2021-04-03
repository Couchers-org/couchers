import { makeStyles, Typography, TypographyProps } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import { baseRoute, userRoute } from "routes";

const useStyles = makeStyles((theme) => ({
  link: {
    color: theme.palette.text.secondary,
    display: "flex",
    flex: "1",
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
  label: {
    alignSelf: "center",
    marginTop: 0,
  },
}));

interface NavButtonProps {
  route: string;
  label: string;
  labelVariant: Exclude<TypographyProps["variant"], undefined>;
}

export default function NavButton({
  route,
  label,
  labelVariant,
}: NavButtonProps) {
  const classes = useStyles();
  return (
    <NavLink
      activeClassName={classes.selected}
      exact={route === baseRoute || route === userRoute}
      to={route}
      className={classes.link}
    >
      <Typography variant={labelVariant} className={classes.label} noWrap>
        {label}
      </Typography>
    </NavLink>
  );
}

NavButton.defaultProps = {
  labelVariant: "h3",
};
