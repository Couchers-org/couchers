import { Typography } from "@material-ui/core";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";

interface UsernameProps {
  username: string;
  className?: string;
}

export default function Username({ className, username }: UsernameProps) {
  const { t } = useTranslation(AUTH);

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("account_form.username.field_label")}
      </Typography>
      <Typography variant="body1">
        <Trans t={t} i18nKey="username_section.description">
          Your username is <strong>{{ username }}</strong>.
        </Trans>
      </Typography>
      <Typography variant="body1">
        {t("username_section.explanation")}
      </Typography>
    </div>
  );
}
