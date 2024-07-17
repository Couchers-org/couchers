import { Link, Typography } from "@material-ui/core";
import Button from "components/Button";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { GetAccountInfoRes } from "proto/account_pb";

const STRONG_VERIFICATION_URL =
  process.env.NEXT_PUBLIC_CONSOLE_BASE_URL + "/strong-verification";

type StrongVerificationProps = {
  accountInfo: GetAccountInfoRes.AsObject;
  className?: string;
};

export default function StrongVerification({
  className,
  accountInfo,
}: StrongVerificationProps) {
  const { t } = useTranslation(AUTH);

  return (
    <div className={className}>
      <Typography variant="h2">{t("strong_verification.title")}</Typography>
      <Typography variant="body1">
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
      <Typography variant="body1">
        <Trans t={t} i18nKey="strong_verification.complete_in_console">
          You can complete Strong Verification{" "}
          <Link href={STRONG_VERIFICATION_URL}>on this page</Link>. We are
          working on improving the flow and implementing it fully in the
          platform.
        </Trans>
      </Typography>
      <Button href={STRONG_VERIFICATION_URL}>
        {t("strong_verification.go_to_button")}
      </Button>
    </div>
  );
}
