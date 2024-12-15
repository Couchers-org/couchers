import { Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import classNames from "classnames";

import TextBody from "./TextBody";

const useStyles = makeStyles((theme) => ({
  label: {
    margin: 0,
    marginInlineEnd: theme.spacing(1),
  },
  root: {
    display: "flex",
    marginTop: theme.spacing(0.5),
    alignItems: "flex-start", // Ensures the label aligns with the top of multi-line text
  },
  flexItem: {
    flex: "1 1 50%",
    display: "flex",
    alignItems: "center",
  },
}));

export interface LabelAndTextProps {
  label: string;
  text: string | React.ReactNode;
}

export default function LabelAndText({ label, text }: LabelAndTextProps) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography
        variant="h3"
        className={classNames(classes.label, classes.flexItem)}
      >
        {label}
      </Typography>
      <TextBody className={classes.flexItem}>{text}</TextBody>
    </div>
  );
}
