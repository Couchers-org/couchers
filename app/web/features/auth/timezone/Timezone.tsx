import { Typography } from "@mui/material";
import { Trans, useTranslation } from "i18n";
import { localizeTimeOnly } from "i18n/datetimes";
import { AUTH } from "i18n/namespaces";
import { Temporal } from "temporal-polyfill";

interface TimezoneProps {
  className?: string;
  timezone: string;
}

export default function Timezone({ className, timezone }: TimezoneProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(AUTH);

  return (
    <div className={className}>
      <Typography variant="h2">{t("account_settings_page.timezone_section.title")}</Typography>
      <Typography variant="body1">
        <Trans
          t={t}
          i18nKey="account_settings_page.timezone_section.description"
          values={{
            timezone: timezone,
            time: localizeTimeOnly(Temporal.Now.plainDateTimeISO(timezone), locale),
          }}
        />
      </Typography>
      <Typography variant="body1">{t("account_settings_page.timezone_section.explanation")}</Typography>
    </div>
  );
}
