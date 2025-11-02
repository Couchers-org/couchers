import Button from "components/Button";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { strongVerificationRoute } from "routes";

export default function StartStrongVerificationButton() {
  const { t } = useTranslation([GLOBAL, AUTH]);
  const router = useRouter();

  const {
    error,
    isPending,
    mutate: startStrongVerification,
    reset,
  } = useMutation<InitiateStrongVerificationRes.AsObject, RpcError>({
    mutationFn: () => service.account.initiateStrongVerification(),
    onSuccess: async (data) => {
      router.push(data.redirectUrl);
    },
  });

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  return (
    <>
      <Dialog
        aria-labelledby="strong-verification-start-dialog"
        open={open}
        onClose={handleClose}
      >
        <DialogTitle id="strong-verification-start-dialog">
          {t("auth:strong_verification.title")}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error.message}</Alert>}
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
          <Button onClick={() => startStrongVerification()} loading={isPending}>
            {t("auth:strong_verification.begin_button")}
          </Button>
          <Button variant="outlined" onClick={handleClose}>
            {t("global:cancel")}
          </Button>
        </DialogActions>
      </Dialog>
      <Button loading={isPending} onClick={() => setOpen(true)}>
        {t("auth:strong_verification.start_button")}
      </Button>
    </>
  );
}
