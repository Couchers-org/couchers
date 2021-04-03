import { Box, makeStyles } from "@material-ui/core";
import TextBody from "components/TextBody";
import React from "react";
import { Link } from "react-router-dom";
import Graphic from "resources/404graphic.png";

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
    <Box className={classes.root}>
      <img
        src={Graphic}
        alt="404 Error: Resource Not Found"
        className={classes.graphic}
      ></img>
      <TextBody>We couldn't find the URL or resource you requested</TextBody>
      <TextBody>
        Do you just want to <Link to={`/`}>go home</Link>?
      </TextBody>
    </Box>
  );
}
