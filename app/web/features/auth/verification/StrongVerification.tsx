import { Link, Typography } from "@mui/material";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { GetAccountInfoRes } from "proto/account_pb";
import { theme } from "theme";

import DeleteStrongVerificationDataButton from "./DeleteStrongVerificationDataButton";
import StartStrongVerificationButton from "./StartStrongVerificationButton";

type StrongVerificationProps = {
  accountInfo: GetAccountInfoRes.AsObject;
  className?: string;
};

export default function StrongVerification({ className, accountInfo }: StrongVerificationProps) {
  const { t } = useTranslation(AUTH);

  return (
    <div className={className} id="strong-verification">
      <Typography variant="h2">{t("strong_verification.title")}</Typography>
      <Typography variant="body1" gutterBottom>
        {t("strong_verification.subtitle")}
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: theme.spacing(2) }}>
        <Trans
          t={t}
          i18nKey={
            accountInfo.hasStrongVerification
              ? "strong_verification.status.enabled_message"
              : "strong_verification.status.disabled_message"
          }
        >
          You <strong>are currently</strong> verified with Strong Verification.
        </Trans>
      </Typography>
      <Typography
        variant="body1"
        sx={{
          marginBottom: "16px",
        }}
      >
        <Trans
          t={t}
          i18nKey="strong_verification.learn_more"
          components={{
            a: (
              <Link
                href="https://help.couchers.org/hc/couchersorg-help-center/en/categories/strong-verification"
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
          }}
        />
      </Typography>
      {accountInfo.hasStrongVerification ? <DeleteStrongVerificationDataButton /> : <StartStrongVerificationButton />}
    </div>
  );
}
