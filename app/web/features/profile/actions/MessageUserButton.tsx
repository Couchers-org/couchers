import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useState } from "react";

import Button from "@/components/Button";
import ProfileIncompleteDialog from "@/components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import useAccountInfo from "@/features/auth/useAccountInfo";
import { useTranslation } from "@/i18n";
import { PROFILE } from "@/i18n/namespaces";
import { User } from "@/proto/api_pb";
import { service } from "@/service";

import { routeToCreateMessage, routeToGroupChat } from "../../../routes";

export default function MessageUserButton({
  user,
  setMutationError,
}: {
  user: User.AsObject;
  setMutationError: (value: string) => void;
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
        //no existing thread
        router.push(routeToCreateMessage(user.username));
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
