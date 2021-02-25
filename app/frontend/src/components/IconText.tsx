import { makeStyles } from "@material-ui/core";
import PropTypes from "prop-types";
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
  icon: PropTypes.element;
  text: string;
}

export default function IconText({ icon, text }: IconTextProps) {
  const classes = useStyles();
  const Icon = icon.statusImage;
  return (
    <div>
      <Icon />
      <TextBody className={classes.label}>
        {text}
      </TextBody>
    </div>
  );
}