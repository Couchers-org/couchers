import { Typography } from "@material-ui/core";
import { Alert as MuiAlert } from "@material-ui/lab/";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import NotificationSettings from "features/auth/notifications/NotificationSettings";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  section: {
    margin: theme.spacing(4, 0),
  },
}));

export default function FeaturePreview() {
  const classes = useStyles();

  const { t } = useTranslation(AUTH);

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
      <NotificationSettings className={classes.section} />
    </>
  );
}
