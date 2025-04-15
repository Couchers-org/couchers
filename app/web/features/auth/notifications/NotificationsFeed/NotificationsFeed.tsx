import { Menu, MenuItem } from "@mui/material";

interface NotificationsFeedProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose?: () => void;
}

const NotificationsFeed = ({
  anchorEl,
  isOpen,
  onClose,
}: NotificationsFeedProps) => {
  return (
    <Menu
      id="notifications-menu"
      anchorEl={anchorEl}
      onClose={onClose}
      open={isOpen}
      MenuListProps={{
        "aria-labelledby": "notifications-feed-button",
      }}
    >
      <MenuItem>Stuff</MenuItem>
    </Menu>
  );
};

export default NotificationsFeed;
