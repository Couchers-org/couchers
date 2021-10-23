import { Dialog, DialogContent, DialogTitle } from "components/Dialog";
import CommunityBrowser from "features/dashboard/CommunityBrowser";
import { ALL_COMMUNITIES_HEADING } from "features/dashboard/constants";

export default function CommunitiesDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      aria-labelledby="communities-dialog-title"
      open={isOpen}
      onClose={onClose}
    >
      <DialogTitle id="communities-dialog-title" onClose={onClose}>
        {ALL_COMMUNITIES_HEADING}
      </DialogTitle>
      <DialogContent>
        <CommunityBrowser />
      </DialogContent>
    </Dialog>
  );
}
