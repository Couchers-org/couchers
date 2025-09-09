import { Typography } from "@mui/material";
import Link from "next/link";

import Button from "@/components/Button";
import { useTranslation } from "@/i18n";
import { NOTIFICATIONS } from "@/i18n/namespaces";
import { NOTIFICATION_SETTINGS_ROUTE } from "@/routes";

const NotificationSettings = () => {
  const { t } = useTranslation([NOTIFICATIONS]);

  return (
    <div>
      <Typography variant="h2" gutterBottom>
        {t("notification_settings.title")}
      </Typography>
      <Button component={Link} href={NOTIFICATION_SETTINGS_ROUTE}>
        {t("notification_settings.go_to_button")}
      </Button>
    </div>
  );
};

export default NotificationSettings;
