import { Box, makeStyles, Typography } from "@material-ui/core";
import React, { ReactNode } from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    alignItems: "center",
  },
  text: {
    margin: 0,
    marginInlineStart: theme.spacing(1),
  },
}));

export default function SectionTitle({
  icon,
  children,
}: {
  icon: ReactNode;
  children: string;
}) {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Box>{icon}</Box>
      <Typography variant="h2" className={classes.text}>
        {children}
      </Typography>
    </Box>
  );
}
