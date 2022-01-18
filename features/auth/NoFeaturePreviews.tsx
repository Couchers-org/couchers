import { useTranslation } from "react-i18next";
import makeStyles from "utils/makeStyles";

import Section from "./section/Section";

const useStyles = makeStyles((theme) => ({
  section: {
    margin: theme.spacing(4, 0),
  },
}));

export function NoFeaturePreviews() {
  const classes = useStyles();
  const { t } = useTranslation("auth");

  return (
    <Section
      className={classes.section}
      title={t("feature_preview.no_previews.title")}
      content={t("feature_preview.no_previews.explanation")}
    />
  );
}
