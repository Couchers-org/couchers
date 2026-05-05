import { useMutation } from "@tanstack/react-query";
import Button from "components/Button";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import useAccountInfo from "features/auth/useAccountInfo";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { User } from "proto/api_pb";
import { useState } from "react";
import { service } from "service";

import { routeToGroupChat } from "../../../routes";

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
  const router = useRouter();
  const { mutate, isPending } = useMutation<number | false, Error>({
    mutationFn: () => service.conversations.getDirectMessage(user.userId),

    onMutate() {
      setMutationError("");
    },
    onError(e) {
      setMutationError(e.message);
    },
    onSuccess(data) {
      if (!data) {
        //no existing thread — open inline form
        setIsMessaging(true);
      } else {
        //has thread
        router.push(routeToGroupChat(data));
      }
    },
  });

  const [showCantMessageDialog, setShowCantMessageDialog] =
    useState<boolean>(false);

  const { data: accountInfo, isLoading: isAccountInfoLoading } =
    useAccountInfo();

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
      <Button
        loading={isPending}
        onClick={onClick}
        disabled={isAccountInfoLoading}
      >
        {t("actions.message_label")}
      </Button>
    </>
  );
}
