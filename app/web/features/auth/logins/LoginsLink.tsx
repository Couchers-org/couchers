import { Typography } from "@material-ui/core";
import Button from "components/Button";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import Link from "next/link";
import { loginsSettingsRoute } from "routes";

export default function LoginsLink({ className }: { className: string }) {
  const { t } = useTranslation(AUTH);

  return (
    <div className={className}>
      <Typography variant="h2" gutterBottom>
        {t("active_logins.settings_page_text")}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {t("active_logins.settings_page_text")}
      </Typography>
      <Link href={loginsSettingsRoute} passHref>
        <Button>{t("active_logins.settings_page_link")}</Button>
      </Link>
    </div>
  );
}
