import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@material-ui/core";
import { MailOutline } from "@material-ui/icons";
import { theme } from "theme";

import { NotificationNewIcon } from "components/Icons";
import CustomColorSwitch from "./CustomColorSwitch";
import makeStyles from "utils/makeStyles";
import { useState } from "react";
import { GroupAction } from "./EditNotificationSettingsPage";

interface NotificationSettingsSubListItemProps {
  item: GroupAction;
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
  item,
}: NotificationSettingsSubListItemProps) {
  const classes = useStyles();

  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(item.push);
  const [isEmailEnabled, setIsEmailEnabled] = useState<boolean>(item.email);

  const handlePushSwitchClick = () => {
    //@TODO Update value in DB
    setIsPushEnabled(!isPushEnabled);
  };

  const handleEmailSwitchClick = () => {
    //@TODO Update value in DB
    setIsEmailEnabled(!isEmailEnabled);
  };

  return (
    <>
      <Typography className={classes.descriptionText}>
        {item.description}
      </Typography>
      <List component="div" disablePadding>
        <ListItem button className={classes.nested}>
          <ListItemIcon>
            <NotificationNewIcon fontSize="medium" />
          </ListItemIcon>
          <ListItemText primary="Push" />
          <CustomColorSwitch
            color={theme.palette.primary.main}
            checked={isPushEnabled}
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
            checked={isEmailEnabled}
            onClick={handleEmailSwitchClick}
          />
        </ListItem>
      </List>
    </>
  );
}
