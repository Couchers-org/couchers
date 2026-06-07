import { MailOutline } from "@mui/icons-material";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemProps,
  ListItemText,
  styled,
  Typography,
} from "@mui/material";
import Alert from "components/Alert";
import CustomColorSwitch from "components/CustomColorSwitch";
import { NotificationNewIcon } from "components/Icons";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { NotificationPreferenceData } from "service/notifications";
import { theme } from "theme";

import useUpdateNotificationSettings from "./useUpdateNotificationSettings";

interface NotificationSettingsSubListItemProps {
  topic: string;
  action: string;
  /// The localized description string.
  description: string;
  email: boolean;
  push: boolean;
}

const StyledDescriptionText = styled(Typography)(({ theme }) => ({
  fontSize: theme.spacing(1.8),
  color: theme.palette.text.secondary,
}));

const StyledListItem = styled(ListItem)<ListItemProps>(({ theme }) => ({
  display: "flex",
  paddingLeft: theme.spacing(4),
  width: "100%",
  background: "transparent",
  border: "none",

  "&:hover": {
    backgroundColor: "transparent",
  },
  "&:not(:first-of-type)": {
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

export default function NotificationSettingsSubListItem({
  topic,
  action,
  description,
  email,
  push,
}: NotificationSettingsSubListItemProps) {
  const { t } = useTranslation([GLOBAL, NOTIFICATIONS]);

  const { updateNotificationSettings, status } =
    useUpdateNotificationSettings();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const handlePushSwitchClick = () => {
    setIsPushLoading(true);
    const updatedItem: NotificationPreferenceData = {
      topic,
      action,
      deliveryMethod: "push",
      enabled: !push,
    };
    updateNotificationSettings(
      {
        preferenceData: updatedItem,
        setMutationError,
      },
      {
        onError: () => {
          window.scroll({ top: 0, behavior: "smooth" });
          setIsPushLoading(false);
        },
        onSettled: () => {
          setIsPushLoading(false);
        },
      },
    );
  };

  const handleEmailSwitchClick = () => {
    const updatedItem: NotificationPreferenceData = {
      topic,
      action,
      deliveryMethod: "email",
      enabled: !email,
    };
    setIsEmailLoading(true);
    updateNotificationSettings(
      {
        preferenceData: updatedItem,
        setMutationError,
      },
      {
        onError: () => {
          window.scroll({ top: 0, behavior: "smooth" });
          setIsEmailLoading(false);
        },
        onSettled: () => {
          setIsEmailLoading(false);
        },
      },
    );
  };

  return (
    <>
      {mutationError && (
        <Alert severity="error">
          {mutationError || t("global:error.unknown")}
        </Alert>
      )}
      <StyledDescriptionText>{description}</StyledDescriptionText>
      <List component="div" disablePadding>
        <StyledListItem component="button">
          <ListItemIcon>
            <NotificationNewIcon />
          </ListItemIcon>
          <ListItemText
            primary={t(
              "notifications:notification_settings.edit_preferences.channels.push_label",
            )}
          />
          <CustomColorSwitch
            customColor={theme.palette.primary.main}
            checked={push}
            isLoading={isPushLoading}
            onClick={handlePushSwitchClick}
            status={status}
          />
        </StyledListItem>
        <StyledListItem component="button">
          <ListItemIcon>
            <MailOutline fontSize="medium" />
          </ListItemIcon>
          <ListItemText
            primary={t(
              "notifications:notification_settings.edit_preferences.channels.email_label",
            )}
          />
          <CustomColorSwitch
            customColor={theme.palette.primary.main}
            checked={email}
            isLoading={isEmailLoading}
            onClick={handleEmailSwitchClick}
            status={status}
          />
        </StyledListItem>
      </List>
    </>
  );
}
