import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@material-ui/core";
import { MailOutline } from "@material-ui/icons";
import { theme } from "theme";
import { useTranslation } from "i18n";

import { NotificationNewIcon } from "components/Icons";
import CustomColorSwitch from "components/CustomColorSwitch";
import makeStyles from "utils/makeStyles";
import { useUpdateNotificationSettings } from "./notificationSettingsHooks";
import { NotificationPreferenceData } from "service/notifications";
import { useState } from "react";
import Alert from "components/Alert";
import { GLOBAL, PROFILE } from "i18n/namespaces";

interface NotificationSettingsSubListItemProps {
  topic: string;
  action: string;
  email: boolean;
  push: boolean;
  description: string;
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
  description,
}: NotificationSettingsSubListItemProps) {
  const classes = useStyles();
  const { t } = useTranslation([GLOBAL, PROFILE]);

  const { updateNotificationSettings } = useUpdateNotificationSettings();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const handlePushSwitchClick = () => {
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
        // Scoll to top on submission error
        onError: () => {
          window.scroll({ top: 0, behavior: "smooth" });
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
    updateNotificationSettings({
      preferenceData: updatedItem,
      setMutationError,
    });
  };

  return (
    <>
      {mutationError && (
        <Alert severity="error">
          {mutationError || t("global:error.unknown")}
        </Alert>
      )}
      <Typography className={classes.descriptionText}>{description}</Typography>
      <List component="div" disablePadding>
        <ListItem button className={classes.nested}>
          <ListItemIcon>
            <NotificationNewIcon fontSize="medium" />
          </ListItemIcon>
          <ListItemText primary="Push" />
          <CustomColorSwitch
            color={theme.palette.primary.main}
            checked={push}
            onClick={handlePushSwitchClick}
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
            onClick={handleEmailSwitchClick}
          />
        </ListItem>
      </List>
    </>
  );
}
