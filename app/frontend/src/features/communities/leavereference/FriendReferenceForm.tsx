import { User } from "pb/api_pb";
import { useState } from "react";
import { Route, Switch } from "react-router-dom";
import { WriteFriendReferenceInput } from "service/references";

import { leaveReferenceBaseRoute } from "../../../routes";
import Appropriate from "./formSteps/Appropriate";
import Rating from "./formSteps/Rating";
import SubmitFriendReference from "./formSteps/SubmitFriendReference";
import Text from "./formSteps/Text";

interface FriendReferenceFormProps {
  user: User.AsObject;
}

const defaultData: WriteFriendReferenceInput = {
  toUserId: 0,
  wasAppropriate: false,
  text: "",
  rating: 0,
};

export default function FriendReferenceForm({
  user,
}: FriendReferenceFormProps) {
  const [requestData, setRequestData] = useState(defaultData);

  return (
    <Switch>
      <Route
        exact
        path={`${leaveReferenceBaseRoute}/:referenceType/:userId`}
        render={(props) => (
          <Appropriate
            {...props}
            requestData={requestData}
            setRequestData={setRequestData}
            user={user}
          />
        )}
      />
      <Route
        path={`${leaveReferenceBaseRoute}/:referenceType/:userId/rating`}
        render={(props) => (
          <Rating
            {...props}
            requestData={requestData}
            setRequestData={setRequestData}
            user={user}
          />
        )}
      />
      <Route
        path={`${leaveReferenceBaseRoute}/:referenceType/:userId/reference`}
        render={(props) => (
          <Text
            {...props}
            requestData={requestData}
            setRequestData={setRequestData}
            user={user}
          />
        )}
      />
      <Route
        path={`${leaveReferenceBaseRoute}/:referenceType/:userId/submit`}
        render={(props) => (
          <SubmitFriendReference
            {...props}
            requestData={requestData}
            setRequestData={setRequestData}
            user={user}
          />
        )}
      />
    </Switch>
  );
}
