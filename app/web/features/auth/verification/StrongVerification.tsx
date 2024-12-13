import { Typography } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { useRouter } from "next/router";
import {
  GetAccountInfoRes,
  InitiateStrongVerificationRes,
} from "proto/account_pb";
import { useState } from "react";
import { useMutation } from "react-query";
import { service } from "service";

type ChangePhoneProps = {
  accountInfo: GetAccountInfoRes.AsObject;
  className?: string;
};

function StartStrongVerificationButton() {
  const { t } = useTranslation(AUTH);

  const [open, setOpen] = useState(false);

  const router = useRouter();

  const {
    error,
    isLoading,
    mutate: startStrongVerification,
  } = useMutation<InitiateStrongVerificationRes.AsObject, RpcError>(
    service.account.initiateStrongVerification,
    {
      onSuccess: async (data) => {
        router.push(data.redirectUrl);
      },
    }
  );

  return (
    <>
      <Dialog aria-labelledby="strong-verification-start-dialog" open={open}>
        <DialogTitle id="strong-verification-start-dialog">
          {t("strong_verification.title")}
        </DialogTitle>
        <DialogContent>
          {error && (
            <DialogContentText>
              <Alert severity="error">{error.message}</Alert>
            </DialogContentText>
          )}
          <DialogContentText>
            {t("strong_verification.information_text1")}
          </DialogContentText>
          <DialogContentText>
            {t("strong_verification.information_text2")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => startStrongVerification()} loading={isLoading}>
            {t("strong_verification.begin_button")}
          </Button>
        </DialogActions>
      </Dialog>
      <Button loading={isLoading} onClick={() => setOpen(true)}>
        {t("strong_verification.begin_button")}
      </Button>
    </>
  );
}

export default function StrongVerification({
  className,
  accountInfo,
}: ChangePhoneProps) {
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
      {!accountInfo.hasStrongVerification && <StartStrongVerificationButton />}
    </div>
  );
}
