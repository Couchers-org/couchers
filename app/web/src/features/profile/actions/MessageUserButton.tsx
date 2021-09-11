import Button from "components/Button";
import { MESSAGE } from "features/profile/constants";
import { User } from "proto/api_pb";
import { useMutation } from "react-query";
import { useHistory } from "react-router-dom";
import { chatsRoute, routeToChat } from "routes";
import { service } from "service";

export default function MessageUserButton({
  user,
  setMutationError,
}: {
  user: User.AsObject;
  setMutationError: (value: string) => void;
}) {
  const history = useHistory();
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
          history.push(chatsRoute, { createMessageTo: user });
        } else {
          //has thread
          history.push(routeToChat(data));
        }
      },
    }
  );

  if (user.friends !== User.FriendshipStatus.FRIENDS) {
    console.error("Tried to display a message button to a non-friend.");
    return null;
  }

  return (
    <Button loading={isLoading} onClick={() => mutate()}>
      {MESSAGE}
    </Button>
  );
}
