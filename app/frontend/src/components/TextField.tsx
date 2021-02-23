import {
  makeStyles,
  OutlinedTextFieldProps,
  TextField as MuiTextField,
} from "@material-ui/core";
import classNames from "classnames";
import React from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "block",
    "& .MuiOutlinedInput-root": {
      borderRadius: theme.shape.borderRadius,
    },
  },
  multiline: {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.grey[900],
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.grey[500],
    },
  },
}));

interface TextfieldProps extends OutlinedTextFieldProps {
  id: string;
}

export default function TextField({
  id,
  className,
  ...otherProps
}: Omit<TextfieldProps, "variant">) {
  const classes = useStyles();
  return (
    <MuiTextField
      {...otherProps}
      id={id}
      variant="outlined"
      className={classNames(classes.root, className, {
        [classes.multiline]: otherProps.multiline,
      })}
    />
  );
}
