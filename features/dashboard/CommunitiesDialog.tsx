import { Dialog, DialogContent, DialogTitle } from "components/Dialog";
import CommunityBrowser from "features/dashboard/CommunityBrowser";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";

export default function CommunitiesDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation([DASHBOARD]);
  return (
    <Dialog
      aria-labelledby="communities-dialog-title"
      open={isOpen}
      onClose={onClose}
    >
      <DialogTitle id="communities-dialog-title" onClose={onClose}>
        {t("dashboard:all_communities_heading")}
      </DialogTitle>
      <DialogContent>
        <CommunityBrowser />
      </DialogContent>
    </Dialog>
  );
}
