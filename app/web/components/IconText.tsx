import { Typography } from "@material-ui/core";
import { OverridableComponent } from "@material-ui/core/OverridableComponent";
import { SvgIconTypeMap } from "@material-ui/core/SvgIcon";
import React, { ReactNode } from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  label: {
    marginInlineStart: theme.spacing(1),
  },
  root: {
    alignItems: "center",
    display: "flex",
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
}));

interface IconTextProps {
  icon: OverridableComponent<SvgIconTypeMap<unknown, "svg">>;
  text: ReactNode;
}

export default function IconText({ icon, text }: IconTextProps) {
  const classes = useStyles();
  const Icon = icon;
  return (
    <div className={classes.root}>
      <Icon />
      {typeof text === "string" ? (
        <Typography className={classes.label}>{text}</Typography>
      ) : (
        <div className={classes.label}>{text}</div>
      )}
    </div>
  );
}
