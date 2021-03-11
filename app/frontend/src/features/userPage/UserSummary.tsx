import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
} from "@material-ui/core";
import {
  CakeIcon,
  LanguageIcon,
  LocationIcon,
  PersonIcon,
  WorkIcon,
} from "components/Icons";
import UserSection from "features/userPage/UserSection";
import { User } from "pb/api_pb";
import React from "react";

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
    <UserSection title="Summary" className={classes.root}>
      <List>
        <ListItem>
          <ListItemIcon>
            <CakeIcon titleAccess="Age" />
          </ListItemIcon>
          <ListItemText primary={user.age} />
        </ListItem>
        {user.gender && (
          <ListItem>
            <ListItemIcon>
              <PersonIcon titleAccess="Gender" />
            </ListItemIcon>
            <ListItemText primary={user.gender} />
          </ListItem>
        )}
        <ListItem>
          <ListItemIcon>
            <LocationIcon titleAccess="Location" />
          </ListItemIcon>
          <ListItemText primary={user.city} />
        </ListItem>
        {user.languagesList && (
          <ListItem>
            <ListItemIcon>
              <LanguageIcon titleAccess="Languages spoken" />
            </ListItemIcon>
            <ListItemText primary={user.languagesList.join(", ")} />
          </ListItem>
        )}
        {user.occupation && (
          <ListItem>
            <ListItemIcon>
              <WorkIcon titleAccess="Occupation" />
            </ListItemIcon>
            <ListItemText primary={user.occupation} />
          </ListItem>
        )}
      </List>
    </UserSection>
  );
}
