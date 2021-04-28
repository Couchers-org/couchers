import { User } from "pb/api_pb";
import { Route, Switch } from "react-router-dom";

import { leaveReferenceBaseRoute } from "../../../routes";
import Appropriate from "./formSteps/Appropriate";
import Rating from "./formSteps/Rating";
import SubmitFriendReference from "./formSteps/SubmitFriendReference";
import Text from "./formSteps/Text";

interface FriendReferenceFormProps {
  user: User.AsObject;
}

export default function FriendReferenceForm({
  user,
}: FriendReferenceFormProps) {
  return (
    <Switch>
      <Route
        exact
        path={`${leaveReferenceBaseRoute}/:referenceType/:userId`}
        render={(props) => (
          <Appropriate {...props} user={user} refType={"friend"} />
        )}
      />
      <Route
        path={`${leaveReferenceBaseRoute}/:referenceType/:userId/rating`}
        render={(props) => <Rating {...props} user={user} refType={"friend"} />}
      />
      <Route
        path={`${leaveReferenceBaseRoute}/:referenceType/:userId/reference`}
        render={(props) => <Text {...props} user={user} refType={"friend"} />}
      />
      <Route
        path={`${leaveReferenceBaseRoute}/:referenceType/:userId/submit`}
        render={(props) => <SubmitFriendReference {...props} user={user} />}
      />
    </Switch>
  );
}
