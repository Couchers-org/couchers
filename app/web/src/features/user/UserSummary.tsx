import { List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import {
  CakeIcon,
  LanguageIcon,
  LocationIcon,
  PersonIcon,
  WorkIcon,
} from "components/Icons";
import { useLanguages } from "features/profile/hooks/useLanguages";
import UserSection from "features/user/UserSection";
import { User } from "proto/api_pb";
import React from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    //prevent a larger gap after UserSummary
    //compared to other sections on mobile
    marginBottom: theme.spacing(0),
  },
}));

export default function UserSummary({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  const { languages } = useLanguages();
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
        {user.languageAbilitiesList && languages && (
          <ListItem>
            <ListItemIcon>
              <LanguageIcon titleAccess="Languages spoken" />
            </ListItemIcon>
            <ListItemText
              primary={user.languageAbilitiesList
                .map((ability) => languages[ability.code])
                .join(", ")}
            />
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
