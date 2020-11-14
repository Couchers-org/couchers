import {
  makeStyles,
  Button as MuiButton,
  ButtonProps,
  CircularProgress,
  Box,
} from "@material-ui/core";
import React from "react";
import classNames from "classnames";

const useStyles = makeStyles({
  root: {},
});

type AppButtonProps = ButtonProps & {
  loading?: boolean;
};

export default function Button({
  children,
  disabled,
  onClick,
  className,
  loading,
  ...otherProps
}: AppButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (onClick) {
      onClick(e);
    }
  };

  const classes = useStyles();
  return (
    <MuiButton
      {...otherProps}
      disabled={disabled ? true : loading}
      onClick={onClick ? handleClick : undefined}
      className={classNames(classes.root, className)}
    >
      {children}
      {loading && (
        <Box marginLeft="8px">
          <CircularProgress />
        </Box>
      )}
    </MuiButton>
  );
}
