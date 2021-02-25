import { makeStyles } from "@material-ui/core";
import { SvgIconProps } from "@material-ui/core/SvgIcon";
import React from "react";

import TextBody from "./TextBody";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    alignItems: "center",
  },
  label: {
    marginInlineStart: theme.spacing(1),
  },
}));

interface IconTextProps {
  icon: React.ReactElement<SvgIconProps>;
  text: string;
}

export default function IconText({ icon, text }: IconTextProps) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      {icon}
      <TextBody className={classes.label}>
        {text}
      </TextBody>
    </div>
  );
}