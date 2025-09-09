import { Typography } from "@mui/material";
import Link from "next/link";

import Button from "@/components/Button";
import { useTranslation } from "@/i18n";
import { AUTH } from "@/i18n/namespaces";
import { loginsSETTINGS_ROUTE } from "@/routes";

export default function LoginsLink() {
  const { t } = useTranslation(AUTH);

  return (
    <div>
      <Typography variant="h2" gutterBottom>
        {t("active_logins.settings_page_text")}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {t("active_logins.settings_page_text")}
      </Typography>
      <Button component={Link} href={loginsSETTINGS_ROUTE}>
        {t("active_logins.settings_page_link")}
      </Button>
    </div>
  );
}
