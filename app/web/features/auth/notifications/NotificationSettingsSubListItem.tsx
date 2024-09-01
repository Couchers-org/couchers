import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@material-ui/core";
import { MailOutline } from "@material-ui/icons";
import Alert from "components/Alert";
import CustomColorSwitch from "components/CustomColorSwitch";
import { NotificationNewIcon } from "components/Icons";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { NotificationPreferenceData } from "service/notifications";
import { theme } from "theme";
import makeStyles from "utils/makeStyles";

import { useUpdateNotificationSettings } from "./notificationSettingsHooks";

export interface NotificationSettingsSubListItemProps {
  topic: string;
  action: string;
  email: boolean;
  push: boolean;
}

const useStyles = makeStyles((theme) => ({
  descriptionText: {
    fontSize: theme.spacing(1.8),
    color: theme.palette.text.secondary,
  },
  nested: {
    display: "flex",
    paddingLeft: theme.spacing(4),
    width: "100%",
    "&:hover": {
      backgroundColor: "transparent",
    },
    "&:not(:first-child)": {
      borderTop: `1px solid ${theme.palette.divider}`,
    },
  },
}));

export default function NotificationSettingsSubListItem({
  topic,
  action,
  email,
  push,
}: NotificationSettingsSubListItemProps) {
  const classes = useStyles();
  const { t } = useTranslation([AUTH, GLOBAL], {
    keyPrefix: "notification_settings.edit_preferences.item_descriptions",
  });

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
      }
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
      }
    );
  };

  return (
    <>
      {mutationError && (
        <Alert severity="error">
          {mutationError || t("global:error.unknown")}
        </Alert>
      )}
      <Typography className={classes.descriptionText}>
        {t(
          //@ts-ignore - I spent hours on this type with no luck
          `${topic}.${action}`
        )}
      </Typography>
      <List component="div" disablePadding>
        <ListItem button className={classes.nested}>
          <ListItemIcon>
            <NotificationNewIcon fontSize="medium" />
          </ListItemIcon>
          <ListItemText primary="Push" />
          <CustomColorSwitch
            color={theme.palette.primary.main}
            checked={push}
            isLoading={isPushLoading}
            onClick={handlePushSwitchClick}
            status={status}
          />
        </ListItem>
        <ListItem button className={classes.nested}>
          <ListItemIcon>
            <MailOutline fontSize="medium" />
          </ListItemIcon>
          <ListItemText primary="Email" />
          <CustomColorSwitch
            color={theme.palette.primary.main}
            checked={email}
            isLoading={isEmailLoading}
            onClick={handleEmailSwitchClick}
            status={status}
          />
        </ListItem>
      </List>
    </>
  );
}
