import { Card, CardContent, makeStyles, Typography } from "@material-ui/core";
import classNames from "classnames";
import React, { ReactElement } from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
  },
  title: {
    fontSize: theme.typography.h4.fontSize,
  },
}));

interface UserSectionProps {
  title: string;
  content: ReactElement;
  className?: string;
}

export default function UserSection({
  content,
  title,
  className,
}: UserSectionProps) {
  const classes = useStyles();
  return (
    <Card className={classNames([className, classes.root])}>
      <CardContent>
        <Typography variant="h2" className={classes.title}>
          {title}
        </Typography>
        {content}
      </CardContent>
    </Card>
  );
}
