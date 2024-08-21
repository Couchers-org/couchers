import { Collapse, ListItem, ListItemIcon, Typography } from "@material-ui/core"
import makeStyles from "utils/makeStyles";
import { List, ListItemText } from "@material-ui/core"
import { ExpandLessIcon, ExpandMoreIcon, SinglePersonIcon } from "components/Icons";
import {useState } from "react";

const useStyles = makeStyles((theme) => ({
    list: {
        border: `1px solid ${theme.palette.divider}`,
        marginTop: theme.spacing(1),
        display: "flex",
        flexDirection: "column",
        padding: theme.spacing(1),
    },
    listItem: {
       "&:hover": {
          backgroundColor: "transparent",
        },
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
    const [open, setOpen] = useState(true);

    const handleClick = () => {
      setOpen(!open);
    };

    return (
        <div className={classes.notificationSettingsContainer}>
            <Typography variant="h2">Notification Settings</Typography>
            <Typography className={classes.notificationDescription} variant="body1">
                You may still receive important notifications about your account and content outside of your preferred notification settings.
            </Typography>
            <Typography variant="h3">Notifications you may receive</Typography>
            <List className={classes.list}>
                <ListItem button className={classes.listItem} onClick={handleClick} >
                    <ListItemIcon>
                        <SinglePersonIcon fontSize="large" color="action"/>
                    </ListItemIcon> 
                    <ListItemText>
                        <Typography variant="h3">Friend Requests</Typography>
                    </ListItemText>
                    {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItem>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Typography variant="body2">Notifications when someone sends you a friend requests or accepts your friend requests</Typography>
                </Collapse>
            </List>
        </div>
    );
}