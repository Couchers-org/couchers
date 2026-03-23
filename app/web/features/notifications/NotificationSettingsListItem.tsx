import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  styled,
  Typography,
} from "@mui/material";
import { NOTIFICATIONS } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { GroupAction, NotificationType } from "./EditNotificationSettingsPage";
import NotificationSettingsSubListItem from "./NotificationSettingsSubListItem";
import { mapNotificationSettingsTypeToIcon } from "./utils/constants";

interface NotificationSettingsListItemProps {
  items: GroupAction[];
  type: NotificationType;
  isExpanded?: boolean;
}

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  "&:not(:first-of-type)": {
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  "&:before": {
    display: "none",
  },
  boxShadow: "none",
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  "& .MuiAccordionSummary-content": {
    alignItems: "center",
  },
}));

export default function NotificationSettingsListItem({
  items,
  type,
  isExpanded = false,
}: NotificationSettingsListItemProps) {
  const notificationType =
    type as `notifications:notification_settings.edit_preferences.list_items.${NotificationType}`;

  const { t } = useTranslation([NOTIFICATIONS], {
    keyPrefix: "notification_settings.edit_preferences.list_items",
  });
  const [isCollapseOpen, setIsCollapseOpen] = useState<boolean>(false);

  // Update local state when global state changes
  useEffect(() => {
    setIsCollapseOpen(isExpanded);
  }, [isExpanded]);

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
          description={item.description}
          push={item.push}
          email={item.email}
        />
      ));

  return (
    <StyledAccordion expanded={isCollapseOpen} onChange={handleCollapseClick}>
      <StyledAccordionSummary expandIcon={<ExpandMore />}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {mapNotificationSettingsTypeToIcon[type]}
          <Typography variant="h3">{t(notificationType)}</Typography>
        </div>
      </StyledAccordionSummary>
      <AccordionDetails>{renderItems()}</AccordionDetails>
    </StyledAccordion>
  );
}
