import Button from "components/Button";
import { MESSAGE } from "features/profile/constants";
import { User } from "proto/api_pb";
import { useMutation } from "react-query";
import { useHistory } from "react-router-dom";
import { groupChatsRoute, routeToGroupChat } from "routes";
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
          history.push(groupChatsRoute, { createMessageTo: user });
        } else {
          //has thread
          history.push(routeToGroupChat(data));
        }
      },
    }
  );

  return (
    <Button loading={isLoading} onClick={() => mutate()}>
      {MESSAGE}
    </Button>
  );
}
