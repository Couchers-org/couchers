import { Typography } from "@material-ui/core";
import { SIGN_UP_TOS_LINK_TEXT } from "features/auth/constants";
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
    <Link className={classes.root} to={tosRoute}>
      <Typography variant="body1">{SIGN_UP_TOS_LINK_TEXT}</Typography>
    </Link>
  );
}
