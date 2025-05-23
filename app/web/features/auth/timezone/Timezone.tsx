import { Typography } from "@mui/material";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import dayjs from "utils/dayjs";

interface TimezoneProps {
  className?: string;
  timezone: string;
}

export default function Timezone({ className, timezone }: TimezoneProps) {
  const { t } = useTranslation(AUTH);

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
            time: dayjs().tz(timezone).format("LT"),
          }}
        >
          {`Your timezone is `}
          <strong>{timezone}</strong>. Based on this, your local time is
          approximately{` `}
          <strong>{dayjs().tz(timezone).format("LT")}</strong>
          {`.`}
        </Trans>
      </Typography>
      <Typography variant="body1">
        {t("account_settings_page.timezone_section.explanation")}
      </Typography>
    </div>
  );
}
