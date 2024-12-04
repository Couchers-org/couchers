import { Typography } from "@mui/material";
import Button from "components/Button";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import Link from "next/link";
import { notificationSettingsRoute } from "routes";

export default function NotificationSettings({
  className,
}: {
  className: string;
}) {
  const { t } = useTranslation(AUTH);

  return (
    <div className={className}>
      <Typography variant="h2" gutterBottom>
        {t("notification_settings.title")}
      </Typography>
      <Link href={notificationSettingsRoute} passHref>
        <Button>{t("notification_settings.go_to_button")}</Button>
      </Link>
    </div>
  );
}
