import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RpcError } from "grpc-web";
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
import Snackbar from "@/components/Snackbar";
import { ACCOUNT_INFO_QUERY_KEY } from "@/features/queryKeys";
import { useTranslation } from "@/i18n";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import { service } from "@/service";

const DeleteStrongVerificationDataButton = () => {
  const { t } = useTranslation([GLOBAL, AUTH]);

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutate: deleteData,
  } = useMutation<unknown, RpcError>({
    mutationFn: () => service.account.deleteStrongVerificationData(),
    onSuccess: () => {
      setIsOpen(false);
      setIsDeleted(true);
      void queryClient.invalidateQueries({
        queryKey: [ACCOUNT_INFO_QUERY_KEY],
      });
    },
  });

  return (
    <>
      {isDeleted && (
        <Snackbar severity="success">
          <>{t("auth:strong_verification.delete_success")}</>
        </Snackbar>
      )}
      <Dialog aria-labelledby="strong-verification-start-dialog" open={isOpen}>
        <DialogTitle id="strong-verification-start-dialog">
          {t("auth:strong_verification.delete_data_title")}
        </DialogTitle>
        <DialogContent>
          {error && (
            <DialogContentText>
              <Alert severity="error">{error.message}</Alert>
            </DialogContentText>
          )}
          <DialogContentText>
            {t("auth:strong_verification.delete_information")}
          </DialogContentText>
          <DialogContentText>
            <strong>
              {t("auth:strong_verification.delete_information_text2")}
            </strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              deleteData();
            }}
            loading={isPending}
          >
            {t("auth:strong_verification.delete_my_data_button")}
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
        {t("auth:strong_verification.delete_button")}
      </Button>
    </>
  );
};

export default DeleteStrongVerificationDataButton;
