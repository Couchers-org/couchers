import { IconButton, IconButtonProps } from "@mui/material";
import classNames from "classnames";
import React, { ReactNode } from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: "50%",
    boxShadow: "0px 0px 4px",
  },
}));

interface HeaderButtonProps extends IconButtonProps {
  children?: ReactNode;
  onClick: () => void;
}

const HeaderButton = React.forwardRef<HTMLButtonElement, HeaderButtonProps>(
  (props, ref) => {
    const { className, children, onClick, ...otherProps } = props;

    const classes = useStyles();
    return (
      <IconButton
        {...otherProps}
        onClick={onClick}
        className={classNames(classes.root, className)}
        size="large"
        ref={ref}
      >
        {children}
      </IconButton>
    );
  }
);

HeaderButton.displayName = "HeaderButton";

export default HeaderButton;
