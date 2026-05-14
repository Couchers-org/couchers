import { useMutation } from "@tanstack/react-query";
import { useProfileSheet } from "features/profile/ProfileSheetContext";
import { useRouter } from "next/router";
import { routeToGroupChat } from "routes";
import { service } from "service";
import { useIsNativeEmbed } from "utils/nativeLink";

interface UseMessageUserParams {
  userId: number;
  setMutationError: (value: string) => void;
  setIsMessaging: (value: boolean) => void;
}

export default function useMessageUser({
  userId,
  setMutationError,
  setIsMessaging,
}: UseMessageUserParams) {
  const router = useRouter();
  const isNativeEmbed = useIsNativeEmbed();
  const { openGroupChat } = useProfileSheet();

  return useMutation<number | false, Error>({
    mutationFn: () => service.conversations.getDirectMessage(userId),
    onMutate() {
      setMutationError("");
    },
    onError(e) {
      setMutationError(e.message);
    },
    onSuccess(groupChatId) {
      if (!groupChatId) {
        // no existing thread — open inline compose form
        setIsMessaging(true);
      } else if (isNativeEmbed) {
        openGroupChat(groupChatId);
      } else {
        router.push(routeToGroupChat(groupChatId));
      }
    },
  });
}
