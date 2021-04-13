import { Typography, TypographyProps } from "@material-ui/core";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  link: {
    color: theme.palette.text.secondary,
    display: "flex",
    flex: "1",
    fontSize: "2rem",
    maxWidth: theme.spacing(21),
    padding: theme.spacing(1, 1.5),
    transition: theme.transitions.create(["color", "padding-top"], {
      duration: theme.transitions.duration.short,
    }),
  },
  label: {
    alignSelf: "center",
    marginTop: 0,
  },
}));

interface ExternalNavButtonProps {
  route: string;
  label: string;
  labelVariant?: Exclude<TypographyProps["variant"], undefined>;
}

export default function ExternalNavButton({
  route,
  label,
  labelVariant,
}: ExternalNavButtonProps) {
  const classes = useStyles();
  return (
    <a href={route} className={classes.link}>
      <Typography variant={labelVariant} className={classes.label} noWrap>
        {label}
      </Typography>
    </a>
  );
}
