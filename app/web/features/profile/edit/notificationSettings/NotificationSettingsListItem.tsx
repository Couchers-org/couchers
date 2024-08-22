import { Collapse, ListItem, ListItemIcon, ListItemText,  Typography } from "@material-ui/core"

import { ExpandLessIcon, ExpandMoreIcon, NotificationNewIcon, SinglePersonIcon } from "components/Icons";
import makeStyles from "utils/makeStyles";
import { useState } from "react";
import NotificationSettingsSubListItem from "./NotificationSettingsSubListItem";

const useStyles = makeStyles((theme) => ({
    descriptionText: {
        fontSize: theme.spacing(1.8),
        color: theme.palette.text.secondary,
    },
    listItem: {
       "&:hover": {
          backgroundColor: "transparent",
        },
        "&:not(:first-child)": {
            borderTop: `1px solid ${theme.palette.divider}`,
          },
    }
}));

interface NotificationSettingsListItemProps {
    actions: string[];
    icon: React.ReactNode;
    title: string;
    type: string;
}

export default function NotificationSettingsListItem({
  actions,
  icon,
  title,
  type,
}: NotificationSettingsListItemProps) {
    const classes = useStyles();
    const [isCollapseOpen, setisCollapseOpen] = useState<boolean>(false);

    const handleCollapseClick = () => {
      setisCollapseOpen(!isCollapseOpen);
    };

    const renderActions = () => {   
        return actions.map((action, index) => {
            return (
            <NotificationSettingsSubListItem key={`${type}-${index}`} description={action} />
            );
        });
    }

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
        {renderActions()} 
      </Collapse>
    </>
  );
}
