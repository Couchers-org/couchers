import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "components/Dialog";
import Snackbar from "components/Snackbar";
import { accountInfoQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { service } from "service";

export default function DeleteStrongVerificationDataButton() {
  const { t } = useTranslation([GLOBAL, AUTH]);

  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutate: deleteData,
  } = useMutation<void, RpcError>({
    mutationFn: () => service.account.deleteStrongVerificationData(),
    onSuccess: () => {
      setOpen(false);
      setDeleted(true);
      queryClient.invalidateQueries({
        queryKey: [accountInfoQueryKey],
      });
    },
  });

  return (
    <>
      {deleted && (
        <Snackbar severity="success">
          <>{t("auth:strong_verification.delete_success")}</>
        </Snackbar>
      )}
      <Dialog aria-labelledby="strong-verification-start-dialog" open={open}>
        <DialogTitle id="strong-verification-start-dialog">
          {t("auth:strong_verification.delete_data_title")}
        </DialogTitle>
        <DialogContent>
          {error && (
            <DialogContentText>
              <Alert severity="error">{error.message}</Alert>
            </DialogContentText>
          )}
          <DialogContentText>{t("auth:strong_verification.delete_information")}</DialogContentText>
          <DialogContentText>
            <strong>{t("auth:strong_verification.delete_information_text2")}</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => deleteData()} loading={isPending}>
            {t("auth:strong_verification.delete_my_data_button")}
          </Button>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            {t("global:cancel")}
          </Button>
        </DialogActions>
      </Dialog>
      <Button loading={isPending} onClick={() => setOpen(true)}>
        {t("auth:strong_verification.delete_button")}
      </Button>
    </>
  );
}
