import { Typography } from "@material-ui/core";
import Markdown from "components/Markdown";
import TextBody from "components/TextBody";
import { User } from "pb/api_pb";
import React from "react";

export default function UserAbout({ user }: { user: User.AsObject }) {
  return (
    <>
      <Markdown source={user.aboutMe} />
      {user.regionsLivedList && (
        <>
          <Typography variant="h3">Countries lived in</Typography>
          <TextBody>{user.regionsLivedList.join(", ")}</TextBody>
        </>
      )}
      {user.regionsVisitedList && (
        <>
          <Typography variant="h3">Countries visited</Typography>
          <TextBody>{user.regionsVisitedList.join(", ")}</TextBody>
        </>
      )}
    </>
  );
}
