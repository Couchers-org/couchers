import { Typography } from "@mui/material";
import Link from "next/link";

import Button from "@/components/Button";
import { useTranslation } from "@/i18n";
import { NOTIFICATIONS } from "@/i18n/namespaces";
import { notificationSETTINGS_ROUTE } from "@/routes";

export default function NotificationSettings() {
  const { t } = useTranslation([NOTIFICATIONS]);

  return (
    <div>
      <Typography variant="h2" gutterBottom>
        {t("notification_settings.title")}
      </Typography>
      <Button component={Link} href={notificationSETTINGS_ROUTE}>
        {t("notification_settings.go_to_button")}
      </Button>
    </div>
  );
}
