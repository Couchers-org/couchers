import Button from "components/Button";
import { User } from "couchers-core/src/proto/api_pb";
import { service } from "couchers-core/dist/service";
import { MESSAGE } from "features/profile/constants";
import { useMutation } from "react-query";
import { useHistory } from "react-router-dom";
import { groupChatsRoute, routeToGroupChat } from "routes";

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
          history.push(groupChatsRoute, { createMessageTo: user });
        } else {
          //has thread
          history.push(routeToGroupChat(data));
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
