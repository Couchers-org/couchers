import { useMutation } from "@tanstack/react-query";
import { RpcError } from "grpc-web";
import { useRouter } from "next/router";
import { useState } from "react";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@/components/Dialog";
import StyledLink from "@/components/StyledLink";
import { Trans, useTranslation } from "@/i18n";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import { InitiateStrongVerificationRes } from "@/proto/account_pb";
import { TOS_ROUTE } from "@/routes";
import { service } from "@/service";

const StartStrongVerificationButton = () => {
  const { t } = useTranslation([GLOBAL, AUTH]);

  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

  const {
    error,
    isPending,
    mutate: startStrongVerification,
  } = useMutation<InitiateStrongVerificationRes.AsObject, RpcError>({
    mutationFn: () => service.account.initiateStrongVerification(),
    onSuccess: async (data) => {
      await router.push(data.redirectUrl);
    },
  });

  return (
    <>
      <Dialog aria-labelledby="strong-verification-start-dialog" open={isOpen}>
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
              <StyledLink href={TOS_ROUTE} target="_blank">
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
          <Button
            onClick={() => {
              startStrongVerification();
            }}
            loading={isPending}
          >
            {t("auth:strong_verification.begin_button")}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            {t("global:cancel")}
          </Button>
        </DialogActions>
      </Dialog>
      <Button
        loading={isPending}
        onClick={() => {
          setIsOpen(true);
        }}
      >
        {t("auth:strong_verification.start_button")}
      </Button>
    </>
  );
};

export default StartStrongVerificationButton;
