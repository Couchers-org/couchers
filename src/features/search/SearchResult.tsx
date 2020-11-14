import React from "react";
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  makeStyles,
  Typography as MuiTypography,
} from "@material-ui/core";
import { User } from "../../pb/api_pb";
import TextBody from "../../components/TextBody";

const useStyles = makeStyles({
  root: {
    minWidth: 275,
    marginBottom: 10,
  },
});

export default function SearchResult({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  return (
    <MuiCard className={classes.root}>
      <MuiCardContent>
        <TextBody color="textSecondary" gutterBottom>
          {user.username}
        </TextBody>
        <MuiTypography variant="h5" component="h2">
          {user.name}
        </MuiTypography>
        <TextBody color="textSecondary">{user.city}</TextBody>
        <TextBody>
          {user.age} years old
          <br />
          {user.gender}
          <br />
          {user.numReferences} References
          <br />
          {user.aboutMe}
        </TextBody>
      </MuiCardContent>
    </MuiCard>
  );
}
