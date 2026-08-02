import { Typography } from "@mui/material";
import { Trans, useTranslation } from "i18n";
import { localizeDateTime } from "i18n/datetimes";
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
          components={{
            1: <strong />,
            4: <strong />,
          }}
          values={{
            timezone: timezone,
            time: localizeDateTime(Temporal.Now.plainDateTimeISO(timezone), {
              locale,
              includeDate: false,
            }),
          }}
        />
      </Typography>
      <Typography variant="body1">{t("account_settings_page.timezone_section.explanation")}</Typography>
    </div>
  );
}
