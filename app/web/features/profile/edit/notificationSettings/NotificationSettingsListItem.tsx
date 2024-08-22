import { Collapse, List, ListItem, ListItemIcon, ListItemText,  Typography } from "@material-ui/core"
import { MailOutline } from "@material-ui/icons";
import { theme } from "theme";

import { ExpandLessIcon, ExpandMoreIcon, NotificationNewIcon, SinglePersonIcon } from "components/Icons";
import CustomColorSwitch from "./CustomColorSwitch";
import makeStyles from "utils/makeStyles";
import { useState } from "react";

const useStyles = makeStyles((theme) => ({
    descriptionText: {
        fontSize: theme.spacing(1.8),
        color: theme.palette.text.secondary,
    },
    listItem: {
       "&:hover": {
          backgroundColor: "transparent",
        },
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

interface NotificationSettingsListItemProps {
    description: string;
    icon: React.ReactNode;
    title: string;
}

export default function NotificationSettingsListItem({
  description,
  icon,
  title,
}: NotificationSettingsListItemProps) {
    const classes = useStyles();

    const [isCollapseOpen, setisCollapseOpen] = useState<boolean>(false);
    const [isPushEnabled, setIsPushEnabled] = useState<boolean>(false);
    const [isEmailEnabled, setIsEmailEnabled] = useState<boolean>(false);

    const handleCollapseClick = () => {
      setisCollapseOpen(!isCollapseOpen);
    };

    const handlePushSwitchClick = () => {
        setIsPushEnabled(!isPushEnabled);
    };

    const handleEmailSwitchClick = () => {
        setIsEmailEnabled(!isEmailEnabled);
    };

  return (
    <>
      <ListItem button className={classes.listItem} onClick={handleCollapseClick}>
        <ListItemIcon>
          {icon}
        </ListItemIcon>
        <ListItemText>
          <Typography variant="h3">{title}</Typography>
        </ListItemText>
        {isCollapseOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItem>
      <Collapse in={isCollapseOpen} timeout="auto" unmountOnExit>
        <Typography className={classes.descriptionText}>
          {description}
        </Typography>
        <List component="div" disablePadding>
          <ListItem button className={classes.nested}>
            <ListItemIcon>
              <NotificationNewIcon fontSize="medium" />
            </ListItemIcon>
            <ListItemText primary="Push" />
            <CustomColorSwitch color={theme.palette.primary.main} checked={isPushEnabled} onClick={handlePushSwitchClick}/>
          </ListItem>
          <ListItem button className={classes.nested}>
            <ListItemIcon>
              <MailOutline fontSize="medium" />
            </ListItemIcon>
            <ListItemText primary="Email" />
            <CustomColorSwitch color={theme.palette.primary.main} checked={isEmailEnabled} onClick={handleEmailSwitchClick}/>
          </ListItem>
        </List>
      </Collapse>
    </>
  );
}
