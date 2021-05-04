import { User } from "pb/api_pb";
import { Route, Switch } from "react-router-dom";

import { leaveReferenceBaseRoute } from "../../../routes";
import Appropriate from "./formSteps/Appropriate";
import Rating from "./formSteps/Rating";
import SubmitFriendReference from "./formSteps/SubmitFriendReference";
import SubmitRequestReference from "./formSteps/SubmitRequestReference";
import Text from "./formSteps/Text";

interface ReferenceFormProps {
  user: User.AsObject;
  referenceType: string;
  hostRequestId?: number;
}

export default function ReferenceForm({
  user,
  referenceType,
  hostRequestId,
}: ReferenceFormProps) {
  return (
    <Switch>
      <Route
        exact
        path={`${leaveReferenceBaseRoute}/:referenceType/:userId`}
        render={(props) => <Appropriate {...props} user={user} />}
      />
      <Route
        path={`${leaveReferenceBaseRoute}/:referenceType/:userId/rating`}
        render={(props) => <Rating {...props} user={user} />}
      />
      <Route
        path={`${leaveReferenceBaseRoute}/:referenceType/:userId/reference`}
        render={(props) => <Text {...props} user={user} />}
      />
      {referenceType === "friend" ? (
        <Route
          path={`${leaveReferenceBaseRoute}/:referenceType/:userId/submit`}
          render={(props) => <SubmitFriendReference {...props} user={user} />}
        />
      ) : (
        hostRequestId && (
          <Route
            path={`${leaveReferenceBaseRoute}/:referenceType/:userId/submit`}
            render={(props) => (
              <SubmitRequestReference
                {...props}
                user={user}
                hostRequestId={hostRequestId}
              />
            )}
          />
        )
      )}
    </Switch>
  );
}
