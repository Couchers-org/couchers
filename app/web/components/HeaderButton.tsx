import { IconButton, IconButtonProps } from "@mui/material";
import React, { ReactNode } from "react";

interface HeaderButtonProps extends IconButtonProps {
  children?: ReactNode;
  onClick: () => void;
}

const HeaderButton = React.forwardRef<HTMLButtonElement, HeaderButtonProps>(
  (props, ref) => {
    const { className, children, onClick, ...otherProps } = props;

    return (
      <IconButton
        {...otherProps}
        onClick={onClick}
        className={className}
        size="large"
        ref={ref}
        sx={{ borderRadius: "50%", boxShadow: "0px 0px 4px" }}
      >
        {children}
      </IconButton>
    );
  },
);

HeaderButton.displayName = "HeaderButton";

export default HeaderButton;
