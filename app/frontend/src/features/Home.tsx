import { Link, Typography } from "@material-ui/core";
import Divider from "components/Divider";
import Markdown from "components/Markdown";
import {
  BUGS,
  BUGS_DESCRIPTION_1,
  BUGS_DESCRIPTION_2,
  BUGS_DESCRIPTION_3,
  COMMUNITY_FORUM,
  COMMUNITY_FORUM_LINK,
  FEATURES,
  FEATURES_MARKDOWN,
  WELCOME,
  WELCOME_DESCRIPTION_1,
  WELCOME_DESCRIPTION_2,
} from "features/constants";
import React from "react";

import ContributorForm, { CONTRIBUTE, JOIN_THE_TEAM } from "./contributorForm";

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
      <Markdown source={FEATURES_MARKDOWN} />
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
      <Typography variant="h2">{CONTRIBUTE}</Typography>
      <Typography variant="subtitle2">{JOIN_THE_TEAM}</Typography>
      <ContributorForm />
    </>
  );
}
