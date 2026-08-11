import { Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";

interface UsernameProps {
  username: string;
  className?: string;
}

export default function Username({ className, username }: UsernameProps) {
  const { t } = useTranslation(AUTH);

  return (
    <div className={className}>
      <Typography variant="h2">{t("account_settings_page.username_section.title")}</Typography>
      <Typography variant="body1">{t("account_settings_page.username_section.description", { username })}</Typography>
      <Typography variant="body1">{t("account_settings_page.username_section.explanation")}</Typography>
    </div>
  );
}
