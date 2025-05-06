import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import StyledLink from "components/StyledLink";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { InitiateStrongVerificationRes } from "proto/account_pb";
import { useState } from "react";
import { useMutation } from "react-query";
import { tosRoute } from "routes";
import { service } from "service";

export default function StartStrongVerificationButton() {
  const { t } = useTranslation([GLOBAL, AUTH]);

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
    },
  );

  return (
    <>
      <Dialog aria-labelledby="strong-verification-start-dialog" open={open}>
        <DialogTitle id="strong-verification-start-dialog">
          {t("auth:strong_verification.title")}
        </DialogTitle>
        <DialogContent>
          {error && (
            <DialogContentText>
              <Alert severity="error">{error.message}</Alert>
            </DialogContentText>
          )}
          <DialogContentText>
            <Trans i18nKey="auth:strong_verification.information_text1">
              You will need a <strong>biometric passport</strong> (other types
              of identification will not work) and an NFC-capable Apple iPhone
              or Android phone.
            </Trans>
          </DialogContentText>
          <DialogContentText>
            {t("auth:strong_verification.information_text2")}
          </DialogContentText>
          <DialogContentText variant="body2">
            <Trans i18nKey="auth:strong_verification.information_text3">
              You can read more about how we and Iris ID process and store your
              data in our{" "}
              <StyledLink href={tosRoute} target="_blank">
                Terms of Service
              </StyledLink>
              . As per the{" "}
              <StyledLink
                href="https://passportreader.app/privacy"
                target="_blank"
              >
                Privacy policy
              </StyledLink>
              , they will delete your personal information within 24 hours.
            </Trans>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => startStrongVerification()} loading={isLoading}>
            {t("auth:strong_verification.begin_button")}
          </Button>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            {t("global:cancel")}
          </Button>
        </DialogActions>
      </Dialog>
      <Button loading={isLoading} onClick={() => setOpen(true)}>
        {t("auth:strong_verification.start_button")}
      </Button>
    </>
  );
}
