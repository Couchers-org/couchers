import { CircularProgress } from "@material-ui/core";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  loader: {
    //minimal-effort reduction of layout shifting
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBlockStart: theme.spacing(6),
  },
}));

export default function FullPageLoader() {
  const classes = useStyles();

  return (
    <div className={classes.loader}>
      <CircularProgress />
    </div>
  );
}
