import { Link, Typography } from "@mui/material";
import { useRouter } from "next/router";

import Button from "@/components/Button";
import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";
import { TRANSLATE_JOB_URL, TRANSLATE_ROUTE } from "@/routes";
import { getLanguageFromCode } from "@/utils/language";

import LanguagePickerSelect from "./LanguagePickerSelect";

interface ChangeLanguageProps {
  className?: string;
}

const LanguagePickerSettings = ({ className }: ChangeLanguageProps) => {
  const { t } = useTranslation([GLOBAL]);
  const router = useRouter();
  const { locale } = router;

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("global:language_preference.form_title")}
      </Typography>
      <>
        <Typography variant="body1">
          {t("global:language_preference.current_preferred_language")}
          <strong>{getLanguageFromCode(locale || "en")?.name || <></>}</strong>
        </Typography>
        <Typography
          variant="body1"
          sx={{
            marginBottom: "16px",
          }}
        >
          <Link
            href={TRANSLATE_JOB_URL}
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
          <Button onClick={() => router.push(TRANSLATE_ROUTE)}>
            {t("global:language_preference.translation_progress.view_progress")}
          </Button>
        </Typography>
      </>
    </div>
  );
};

export default LanguagePickerSettings;
