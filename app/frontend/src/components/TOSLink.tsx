import { Typography } from "@material-ui/core";
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

interface TOSLinkProps {
  inline?: boolean;
}

export default function TOSLink({ inline = false }: TOSLinkProps) {
  const classes = useStyles();
  return (
    <Link className={classes.root} to={tosRoute}>
      <Typography display={inline ? "inline" : "initial"} variant="body1">
        {TERMS_OF_SERVICE}
      </Typography>
    </Link>
  );
}
