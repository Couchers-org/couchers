import { makeStyles, TextField, TextFieldProps } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles({
  root: {
    display: "block",
  },
});

export default (props: TextFieldProps) => {
  const styles = useStyles();
  //as any because TextFieldProps is union type
  return (
    <TextField
      {...props}
      className={`${styles.root} ${props.className}`}
    ></TextField>
  );
};
