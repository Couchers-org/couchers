import { Link, Typography } from "@material-ui/core";
import Divider from "components/Divider";
import {
  BUGS,
  BUGS_DESCRIPTION_1,
  BUGS_DESCRIPTION_2,
  BUGS_DESCRIPTION_3,
  COMMUNITY_FORUM,
  COMMUNITY_FORUM_LINK,
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
import React from "react";

import ContributorForm, {
  CONTRIBUTE,
  FILL_IN_THE_FORM,
  JOIN_THE_TEAM,
} from "./contributorForm";

export default function Home() {
  return (
    <>
      <Typography variant="h1">{WELCOME}</Typography>
      <Typography variant="body1">
        {WELCOME_DESCRIPTION_1}
        <br />
        <br /> {WELCOME_DESCRIPTION_2}
      </Typography>
      <Divider />
      <Typography variant="h2">{FEATURES}</Typography>
      <Typography variant="body1">{FEATURES_DESCRIPTION}</Typography>
      <Divider />
      <Typography variant="h2">{BUGS}</Typography>
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
      <Typography variant="h2">{HELP}</Typography>
      <Typography variant="body1">
        {HELP_DESCRIPTION_1}
        <Link href={SIGN_UP_LINK} target="_blank">
          {SIGN_UP}
        </Link>
        {HELP_DESCRIPTION_2}
      </Typography>
      <Divider />
      <Typography variant="h2">{CONTRIBUTE}</Typography>
      <Typography variant="subtitle2">{JOIN_THE_TEAM}</Typography>
      <p>{FILL_IN_THE_FORM}</p>
      <ContributorForm />
    </>
  );
}
