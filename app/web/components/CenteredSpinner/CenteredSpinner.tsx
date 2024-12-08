import { CircularProgress } from "@mui/material";
import makeStyles from "utils/makeStyles";

interface CenteredSpinnerProps {
  minHeight?: string;
}

interface StyleProps {
  minHeight: string;
}

const useStyles = makeStyles((theme) => ({
  loader: {
    //minimal-effort reduction of layout shifting
    minHeight: (props: StyleProps) => props.minHeight,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBlockStart: theme.spacing(6),
  },
}));

export default function CenteredSpinner({
  minHeight = "auto",
}: CenteredSpinnerProps) {
  const classes = useStyles({ minHeight });

  return (
    <div className={classes.loader}>
      <CircularProgress />
    </div>
  );
}
