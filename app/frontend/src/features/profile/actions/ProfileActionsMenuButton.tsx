import Button from "components/Button";
import Menu, { MenuItem } from "components/Menu";
import { useRef, useState } from "react";

import {
  MORE_PROFILE_ACTIONS,
  MORE_PROFILE_ACTIONS_A11Y_TEXT,
  REPORT_USER,
} from "../constants";

export const MORE_PROFILE_ACTIONS_MENU_ID = "more-profile-actions-menu";

export default function ProfileActionsMenuButton() {
  const [isOpen, setIsOpen] = useState({
    report: false,
    menu: false,
  });
  const menuAnchor = useRef<HTMLButtonElement>(null);

  const handleClick = (item: keyof typeof isOpen) => () => {
    //close the menu if a menu item was selected
    if (item !== "menu") {
      setIsOpen((prevState) => ({ ...prevState, [item]: true, menu: false }));
    } else {
      setIsOpen((prevState) => ({ ...prevState, menu: true }));
    }
  };

  const handleClose = (item: keyof typeof isOpen) => () => {
    setIsOpen((prevState) => ({ ...prevState, [item]: false }));
  };

  return (
    <>
      <Button
        aria-controls={MORE_PROFILE_ACTIONS_MENU_ID}
        aria-label={MORE_PROFILE_ACTIONS_A11Y_TEXT}
        innerRef={menuAnchor}
        onClick={handleClick("menu")}
      >
        {MORE_PROFILE_ACTIONS}
      </Button>
      <Menu
        anchorEl={menuAnchor.current}
        id={MORE_PROFILE_ACTIONS_MENU_ID}
        onClose={handleClose("menu")}
        open={isOpen.menu}
      >
        <MenuItem onClick={handleClick("report")}>{REPORT_USER}</MenuItem>
      </Menu>
    </>
  );
}
