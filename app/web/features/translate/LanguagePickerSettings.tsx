import { Link, Typography } from "@mui/material";
import { Trans, useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { translateJobURL, translateRoute } from "routes";

import Button from "../../components/Button";
import LanguagePickerSelect from "./LanguagePickerSelect";

interface ChangeLanguageProps {
  className?: string;
}

export default function LanguagePickerSettings({
  className,
}: ChangeLanguageProps) {
  const { t } = useTranslation([GLOBAL]);
  const router = useRouter();
  const { locale } = router;
  const languageName = LANGUAGE_MAP[locale || "en"]?.name;

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("global:language_preference.form_title")}
      </Typography>
      <>
        <Typography variant="body1">
          <Trans
            t={t}
            i18nKey="global:language_preference.current_preferred_language"
            values={{ language: languageName }}
            components={{ lang: <strong /> }}
          />
        </Typography>
        <Typography
          variant="body1"
          sx={{
            marginBottom: "16px",
          }}
        >
          <Link
            href={translateJobURL}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            <strong>{t("global:language_preference.help_translate")}</strong>
          </Link>
        </Typography>
        <LanguagePickerSelect displayMode="rect" />
        <Typography
          sx={{
            mt: 2,
            marginBottom: "16px",
          }}
        >
          <Button onClick={() => router.push(translateRoute)}>
            {t("global:language_preference.translation_progress.view_progress")}
          </Button>
        </Typography>
      </>
    </div>
  );
}
