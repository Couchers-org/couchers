import {
  makeStyles,
  CircularProgress,
  CircularProgressProps,
} from "@material-ui/core";
import React from "react";

const useStyles = makeStyles({
  root: {},
});

export default (props: CircularProgressProps) => {
  const styles = useStyles();
  //as any because TextFieldProps is union type
  return (
    <CircularProgress
      {...props}
      className={`${styles.root} ${props.className}`}
    ></CircularProgress>
  );
};
