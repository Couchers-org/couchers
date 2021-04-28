import { User } from "pb/api_pb";
import { Route, Switch } from "react-router-dom";

import Appropriate from "./formSteps/Appropriate";
import Rating from "./formSteps/Rating";
import SubmitRequestReference from "./formSteps/SubmitRequestReference";
import Text from "./formSteps/Text";

interface RequestReferenceFormProps {
  user: User.AsObject;
  hostRequest: number;
}

export default function RequestReferenceForm({
  user,
}: RequestReferenceFormProps) {
  return (
    <Switch>
      <Route
        exact
        path="/"
        render={(props) => (
          <Appropriate {...props} refType={"hosted"} user={user} />
        )}
      />
      <Route
        path="/2"
        render={(props) => <Rating {...props} user={user} refType={"hosted"} />}
      />
      <Route
        path="/3"
        render={(props) => <Text {...props} user={user} refType={"hosted"} />}
      />
      <Route
        path="submit"
        render={(props) => <SubmitRequestReference {...props} user={user} />}
      />
    </Switch>
  );
}
