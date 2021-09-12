import classNames from "classnames";
import React from "react";
import makeStyles from "utils/makeStyles";

export const usePageHeaderStyles = makeStyles((theme) => ({
  root: {
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "8rem",
    width: "100%",
    marginBottom: theme.spacing(1),
    [theme.breakpoints.down("md")]: {
      //break out of page margins
      left: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
      position: "relative",
      right: "50%",
      width: "100vw",
    },
    [theme.breakpoints.up("md")]: {
      height: "16rem",
      marginTop: theme.spacing(-2),
    },
  },
}));

export default function PageHeaderImage({
  imageUrl,
  className,
}: {
  imageUrl: string;
  className?: string;
}) {
  const classes = usePageHeaderStyles();

  return (
    <div
      className={classNames(classes.root, className)}
      style={{ backgroundImage: `url(${imageUrl})` }}
    />
  );
}
