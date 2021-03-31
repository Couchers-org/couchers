import { Typography } from "@material-ui/core";
import React from "react";

import Markdown from "../../components/Markdown";
import TextBody from "../../components/TextBody";
import { User } from "../../pb/api_pb";

export default function UserAbout({ user }: { user: User.AsObject }) {
  return (
    <>
      <Markdown source={user.aboutMe} />
      {user.regionsLivedList && (
        <>
          <Typography variant="h3">Regions lived in</Typography>
          <TextBody>{user.regionsLivedList.join(", ")}</TextBody>
        </>
      )}
      {user.regionsVisitedList && (
        <>
          <Typography variant="h3">Regions visited</Typography>
          <TextBody>{user.regionsVisitedList.join(", ")}</TextBody>
        </>
      )}
    </>
  );
}
