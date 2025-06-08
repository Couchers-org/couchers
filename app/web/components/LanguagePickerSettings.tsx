import { Link, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { getLangCookie } from "i18n/getLangCookie";
import { GLOBAL } from "i18n/namespaces";

import LanguagePickerSelect from "./LanguagePickerSelect";

const VOLUNTEER_PAGE_LINK = "https://couchers.org/volunteer";

interface ChangeLanguageProps {
  className?: string;
}

export default function LanguagePickerSettings({
  className,
}: ChangeLanguageProps) {
  const { t } = useTranslation([GLOBAL]);
  const couchersPreferredLanguage = getLangCookie();

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("global:language_preference.form_title")}
      </Typography>
      <>
        <Typography variant="body1">
          {`${t("global:language_preference.current_preferred_language")}`}
          <strong>{LANGUAGE_MAP[couchersPreferredLanguage]?.name}</strong>
        </Typography>
        <Typography variant="body1" paragraph>
          <Link
            href={VOLUNTEER_PAGE_LINK}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            <strong>{t("global:language_preference.help_translate")}</strong>
          </Link>
        </Typography>
        <LanguagePickerSelect displayMode="rect" />
      </>
    </div>
  );
}
