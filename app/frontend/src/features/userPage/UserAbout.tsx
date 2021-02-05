import { makeStyles, Typography } from "@material-ui/core";
import React from "react";

import Markdown from "../../components/Markdown";
import TextBody from "../../components/TextBody";
import { User } from "../../pb/api_pb";

const useStyles = makeStyles({
  subheading: {
    fontWeight: "bold",
  },
});

export default function UserAbout({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  return (
    <>
      <Markdown source={user.aboutMe} />
      {user.countriesLivedList && (
        <>
          <Typography variant="subtitle1" className={classes.subheading}>
            Countries lived in
          </Typography>
          <TextBody>{user.countriesLivedList.join(", ")}</TextBody>
        </>
      )}
      {user.countriesVisitedList && (
        <>
          <Typography variant="subtitle1" className={classes.subheading}>
            Countries visited
          </Typography>
          <TextBody>{user.countriesVisitedList.join(", ")}</TextBody>
        </>
      )}
    </>
  );
}
