import { Typography } from "@material-ui/core";
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
      <Typography variant="h2">{t("timezone_section.title")}</Typography>
      <Typography variant="body1">
        <Trans t={t} i18nKey="timezone_section.description">
          Your timezone is <strong>{{ timezone: timezone }}</strong>, based on
          this, your local time is approximately{" "}
          <strong>{{ time: dayjs().tz(timezone).format("LT") }}</strong>.
        </Trans>
      </Typography>
      <Typography variant="body1">
        {t("timezone_section.timezone_explanation")}
      </Typography>
    </div>
  );
}
