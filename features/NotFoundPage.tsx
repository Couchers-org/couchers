import { Typography } from "@material-ui/core";
import HtmlMeta from "components/HtmlMeta";
import StyledLink from "components/StyledLink";
import { DO_YOU_WANT, GO_HOME, NOT_FOUND } from "features/constants";
import Graphic from "resources/404graphic.png";
import { baseRoute } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  graphic: {
    height: "50%",
    width: "50%",
    margin: theme.spacing(8, 0),
  },
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
}));

export default function NotFoundPage() {
  const classes = useStyles();

  return (
    <>
      <HtmlMeta title={NOT_FOUND} />
      <div className={classes.root}>
        <img
          src={Graphic}
          alt="404 Error: Resource Not Found"
          className={classes.graphic}
        />
        <Typography>{NOT_FOUND}</Typography>
        <Typography>
          {DO_YOU_WANT}
          <StyledLink to={baseRoute}>{GO_HOME}</StyledLink>
        </Typography>
      </div>
    </>
  );
}
