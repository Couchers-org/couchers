import { Typography } from "@mui/material";
import { Trans, useTranslation } from "i18n";
import { localizeDateTime } from "i18n/dates";
import { AUTH } from "i18n/namespaces";
import dayjs from "utils/dayjs";

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
      <Typography variant="h2">
        {t("account_settings_page.timezone_section.title")}
      </Typography>
      <Typography variant="body1">
        <Trans
          t={t}
          i18nKey="account_settings_page.timezone_section.description"
          values={{
            timezone: timezone,
            time: localizeDateTime(dayjs(), {
              timezone,
              locale,
              includeDate: false,
            }),
          }}
        >
          {`Your timezone is `}
          <strong>{timezone}</strong>. Based on this, your local time is
          approximately{` `}
          <strong>
            {localizeDateTime(dayjs(), {
              timezone,
              locale,
              includeDate: false,
            })}
          </strong>
          {`.`}
        </Trans>
      </Typography>
      <Typography variant="body1">
        {t("account_settings_page.timezone_section.explanation")}
      </Typography>
    </div>
  );
}
