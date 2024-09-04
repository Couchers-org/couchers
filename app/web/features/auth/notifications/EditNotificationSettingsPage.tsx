import { CircularProgress, List, Typography } from "@material-ui/core";
import Snackbar from "components/Snackbar";
import { AUTH } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import makeStyles from "utils/makeStyles";

import NotificationSettingsListItem from "./NotificationSettingsListItem";
import useNotificationSettings from "./useNotificationSettings";

export type NotificationType =
  | "account_security"
  | "account_settings"
  | "chat"
  | "event"
  | "reference"
  | "friend_request"
  | "host_request";

export interface GroupAction {
  action: string;
  description: string;
  email: boolean;
  push: boolean;
  topic: string;
  userEditable: boolean;
}

interface GroupsByType {
  [key: string]: GroupAction[];
}

const useStyles = makeStyles((theme) => ({
  descriptionText: {
    fontSize: theme.spacing(1.8),
    color: theme.palette.text.secondary,
  },
  list: {
    border: `1px solid ${theme.palette.divider}`,
    marginTop: theme.spacing(1),
    display: "flex",
    flexDirection: "column",
    padding: `0 ${theme.spacing(1)}`,
  },
  loading: {
    position: "absolute",
  },
  notificationSettingsContainer: {
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(4),
    margin: "0 auto",
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "50%",
    },
  },
  notificationDescription: {
    margin: theme.spacing(1, 0),
    paddingBottom: theme.spacing(3),
  },
}));

export default function EditNotificationSettingsPage() {
  const classes = useStyles();
  const { t } = useTranslation(AUTH, {
    keyPrefix: "notification_settings.edit_preferences",
  });
  const { data, isLoading, isError } = useNotificationSettings();
  const [groups, setGroups] = useState<GroupsByType>({});
  const [areGroupsLoading, setAreGroupsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!data) {
      return;
    }

    const computedGroups = data?.groupsList.reduce<GroupsByType>(
      (acc, group) => {
        group.topicsList.forEach((topic) => {
          if (topic && topic.itemsList) {
            topic.itemsList.forEach((subTopic) => {
              const key =
                group.heading === "Account Security"
                  ? "account_security"
                  : group.heading === "Account Settings"
                  ? "account_settings"
                  : topic.topic;

              if (!acc[key]) {
                acc[key] = [];
              }

              if (subTopic.userEditable) {
                acc[key].push({ ...subTopic, topic: topic.topic });
              }
            });
          }
        });

        return acc;
      },
      {}
    );

    setGroups(computedGroups);
    setAreGroupsLoading(false);
  }, [data]);

  const renderNotificationListItems = () =>
    Object.keys(groups)
      .filter((key) => groups[key].length > 0)
      .map((key) => (
        <NotificationSettingsListItem
          key={key}
          items={groups[key]}
          type={key as NotificationType}
        />
      ));

  return (
    <div className={classes.notificationSettingsContainer}>
      <Typography variant="h2">{t("title")}</Typography>
      <Typography className={classes.notificationDescription} variant="body1">
        {t("description")}
      </Typography>
      <Typography variant="h3">{t("list_heading")}</Typography>
      {isError && (
        <Snackbar severity="error">
          <Typography>{t("error_loading")}</Typography>
        </Snackbar>
      )}
      {!isLoading && !areGroupsLoading ? (
        <List className={classes.list}>{renderNotificationListItems()}</List>
      ) : (
        <CircularProgress className={classes.loading} />
      )}
    </div>
  );
}
