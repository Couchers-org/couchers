import { Link, Typography } from "@material-ui/core";
import Button from "components/Button";
import Divider from "components/Divider";
import TextBody from "components/TextBody";
import {
  BUGS,
  BUGS_DESCRIPTION_1,
  BUGS_DESCRIPTION_2,
  BUGS_DESCRIPTION_3,
  COMMUNITY_FORUM,
  COMMUNITY_FORUM_LINK,
  CREATE_GUIDE,
  CREATE_PLACE,
  FEATURES,
  FEATURES_DESCRIPTION,
  HELP,
  HELP_DESCRIPTION_1,
  HELP_DESCRIPTION_2,
  SIGN_UP,
  SIGN_UP_LINK,
  WELCOME,
  WELCOME_DESCRIPTION_1,
  WELCOME_DESCRIPTION_2,
} from "features/constants";
import useCurrentUser from "features/userQueries/useCurrentUser";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { newGuideRoute, newPlaceRoute } from "routes";

export default function Home() {
  const name = useCurrentUser().data?.name.split(" ")[0];
  const isPostBetaEnabled = process.env.REACT_APP_IS_POST_BETA_ENABLED;

  return isPostBetaEnabled ? (
    <>
      {name ? <TextBody>Hello, {name}.</TextBody> : null}
      <Button component={RouterLink} to={newPlaceRoute}>
        {CREATE_PLACE}
      </Button>
      <Button component={RouterLink} to={newGuideRoute}>
        {CREATE_GUIDE}
      </Button>
    </>
  ) : (
    <>
      <Typography variant="h1">{WELCOME}</Typography>
      <Typography variant="body1">
        {WELCOME_DESCRIPTION_1}
        <br />
        <br /> {WELCOME_DESCRIPTION_2}
      </Typography>
      <Divider />
      <Typography variant="h1">{FEATURES}</Typography>
      <Typography variant="body1">{FEATURES_DESCRIPTION}</Typography>
      <Divider />
      <Typography variant="h1">{BUGS}</Typography>
      <Typography variant="body1">
        {BUGS_DESCRIPTION_1}
        <br />
        <br />
        {BUGS_DESCRIPTION_2}
        <Link href={COMMUNITY_FORUM_LINK} target="_blank">
          {COMMUNITY_FORUM}
        </Link>
        {BUGS_DESCRIPTION_3}
      </Typography>
      <Divider />
      <Typography variant="h1">{HELP}</Typography>
      <Typography variant="body1">
        {HELP_DESCRIPTION_1}
        <Link href={SIGN_UP_LINK} target="_blank">
          {SIGN_UP}
        </Link>
        {HELP_DESCRIPTION_2}
      </Typography>
    </>
  );
}
