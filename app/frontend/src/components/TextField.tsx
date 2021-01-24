import {
  makeStyles,
  OutlinedTextFieldProps,
  TextField as MuiTextField,
  useMediaQuery,
  useTheme,
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
  minWidth: {
    "& .MuiOutlinedInput-root": {
      minWidth: 400,
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

interface TextFieldProps extends Omit<OutlinedTextFieldProps, "variant"> {
  minWidth?: boolean;
}

export default function TextField({
  className,
  minWidth = true,
  ...otherProps
}: TextFieldProps) {
  const classes = useStyles();
  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up("sm"));
  return (
    <MuiTextField
      {...otherProps}
      variant="outlined"
      fullWidth={!isLarge}
      className={classNames(classes.root, className, {
        [classes.multiline]: otherProps.multiline,
        [classes.minWidth]: minWidth,
      })}
    />
  );
}
