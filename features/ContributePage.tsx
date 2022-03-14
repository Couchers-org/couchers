import { Typography } from "@material-ui/core";
import { JOIN_THE_TEAM } from "components/ContributorForm";
import StandaloneContributorForm from "components/ContributorForm/StandaloneContributorForm";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { CONTRIBUTE_TITLE } from "features/dashboard/constants";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";

export default function ContributePage() {
  const { t } = useTranslation(GLOBAL);
  return (
    <>
      <HtmlMeta title={t("nav.volunteer")} />
      <PageTitle>{CONTRIBUTE_TITLE}</PageTitle>
      <Typography variant="body1" paragraph>
        {JOIN_THE_TEAM}
      </Typography>
      <StandaloneContributorForm />
    </>
  );
}
