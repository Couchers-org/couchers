import { Typography } from "@material-ui/core";
import { ReactNode } from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    alignItems: "center",
    display: "flex",
  },
  text: {
    margin: 0,
    marginInlineStart: theme.spacing(1),
  },
}));

interface SectionTitleProps {
  icon: ReactNode;
  children: string;
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export default function SectionTitle({
  icon,
  children,
  variant = "h1",
}: SectionTitleProps) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      {icon}
      <Typography variant={variant} className={classes.text}>
        {children}
      </Typography>
    </div>
  );
}
