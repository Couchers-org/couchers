import {
  Card,
  CardContent,
  CardProps,
  makeStyles,
  Typography,
} from "@material-ui/core";
import classNames from "classnames";
import React from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
  },
  title: {
    fontSize: "1.5rem",
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
    <Card className={classNames(className, classes.root)}>
      <CardContent>
        <Typography variant="h2" className={classes.title}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}
