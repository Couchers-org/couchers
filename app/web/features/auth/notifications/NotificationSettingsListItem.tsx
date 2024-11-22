import {
  Collapse,
  ListItem,
  ListItemIcon,
  ListItemProps,
  ListItemText,
  styled,
  Typography,
} from "@mui/material";
import {
  AccountSecurityIcon,
  AccountSettingsIcon,
  ChatBubbleIcon,
  CouchFilledIcon,
  EventIcon,
  ExpandLessIcon,
  ExpandMoreIcon,
  PenIcon,
  SinglePersonIcon,
} from "components/Icons";
import { AUTH } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { GroupAction, NotificationType } from "./EditNotificationSettingsPage";
import NotificationSettingsSubListItem from "./NotificationSettingsSubListItem";

export interface NotificationSettingsListItemProps {
  items: GroupAction[];
  type: NotificationType;
}

const StyledListItem = styled(ListItem)<ListItemProps>(({ theme }) => ({
  background: "transparent",
  border: "none",

  "&:hover": {
    backgroundColor: "transparent",
  },
  "&:not(:first-of-type)": {
    borderTop: `1px solid ${theme.palette.divider}`,
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
      <StyledListItem component="button" onClick={handleCollapseClick}>
        <ListItemIcon>{mapTypeToIcon[type]}</ListItemIcon>
        <ListItemText>
          <Typography variant="h3">{t(notificationType)}</Typography>
        </ListItemText>
        {isCollapseOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </StyledListItem>
      <Collapse in={isCollapseOpen}>{renderItems()}</Collapse>
    </>
  );
}
