import { Typography } from "@mui/material";
import Button from "components/Button";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import Link from "next/link";
import { featurePreviewRoute } from "routes";

export default function FeaturePreviewLink() {
  const { t } = useTranslation(AUTH);

  return (
    <div>
      <Typography variant="h2" gutterBottom>
        {t("feature_preview.title")}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {t("feature_preview.settings_page_text")}
      </Typography>
      <Button component={Link} href={featurePreviewRoute}>
        {t("feature_preview.settings_page_link")}
      </Button>
    </div>
  );
}
