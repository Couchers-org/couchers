import { User } from "pb/api_pb";
import { useState } from "react";
import { Route, Switch } from "react-router-dom";
import { WriteHostRequestReferenceInput } from "service/references";

import Appropriate from "./formSteps/Appropriate";
import Rating from "./formSteps/Rating";
import SubmitRequestReference from "./formSteps/SubmitRequestReference";
import Text from "./formSteps/Text";

interface RequestReferenceFormProps {
  user: User.AsObject;
  hostRequest: number;
}

const defaultData: WriteHostRequestReferenceInput = {
  hostRequestId: 0,
  wasAppropriate: false,
  text: "",
  rating: 0,
};

export default function RequestReferenceForm({
  user,
  hostRequest,
}: RequestReferenceFormProps) {
  const [requestData, setRequestData] = useState(defaultData);

  return (
    <Switch>
      <Route
        exact
        path="/"
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
        path="/2"
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
        path="/3"
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
        path="submit"
        render={(props) => (
          <SubmitRequestReference
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
