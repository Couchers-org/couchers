import { useState } from "react";
import {
  Collapse,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@material-ui/core";
import { useTranslation } from "next-i18next";
import { AUTH } from "i18n/namespaces";

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
import { GroupAction, NotificationType } from "./EditNotificationSettingsPage";

interface NotificationSettingsListItemProps {
  items: GroupAction[];
  type: NotificationType;
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

export default function NotificationSettingsListItem({
  items,
  type,
}: NotificationSettingsListItemProps) {
  const classes = useStyles();
  const notificationType =
    type as `auth:notification_settings.edit_preferences.list_items.${NotificationType}`;

  const { t } = useTranslation([AUTH], {
    keyPrefix: "notification_settings.edit_preferences.list_items",
  });
  const [isCollapseOpen, setIsCollapseOpen] = useState<boolean>(false);

  const handleCollapseClick = () => {
    setIsCollapseOpen(!isCollapseOpen);
  };

  const renderItems = () =>
    items
      .filter((item) => item.userEditable)
      .map((item) => (
        <NotificationSettingsSubListItem
          key={`${item.topic}:${item.action}`}
          topic={item.topic}
          action={item.action}
          push={item.push}
          email={item.email}
        />
      ));

  return (
    <>
      <ListItem
        button
        className={classes.listItem}
        onClick={handleCollapseClick}
      >
        <ListItemIcon>{mapTypeToIcon[type]}</ListItemIcon>
        <ListItemText>
          <Typography variant="h3">{t(notificationType)}</Typography>
        </ListItemText>
        {isCollapseOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItem>
      <Collapse in={isCollapseOpen}>{renderItems()}</Collapse>
    </>
  );
}
