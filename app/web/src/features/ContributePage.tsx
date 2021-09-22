import { Typography } from "@material-ui/core";
import { JOIN_THE_TEAM } from "components/ContributorForm";
import StandaloneContributorForm from "components/ContributorForm/StandaloneContributorForm";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { CONTRIBUTE_TITLE } from "features/dashboard/constants";

export default function ContributePage() {
  return (
    <>
      <HtmlMeta title={CONTRIBUTE_TITLE} />
      <PageTitle>{CONTRIBUTE_TITLE}</PageTitle>
      <Typography variant="body1" paragraph>
        {JOIN_THE_TEAM}
      </Typography>
      <StandaloneContributorForm />
    </>
  );
}
