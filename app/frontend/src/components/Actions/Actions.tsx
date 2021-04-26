import { ReactNode } from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    marginTop: theme.spacing(2),
    justifyContent: "flex-end",
    padding: theme.spacing(1),
    "& :not(:first-child)": {
      marginInlineStart: theme.spacing(1),
    },
  },
}));

export default function Actions({ children }: { children: ReactNode }) {
  const classes = useStyles();
  return <div className={classes.root}>{children}</div>;
}
