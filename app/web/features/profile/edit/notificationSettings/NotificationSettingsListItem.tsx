import { useState } from "react";
import {
  Collapse,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@material-ui/core";

import {
  SinglePersonIcon,
  CouchFilledIcon,
  ChatBubbleIcon,
  EventIcon,
  PenIcon,
  AccountSettingsIcon,
  AccountSecurityIcon,
  ExpandLessIcon,
  ExpandMoreIcon,
} from "components/Icons";
import makeStyles from "utils/makeStyles";
import NotificationSettingsSubListItem from "./NotificationSettingsSubListItem";
import { GroupAction } from "./EditNotificationSettingsPage";

interface NotificationSettingsListItemProps {
  items: GroupAction[];
  type: string;
}

const useStyles = makeStyles((theme) => ({
  descriptionText: {
    fontSize: theme.spacing(1.8),
    color: theme.palette.text.secondary,
  },
  listItem: {
    "&:hover": {
      backgroundColor: "transparent",
    },
    "&:not(:first-child)": {
      borderTop: `1px solid ${theme.palette.divider}`,
    },
  },
}));

const mapTypeToIcon: { [key: string]: JSX.Element } = {
  account_security: <AccountSecurityIcon fontSize="large" color="action" />,
  account_settings: <AccountSettingsIcon fontSize="large" color="action" />,
  chat: <ChatBubbleIcon fontSize="large" color="action" />,
  event: <EventIcon fontSize="large" color="action" />,
  reference: <PenIcon fontSize="large" color="action" />,
  friend_request: <SinglePersonIcon fontSize="large" color="action" />,
  host_request: <CouchFilledIcon fontSize="large" color="action" />,
};

const generateListItemTitle = (key: string): string => {
  if (key === "chat") {
    return "Messages";
  }

  // Handle specific keys that do not get an "s" added
  if (key === "account_security" || key === "account_settings") {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // For all other keys, add an "s" at the end
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .concat("s"); // Add an 's' to the end
};

export default function NotificationSettingsListItem({
  items,
  type,
}: NotificationSettingsListItemProps) {
  const classes = useStyles();
  const [isCollapseOpen, setisCollapseOpen] = useState<boolean>(false);

  const handleCollapseClick = () => {
    setisCollapseOpen(!isCollapseOpen);
  };

  const renderItems = () => {
    return items.map((item, index) => {
      return (
        <NotificationSettingsSubListItem
          key={`${type}-${index}`}
          item={item}
        />
      );
    });
  };

  return (
    <>
      <ListItem
        button
        className={classes.listItem}
        onClick={handleCollapseClick}
      >
        <ListItemIcon>{mapTypeToIcon[type]}</ListItemIcon>
        <ListItemText>
          <Typography variant="h3">{generateListItemTitle(type)}</Typography>
        </ListItemText>
        {isCollapseOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItem>
      <Collapse in={isCollapseOpen} timeout="auto" unmountOnExit>
        {renderItems()}
      </Collapse>
    </>
  );
}
