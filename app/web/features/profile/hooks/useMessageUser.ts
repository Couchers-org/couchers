import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { routeToGroupChat } from "routes";
import { service } from "service";

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
        // no existing thread — open inline form
        setIsMessaging(true);
      } else {
        // has thread
        router.push(routeToGroupChat(groupChatId));
      }
    },
  });
}
