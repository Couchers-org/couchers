import { TERMS_OF_SERVICE } from "features/auth/constants";
import { Link } from "react-router-dom";
import { tosRoute } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.primary.main,
    textDecoration: "underline",
  },
}));

export default function TOSLink() {
  const classes = useStyles();
  return (
    <Link className={classes.root} to={tosRoute} target="_blank">
      {TERMS_OF_SERVICE}
    </Link>
  );
}
