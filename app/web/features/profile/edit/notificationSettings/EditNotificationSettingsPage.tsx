import { Typography } from "@material-ui/core";
import makeStyles from "utils/makeStyles";
import { List } from "@material-ui/core";
import { SinglePersonIcon, CouchIconFilled } from "components/Icons";
import NotificationSettingsListItem from "./NotificationSettingsListItem";

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

  return (
    <div className={classes.notificationSettingsContainer}>
      <Typography variant="h2">Notification Settings</Typography>
      <Typography className={classes.notificationDescription} variant="body1">
        You may still receive important notifications about your account and
        content outside of your preferred notification settings.
      </Typography>
      <Typography variant="h3">Notifications you may receive</Typography>
      <List className={classes.list}>
        <NotificationSettingsListItem
          actions={[
            "Notifications when someone sends you a friend request or accepts your friend request",
          ]}
          title="Friend Requests"
          icon={<SinglePersonIcon fontSize="large" color="action" />}
          type="friend"
        />
        <NotificationSettingsListItem
          actions={[
            "Notifications when someone sends you a host request or accepts your host request",
            "Notifications when someone confirms or declines your host request",
            "Notifications when someone cancels their host request",
            "Notifications when someone sends a message in their host request or you miss a message in your host request",
          ]}
          title="Host Requests"
          type="host"
          icon={<CouchIconFilled fontSize="large" color="action" />}
        />
      </List>
    </div>
  );
}
