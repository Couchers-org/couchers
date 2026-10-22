import { DialogProps } from "@mui/material";
import Button from "components/Button";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "components/Dialog";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";

const MAKE_CO_ORGANIZER_DIALOG_LABEL_ID = "make-co-organizer";

type MakeCoOrganizerDialogProps = {
  username: string;
  eventName: string;
} & DialogProps;

export default function MakeCoOrganizerDialog({
  onClose,
  onSubmit,
  username,
  eventName,
  open,
}: MakeCoOrganizerDialogProps) {
  const { t } = useTranslation([COMMUNITIES]);

  return (
    <Dialog aria-labelledby={MAKE_CO_ORGANIZER_DIALOG_LABEL_ID} open={open}>
      <DialogTitle id={MAKE_CO_ORGANIZER_DIALOG_LABEL_ID}>
        {t("communities:make_co_organizer.dialog_title", { name: username })}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("communities:make_co_organizer.dialog_text", {
            name: username,
            event: eventName,
          })}
        </DialogContentText>
        <DialogActions>
          <Button variant="outlined" onClick={() => (onClose ? onClose({}, "escapeKeyDown") : null)}>
            {t("global:cancel")}
          </Button>
          <Button onClick={onSubmit}>{t("global:confirm")}</Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
