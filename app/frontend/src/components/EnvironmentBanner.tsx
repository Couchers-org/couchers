import { makeStyles } from "@material-ui/core";
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
  hideOnMobile: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
}));

export function EnvironmentBanner() {
  const classes = useStyles();
  if (process.env.REACT_APP_COUCHERS_ENV === "prod") {
    return <></>;
  } else {
    return (
      <div className={classes.banner}>
        This is a{" "}
        {process.env.REACT_APP_COUCHERS_ENV === "preview"
          ? "preview"
          : "development"}{" "}
        build of the app.
        <span className={classes.hideOnMobile}>
          {" "}
          It uses a separate database to the production app.
        </span>
      </div>
    );
  }
}
