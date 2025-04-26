import {
  Collapse,
  ListItem,
  ListItemIcon,
  ListItemProps,
  ListItemText,
  styled,
  Typography,
} from "@mui/material";
import { ExpandLessIcon, ExpandMoreIcon } from "components/Icons";
import { NOTIFICATIONS } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { GroupAction, NotificationType } from "./EditNotificationSettingsPage";
import NotificationSettingsSubListItem from "./NotificationSettingsSubListItem";
import { mapNotificationSettingsTypeToIcon } from "./utils/constants";

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

export default function NotificationSettingsListItem({
  items,
  type,
}: NotificationSettingsListItemProps) {
  const notificationType =
    type as `notifications:notification_settings.edit_preferences.list_items.${NotificationType}`;

  const { t } = useTranslation([NOTIFICATIONS], {
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
        <ListItemIcon>{mapNotificationSettingsTypeToIcon[type]}</ListItemIcon>
        <ListItemText>
          <Typography variant="h3">{t(notificationType)}</Typography>
        </ListItemText>
        {isCollapseOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </StyledListItem>
      <Collapse in={isCollapseOpen}>{renderItems()}</Collapse>
    </>
  );
}
