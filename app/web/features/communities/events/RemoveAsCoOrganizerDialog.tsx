import { DialogProps } from "@mui/material";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";

const REMOVE_AS_CO_ORGANIZER_DIALOG_LABEL_ID = "make-co-organizer";

type RemoveAsCoOrganizerDialogProps = {
  username: string;
  eventName: string;
} & DialogProps;

export default function RemoveAsCoOrganizerDialog({
  onClose,
  onSubmit,
  username,
  eventName,
  open,
}: RemoveAsCoOrganizerDialogProps) {
  const { t } = useTranslation([COMMUNITIES]);

  return (
    <Dialog
      aria-labelledby={REMOVE_AS_CO_ORGANIZER_DIALOG_LABEL_ID}
      open={open}
    >
      <DialogTitle id={REMOVE_AS_CO_ORGANIZER_DIALOG_LABEL_ID}>
        {t("communities:remove_as_co_organizer.dialog_title", {
          name: username,
        })}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("communities:remove_as_co_organizer.dialog_text", {
            name: username,
            event: eventName,
          })}
        </DialogContentText>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => (onClose ? onClose({}, "escapeKeyDown") : null)}
          >
            {t("global:cancel")}
          </Button>
          <Button onClick={onSubmit}>{t("global:confirm")}</Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
