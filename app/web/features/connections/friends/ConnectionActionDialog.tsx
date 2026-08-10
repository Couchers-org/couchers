import Button from "components/Button";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "components/Dialog";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";

interface ConnectionActionDialogProps {
  dialogConfirm: string;
  dialogId: string;
  dialogMessage: string;
  dialogTitle: string;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConnectionActionDialog = ({
  dialogConfirm,
  dialogId,
  dialogMessage,
  dialogTitle,
  isLoading,
  isOpen,
  onClose,
  onConfirm,
}: ConnectionActionDialogProps) => {
  const { t } = useTranslation([GLOBAL]);
  return (
    <Dialog aria-labelledby={dialogId} open={isOpen} onClose={onClose}>
      <DialogTitle id={dialogId}>{dialogTitle}</DialogTitle>
      <DialogContent>{dialogMessage}</DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button variant="contained" loading={isLoading} onClick={onConfirm}>
          {dialogConfirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionActionDialog;
