import Button from "components/Button";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { User } from "proto/api_pb";
import { useMutation } from "react-query";
import { routeToCreateMessage, routeToGroupChat } from "routes";
import { service } from "service";

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
          router.push(routeToCreateMessage(user.username));
        } else {
          //has thread
          router.push(routeToGroupChat(data));
        }
      },
    }
  );

  return (
    <Button loading={isLoading} onClick={() => mutate()}>
      {t("actions.message_label")}
    </Button>
  );
}
