import {
  makeStyles,
  Menu as MuiMenu,
  MenuItem as MuiMenuItem,
  MenuItemProps,
  MenuProps,
} from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme) => ({
  item: {
    paddingInline: theme.spacing(2),
  },
}));

export default function Menu(props: Omit<MenuProps, "className">) {
  const classes = useStyles();
  return <MuiMenu {...props} />;
}

//forwarding ref is necessary because Menu
//injects refs into MenuItems
export const MenuItem = React.forwardRef(
  (
    props: Omit<MenuItemProps, "className">,
    ref: React.ForwardedRef<HTMLLIElement>
  ) => {
    const classes = useStyles();
    return (
      <MuiMenuItem
        {...props}
        className={classes.item}
        button={true}
        ref={ref}
      />
    );
  }
);
