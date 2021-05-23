import { Typography } from "@material-ui/core";
import Divider from "components/Divider";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import { LANDING_MARKDOWN, WELCOME } from "features/constants";
import DashboardBanners from "features/dashboard/DashboardBanners";
import React from "react";

import ContributorForm, { CONTRIBUTE, JOIN_THE_TEAM } from "./contributorForm";

export default function Home() {
  return (
    <>
      <PageTitle>{WELCOME}</PageTitle>
      <DashboardBanners />
      <Markdown source={LANDING_MARKDOWN} />
      <Divider />
      <Typography variant="h2">{CONTRIBUTE}</Typography>
      <Typography variant="subtitle2">{JOIN_THE_TEAM}</Typography>
      <ContributorForm />
    </>
  );
}
