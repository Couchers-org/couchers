import { Typography } from "@material-ui/core";
import Button from "components/Button";
import TOSLink from "components/TOSLink";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { service } from "service";

interface TOSSectionProps {
  updateJailed: () => void;
  className?: string;
}

export default function TOSSection({
  updateJailed,
  className,
}: TOSSectionProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const accept = async () => {
    setLoading(true);
    const info = await service.jail.acceptTOS();
    if (!info.isJailed) {
      updateJailed();
    } else {
      //if user is no longer jailed, this component will be unmounted anyway
      setLoading(false);
      setCompleted(true);
    }
  };

  return (
    <div className={className}>
      <Typography variant="body1">
        <Trans t={t} i18nKey="auth:jail.terms_of_service_section.description">
          We've update our Terms of Service. To continue, please read and accept
          the new <TOSLink />
        </Trans>
      </Typography>
      <Button loading={loading} onClick={accept} disabled={completed}>
        {completed ? t("global:thanks") : t("global:accept")}
      </Button>
    </div>
  );
}
