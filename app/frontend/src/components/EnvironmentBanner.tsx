import { makeStyles, useMediaQuery, useTheme } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme) => ({
  banner: {
    position: "fixed",
    top: 2,
    left: 2,
    zIndex: 5000,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 5,
    paddingRight: 5,
    opacity: 0.8,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.error.main,
    color: theme.palette.common.white,
    pointerEvents: "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
}));

export function EnvironmentBanner() {
  const theme = useTheme();
  const classes = useStyles();
  const isBelowSm = useMediaQuery(theme.breakpoints.down("sm"));

  if (process.env.REACT_APP_COUCHERS_ENV === "prod") {
    return null;
  } else {
    return (
      <div className={classes.banner}>
        This is a{" "}
        {process.env.REACT_APP_COUCHERS_ENV === "preview"
          ? "preview"
          : "development"}{" "}
        build of the app.
        {!isBelowSm && " It uses a separate database to the production app."}
      </div>
    );
  }
}
