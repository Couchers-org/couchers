import { Link, Typography } from "@material-ui/core";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";

const NOTIFICATION_SETTINGS_URL =
  process.env.NEXT_PUBLIC_CONSOLE_BASE_URL + "/notifications";

export default function NotificationSettings({
  className,
}: {
  className: string;
}) {
  const { t } = useTranslation(AUTH);

  return (
    <div className={className}>
      <Typography variant="h2">{t("notification_settings.title")}</Typography>
      <Typography variant="body1">
        <Trans t={t} i18nKey="notification_settings.edit_in_console">
          You can change your notification settings{" "}
          <Link href={NOTIFICATION_SETTINGS_URL}>on this page</Link>. We will
          soon move it here.
        </Trans>
      </Typography>
    </div>
  );
}
