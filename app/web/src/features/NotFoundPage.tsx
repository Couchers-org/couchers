import HtmlMeta from "components/HtmlMeta";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { DO_YOU_WANT, GO_HOME, NOT_FOUND } from "features/constants";
import Graphic from "resources/404graphic.png";
import { baseRoute } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles({
  graphic: {
    height: "75%",
    width: "75%",
  },
  root: {
    left: "50%",
    position: "absolute",
    textAlign: "center",
    top: "50%",
    transform: "translate(-50%,-50%)",
  },
});

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
        ></img>
        <TextBody>{NOT_FOUND}</TextBody>
        {DO_YOU_WANT}
        <StyledLink to={baseRoute}>{GO_HOME}</StyledLink>
      </div>
    </>
  );
}
