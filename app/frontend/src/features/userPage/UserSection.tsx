import { Box, CardProps, makeStyles, Typography } from "@material-ui/core";
import classNames from "classnames";
import React from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingBlockStart: theme.spacing(1),
    paddingBlockEnd: theme.spacing(1),
    borderBlockStart: `${theme.typography.pxToRem(1)} solid ${
      theme.palette.grey[500]
    }`,
    "& > * + *": {
      marginBlockStart: theme.spacing(1),
    },
  },
}));

interface UserSectionProps extends CardProps {
  title: string;
  className?: string;
}

export default function UserSection({
  title,
  className,
  children,
}: UserSectionProps) {
  const classes = useStyles();
  return (
    <Box className={classNames(className, classes.root)}>
      <Typography variant="h2">{title}</Typography>
      {children}
    </Box>
  );
}
