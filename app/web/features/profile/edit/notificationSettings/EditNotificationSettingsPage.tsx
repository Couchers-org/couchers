import { Typography } from "@material-ui/core";
import makeStyles from "utils/makeStyles";
import { List } from "@material-ui/core";
import {
  SinglePersonIcon,
  CouchFilledIcon,
  ChatBubbleIcon,
  EventIcon,
  PenIcon,
  ReminderIcon,
  AccountSettingsIcon,
  AccountSecurityIcon,
} from "components/Icons";
import NotificationSettingsListItem from "./NotificationSettingsListItem";
import useNotifications from "features/useNotifications";
import useNotificationSettings from "./useNotificationSettings";

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
  const { data } = useNotificationSettings();

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
          icon={<CouchFilledIcon fontSize="large" color="action" />}
        />
        <NotificationSettingsListItem
          actions={[
            "Notifications when someone sends you a message",
            "Notifications when you miss messages in a chat",
          ]}
          title="Messages"
          type="message"
          icon={<ChatBubbleIcon fontSize="large" color="action" />}
        />
        <NotificationSettingsListItem
          actions={[
            "Notifications when an event approved by the moderators is created in your community",
            "Notifications when a user creates any event in your community (not checked by an admin)",
            "Notifications when an event you are attending is updated",
            "Notifications when an event you are attending is canceled",
            "Notifications when an event you are attending is deleted",
            "Notifications when someone invites you to co-organize an event",
          ]}
          title="Events"
          type="event"
          icon={<EventIcon fontSize="large" color="action" />}
        />
        <NotificationSettingsListItem
          actions={[
            "Notifications when you receive a reference from someone who hosted you or you hosted",
            "Notifications when you received a reference from a friend",
          ]}
          title="References"
          type="reference"
          icon={<PenIcon fontSize="large" color="action" />}
        />
        <NotificationSettingsListItem
          actions={[
            "Notifications to remind you to write a reference for someone you hosted or who hosted you",
            "Notifications to remind you to complete your profile after signing up",
          ]}
          title="Reminders"
          icon={<ReminderIcon fontSize="large" color="action" />}
          type="reminder"
        />
        <NotificationSettingsListItem
          actions={[
            "Notifications when a badge is added or removed from your account",
            "Notifications when your donation is received",
          ]}
          title="Account Settings"
          icon={<AccountSettingsIcon fontSize="large" color="action" />}
          type="account-settings"
        />
                <NotificationSettingsListItem
          actions={[
            "Notifications when your password is changed",
            "Motifications when your password reset is initiated or completed",
            "Notifications when your email is changed or your new email is verified",
            "Notifications when you initiate account deletion, your account is deleted or you account is recoved (undeleted)",
            "Notifications when an api key is created for your account",
            "Notifications when your phone number is changed or verified",
            "Notifications when your birthdate is changed",
            "Notifications when the gender displayed on your profile is changed",
          ]}
          title="Account Security"
          icon={<AccountSecurityIcon fontSize="large" color="action" />}
          type="account-security"
        />
      </List>
    </div>
  );
}
