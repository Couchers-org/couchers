import { Typography } from "@mui/material";
import { useState } from "react";

import Button from "@/components/Button";
import TOSLink from "@/components/TOSLink";
import { Trans, useTranslation } from "@/i18n";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import { service } from "@/service";

interface TOSSectionProps {
  updateJailed: () => void;
  className?: string;
}

const TOSSection = ({ updateJailed, className }: TOSSectionProps) => {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const accept = async () => {
    setIsLoading(true);
    const info = await service.jail.acceptTOS();
    if (!info.isJailed) {
      updateJailed();
    } else {
      // if user is no longer jailed, this component will be unmounted anyway
      setIsLoading(false);
      setIsCompleted(true);
    }
  };

  return (
    <div className={className}>
      <Typography variant="body1">
        <Trans t={t} i18nKey="auth:jail.terms_of_service_section.description">
          We&apos;ve update our Terms of Service. To continue, please read and
          accept the new <TOSLink />
        </Trans>
      </Typography>
      <Button loading={isLoading} onClick={accept} disabled={isCompleted}>
        {isCompleted ? t("global:thanks") : t("global:accept")}
      </Button>
    </div>
  );
};

export default TOSSection;
