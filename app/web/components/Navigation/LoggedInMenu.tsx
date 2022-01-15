import { Button } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import Avatar from "components/Avatar";
import { MenuIcon } from "components/Icons";
import Menu from "components/Menu";
import useCurrentUser from "features/userQueries/useCurrentUser";
import React, { ReactNode } from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  menu: {
    boxShadow: theme.shadows[1],
    minWidth: "12rem",
  },
  menuPopover: {
    transform: "translateY(1rem)",
  },
  menuBtn: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    border: `1px solid ${grey[300]}`,
    borderRadius: 999,
    backgroundColor: grey[200],
    padding: theme.spacing(1),
    transition: `${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
    "&:hover": {
      opacity: 0.8,
      backgroundColor: grey[300],
    },
  },
  avatar: {
    height: "2rem",
    width: "2rem",
  },
}));

export default function LoggedInMenu({
  menuOpen,
  setMenuOpen,
  children,
}: {
  menuOpen: boolean;
  setMenuOpen: (func: (open: boolean) => boolean) => void;
  children: ReactNode;
}) {
  const classes = useStyles();
  const menuRef = React.useRef<HTMLButtonElement>(null);
  const { data: user } = useCurrentUser();

  return (
    <>
      <Button
        aria-controls="navigation-menu"
        aria-haspopup="true"
        className={classes.menuBtn}
        onClick={() => setMenuOpen((prevMenuOpen: boolean) => !prevMenuOpen)}
        ref={menuRef}
      >
        <MenuIcon />
        <Avatar user={user} className={classes.avatar} isProfileLink={false} />
      </Button>
      <Menu
        id="navigation-menu"
        open={menuOpen}
        anchorEl={menuRef.current}
        onClose={() => setMenuOpen(() => false)}
        classes={{
          paper: classes.menu,
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        getContentAnchorEl={null}
        PopoverClasses={{
          root: classes.menuPopover,
        }}
      >
        {children}
      </Menu>
    </>
  );
}
