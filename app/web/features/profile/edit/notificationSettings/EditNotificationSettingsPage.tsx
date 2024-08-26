import { useEffect, useState } from "react";
import { CircularProgress, Typography } from "@material-ui/core";
import { List } from "@material-ui/core";

import Snackbar from "components/Snackbar";
import makeStyles from "utils/makeStyles";

import NotificationSettingsListItem from "./NotificationSettingsListItem";
import useNotificationSettings from "./useNotificationSettings";

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
    width: "50%",
  },
  notificationDescription: {
    margin: theme.spacing(1, 0),
    paddingBottom: theme.spacing(3),
  },
}));

// @TODO(NA): Add translations
export default function EditNotificationSettingsPage() {
  const classes = useStyles();
  const { data, isLoading, isError } = useNotificationSettings();
  const [groups, setGroups] = useState<GroupsByType>({});
  const [areGroupsLoading, setAreGroupsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
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
                acc[key].push({...subTopic, topic: topic.topic});
              });
            }
          });

          return acc;
        },
        {}
      );

      setGroups(computedGroups);
    } catch (error) {
      console.error("Error fetching notification settings data:", error);
    } finally {
      setAreGroupsLoading(false);
    }
  }, [isLoading]);

  const renderNotificationListItems = () => {
    return Object.keys(groups).map((key) => {
      return (
        <NotificationSettingsListItem
          items={groups[key]}
          type={key}
        />
      );
    });
  };

  return (
    <div className={classes.notificationSettingsContainer}>
      <Typography variant="h2">Notification Settings</Typography>
      <Typography className={classes.notificationDescription} variant="body1">
        You may still receive important notifications about your account and
        content outside of your preferred notification settings.
      </Typography>
      <Typography variant="h3">Notifications you may receive</Typography>
      {isError && (
        <Snackbar severity="error">
          <Typography>Error loading notification settings</Typography>
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
