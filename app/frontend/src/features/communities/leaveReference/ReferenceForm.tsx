import Appropriate from "features/communities/leaveReference/formSteps/Appropriate";
import Rating from "features/communities/leaveReference/formSteps/Rating";
import SubmitFriendReference from "features/communities/leaveReference/formSteps/submit/SubmitFriendReference";
import SubmitHostRequestReference from "features/communities/leaveReference/formSteps/submit/SubmitHostRequestReference";
import Text from "features/communities/leaveReference/formSteps/Text";
import { ReferenceDataProvider } from "features/communities/leaveReference/ReferenceDataContext";
import { User } from "pb/api_pb";
import { Route, Switch, useParams } from "react-router-dom";
import { leaveReferenceBaseRoute } from "routes";
import makeStyles from "utils/makeStyles";

export const useReferenceStyles = makeStyles((theme) => ({
  alert: {
    marginBottom: theme.spacing(3),
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    paddingTop: theme.spacing(1),
  },
  card: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  form: {
    marginBottom: theme.spacing(2),
  },
  text: {
    [theme.breakpoints.up("md")]: {
      "& > .MuiInputBase-root": {
        width: 400,
      },
    },
    "& > .MuiInputBase-root": {
      width: "100%",
    },
    marginTop: theme.spacing(1),
  },
}));

export interface ReferenceFormProps {
  user: User.AsObject;
  hostRequestId?: number;
}

export type ReferenceFormInputs = {
  text: string;
  wasAppropriate: boolean;
  rating: number;
};

export default function ReferenceForm({
  user,
  hostRequestId,
}: ReferenceFormProps) {
  const { referenceType } = useParams<{
    referenceType: string;
  }>();

  return (
    <ReferenceDataProvider>
      {referenceType === "friend" ? (
        <Switch>
          <Route
            exact
            path={`${leaveReferenceBaseRoute}/:referenceType/:userId/:hostRequest?`}
          >
            <Appropriate user={user} />
          </Route>
          <Route
            path={`${leaveReferenceBaseRoute}/:referenceType/:userId/rating/:hostRequest?`}
          >
            <Rating user={user} />
          </Route>
          <Route
            path={`${leaveReferenceBaseRoute}/:referenceType/:userId/reference/:hostRequest?`}
          >
            <Text user={user} />
          </Route>
          <Route
            path={`${leaveReferenceBaseRoute}/:referenceType/:userId/submit`}
          >
            <SubmitFriendReference user={user} />
          </Route>
        </Switch>
      ) : (
        <Switch>
          <Route
            exact
            path={`${leaveReferenceBaseRoute}/:referenceType/:userId/:hostRequest`}
          >
            <Appropriate user={user} />
          </Route>
          <Route
            path={`${leaveReferenceBaseRoute}/:referenceType/:userId/:hostRequest/rating`}
          >
            <Rating user={user} />
          </Route>
          <Route
            path={`${leaveReferenceBaseRoute}/:referenceType/:userId/:hostRequest/reference`}
          >
            <Text user={user} />
          </Route>
          <Route
            path={`${leaveReferenceBaseRoute}/:referenceType/:userId/:hostRequest/submit`}
          >
            <SubmitHostRequestReference
              user={user}
              hostRequestId={hostRequestId}
            />
          </Route>
        </Switch>
      )}
    </ReferenceDataProvider>
  );
}
