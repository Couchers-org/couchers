import Appropriate from "features/profile/view/leaveReference/formSteps/Appropriate";
import Rating from "features/profile/view/leaveReference/formSteps/Rating";
import SubmitReference from "features/profile/view/leaveReference/formSteps/submit/SubmitReference";
import Text from "features/profile/view/leaveReference/formSteps/Text";
import { ReferenceDataProvider } from "features/profile/view/leaveReference/ReferenceDataContext";
import { User } from "pb/api_pb";
import { Route, Switch } from "react-router-dom";
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
    "& > .MuiInputBase-root": {
      width: "100%",
    },
    marginTop: theme.spacing(1),
    [theme.breakpoints.up("md")]: {
      "& > .MuiInputBase-root": {
        width: 400,
      },
    },
  },
}));

export interface ReferenceFormProps {
  user: User.AsObject;
}

export type ReferenceFormInputs = {
  text: string;
  wasAppropriate: boolean;
  rating: number;
};

export default function ReferenceForm({ user }: ReferenceFormProps) {
  return (
    <ReferenceDataProvider>
      <Switch>
        <Route
          path={`${leaveReferenceBaseRoute}/:referenceType/:userId/rating`}
        >
          <Rating user={user} />
        </Route>
        <Route
          path={`${leaveReferenceBaseRoute}/:referenceType/:userId/reference`}
        >
          <Text user={user} />
        </Route>
        <Route
          path={`${leaveReferenceBaseRoute}/:referenceType/:userId/submit`}
        >
          <SubmitReference user={user} />
        </Route>
        <Route
          exact
          path={`${leaveReferenceBaseRoute}/:referenceType/:userId/:hostRequest?`}
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
          <SubmitReference user={user} />
        </Route>
      </Switch>
    </ReferenceDataProvider>
  );
}
