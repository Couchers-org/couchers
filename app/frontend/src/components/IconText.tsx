import { makeStyles } from "@material-ui/core";
import { OverridableComponent } from "@material-ui/core/OverridableComponent";
import { SvgIconTypeMap } from "@material-ui/core/SvgIcon";
import React from "react";

import TextBody from "./TextBody";

const useStyles = makeStyles((theme) => ({
  root: {
    alignItems: "center",
    display: "flex",
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  label: {
    marginInlineStart: theme.spacing(1),
  },
}));

interface IconTextProps {
  icon: OverridableComponent<SvgIconTypeMap<{}, "svg">>;
  text: string;
}

export default function IconText({ icon, text }: IconTextProps) {
  const classes = useStyles();
  const Icon = icon;
  return (
    <div className={classes.root}>
      <Icon />
      <TextBody className={classes.label}>{text}</TextBody>
    </div>
  );
}
