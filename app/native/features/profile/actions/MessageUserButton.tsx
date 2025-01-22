import Button from "@/components/Button";
import useAccountInfo from "@/features/auth/useAccountInfo";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { useRouter } from "expo-router";
import { User } from "proto/api_pb";
import { useState } from "react";
import { useMutation } from "react-query";
import { routeToCreateMessage, routeToGroupChat } from "@/routes";
import { service } from "@/service";

export default function MessageUserButton({
  user,
  setMutationError,
}: {
  user: User.AsObject;
  setMutationError: (value: string) => void;
}) {
  const { t } = useTranslation(PROFILE);
  const router = useRouter();
  const { mutate, isLoading } = useMutation<number | false, Error>(
    () => service.conversations.getDirectMessage(user.userId),
    {
      onMutate() {
        setMutationError("");
      },
      onError(e) {
        setMutationError(e.message);
      },
      onSuccess(data) {
        if (!data) {
          //no existing thread
          router.push(routeToCreateMessage(user.username) as any);
        } else {
          //has thread
          router.push(routeToGroupChat(data) as any);
        }
      },
    }
  );

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
      {/* <ProfileIncompleteDialog
        open={showCantMessageDialog}
        onClose={() => setShowCantMessageDialog(false)}
        attempted_action="send_message"
      /> */}
      <Button
        loading={isLoading}
        onPress={onClick}
        disabled={isAccountInfoLoading}
        title={t("actions.message_label")}
      />
    </>
  );
}
