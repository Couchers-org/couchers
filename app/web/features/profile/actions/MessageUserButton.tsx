import Button from "components/Button";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import useAccountInfo from "features/auth/useAccountInfo";
import useMessageUser from "features/profile/hooks/useMessageUser";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { useState } from "react";

export default function MessageUserButton({
  user,
  setMutationError,
  setIsMessaging,
}: {
  user: User.AsObject;
  setMutationError: (value: string) => void;
  setIsMessaging: (value: boolean) => void;
}) {
  const { t } = useTranslation(PROFILE);
  const { mutate, isPending } = useMessageUser({
    userId: user.userId,
    setMutationError,
    setIsMessaging,
  });

  const [showCantMessageDialog, setShowCantMessageDialog] = useState<boolean>(false);

  const { data: accountInfo, isLoading: isAccountInfoLoading } = useAccountInfo();

  const onClick = () => {
    if (!accountInfo?.profileComplete) {
      setShowCantMessageDialog(true);
    } else {
      mutate();
    }
  };

  return (
    <>
      <ProfileIncompleteDialog
        open={showCantMessageDialog}
        onClose={() => setShowCantMessageDialog(false)}
        attempted_action="send_message"
      />
      <Button loading={isPending} onClick={onClick} disabled={isAccountInfoLoading}>
        {t("actions.message_label")}
      </Button>
    </>
  );
}
