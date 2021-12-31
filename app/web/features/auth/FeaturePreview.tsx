import { Typography } from "@material-ui/core";
import { Alert as MuiAlert } from "@material-ui/lab/";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import Section from "features/auth/section/Section";
import { useTranslation } from "react-i18next";
import makeStyles from "utils/makeStyles";

import useAccountInfo from "./useAccountInfo";

const useStyles = makeStyles((theme) => ({
  section: {
    margin: theme.spacing(4, 0),
    "&:first-of-type": {
      marginTop: theme.spacing(2),
    },
  },
}));

export default function FeaturePreview() {
  const {
    data: accountInfo,
    error: accountInfoError,
    isLoading: isAccountInfoLoading,
  } = useAccountInfo();

  const classes = useStyles();

  const { t } = useTranslation("auth");

  return (
    <>
      <HtmlMeta title={t("feature_preview.title")} />
      <PageTitle>{t("feature_preview.title")}</PageTitle>
      <Typography variant="body1" paragraph>
        {t("feature_preview.explanation")}
      </Typography>
      <MuiAlert severity="warning">
        <Typography variant="inherit">
          {t("feature_preview.disclaimer")}
        </Typography>
      </MuiAlert>
      <Section
        className={classes.section}
        title={t("feature_preview.no_previews.title")}
        content={t("feature_preview.no_previews.explanation")}
      />
    </>
  );
}
