import React from "react";
import { User } from "../../pb/api_pb";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
} from "@material-ui/core";
import Icon from "../../components/Icon";
import UserSection from "./UserSection";

const useStyles = makeStyles((theme) => ({
  root: {
    //prevent a larger gap after UserSummary
    //compared to other sections on mobile
    marginBottom: theme.spacing(0),
  },
}));

export default function UserSummary({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  return (
    <UserSection
      title="Summary"
      className={classes.root}
      content={
        <List>
          <ListItem>
            <ListItemIcon>
              <Icon type="cake" titleAccess="Age" />
            </ListItemIcon>
            <ListItemText primary={user.age} />
          </ListItem>
          {user.gender && (
            <ListItem>
              <ListItemIcon>
                <Icon type="gender" titleAccess="Gender" />
              </ListItemIcon>
              <ListItemText primary={user.gender} />
            </ListItem>
          )}
          <ListItem>
            <ListItemIcon>
              <Icon type="location" titleAccess="Location" />
            </ListItemIcon>
            <ListItemText primary="(Location placeholder)" />
          </ListItem>
          {user.languagesList && (
            <ListItem>
              <ListItemIcon>
                <Icon type="language" titleAccess="Languages spoken" />
              </ListItemIcon>
              <ListItemText primary={user.languagesList.join(", ")} />
            </ListItem>
          )}
          {user.occupation && (
            <ListItem>
              <ListItemIcon>
                <Icon type="work" titleAccess="Occupation" />
              </ListItemIcon>
              <ListItemText primary={user.occupation} />
            </ListItem>
          )}
        </List>
      }
    />
  );
}
