import {
  Menu as MuiMenu,
  MenuItem as MuiMenuItem,
  MenuItemProps as MuiMenuItemProps,
  MenuProps,
  styled,
} from "@mui/material";
import React from "react";

interface MenuItemProps extends Omit<MuiMenuItemProps, "className"> {
  hasNotification?: boolean;
  hasBottomDivider?: boolean;
}

const StyledMenuItem = styled(MuiMenuItem, {
  shouldForwardProp: (prop) =>
    prop !== "hasNotification" && prop !== "hasBottomDivider",
})<MenuItemProps>(({ theme, hasBottomDivider, hasNotification }) => ({
  paddingInline: theme.spacing(2),
  ...(hasNotification && {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  }),
  ...(hasBottomDivider && {
    borderBottom: `1px solid ${theme.palette.divider}`,
  }),
}));

export default function Menu(props: Omit<MenuProps, "className">) {
  return <MuiMenu {...props} />;
}

//forwarding ref is necessary because Menu
//injects refs into MenuItems

export const MenuItem = React.forwardRef(
  (props: MenuItemProps, ref: React.ForwardedRef<HTMLLIElement>) => {
    const { hasNotification, hasBottomDivider, ...restProps } = props;

    return (
      <StyledMenuItem
        {...restProps}
        hasNotification={hasNotification}
        hasBottomDivider={hasBottomDivider}
        ref={ref}
      />
    );
  },
);

MenuItem.displayName = "MenuItem";
