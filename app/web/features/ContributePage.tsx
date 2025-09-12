import { Typography } from "@mui/material";

import { JOIN_THE_TEAM } from "@/components/ContributorForm";
import StandaloneContributorForm from "@/components/ContributorForm/StandaloneContributorForm";
import HtmlMeta from "@/components/HtmlMeta";
import PageTitle from "@/components/PageTitle";
import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";

const ContributePage = () => {
  const { t } = useTranslation([GLOBAL]);
  return (
    <>
      <HtmlMeta title={t("global:nav.volunteer")} />
      <PageTitle>{t("global:contribute_title")}</PageTitle>
      <Typography
        variant="body1"
        sx={{
          marginBottom: "16px",
        }}
      >
        {JOIN_THE_TEAM}
      </Typography>
      <StandaloneContributorForm />
    </>
  );
};

export default ContributePage;
