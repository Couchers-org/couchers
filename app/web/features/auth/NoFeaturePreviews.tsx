import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import makeStyles from "utils/makeStyles";

import Section from "./section/Section";

const useStyles = makeStyles((theme) => ({
  section: {
    margin: theme.spacing(4, 0),
  },
}));

export function NoFeaturePreviews() {
  const classes = useStyles();
  const { t } = useTranslation(AUTH);

  return (
    <Section
      className={classes.section}
      title={t("feature_preview.no_previews.title")}
      content={t("feature_preview.no_previews.explanation")}
    />
  );
}
