import { Typography } from "@mui/material";
import Button from "components/Button";
import { useTranslation } from "i18n";
import { NOTIFICATIONS } from "i18n/namespaces";
import Link from "next/link";
import { notificationSettingsRoute } from "routes";

export default function NotificationSettings() {
  const { t } = useTranslation([NOTIFICATIONS]);

  return (
    <div>
      <Typography variant="h2" gutterBottom>
        {t("notification_settings.title")}
      </Typography>
      <Link href={notificationSettingsRoute} passHref legacyBehavior>
        <Button>{t("notification_settings.go_to_button")}</Button>
      </Link>
    </div>
  );
}
