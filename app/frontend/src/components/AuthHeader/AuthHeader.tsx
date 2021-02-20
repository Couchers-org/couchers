import { Box, Divider, makeStyles, Typography } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme) => ({
  header: {
    marginBottom: theme.spacing(4),
    position: "relative",
  },
  pageTitle: {},
  divider: {
    border: "3px solid rgba(246, 138, 12, 0.7)",
    boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
    position: "absolute",
    width: "100%",
    left: theme.spacing(1),
  },
}));

export default function AuthHeader(props: { children: React.ReactNode }) {
  const classes = useStyles();

  return (
    <Box className={classes.header}>
      <Typography className={classes.pageTitle} variant="h1">
        {props.children}
      </Typography>
      <Divider className={classes.divider} />
    </Box>
  );
}
