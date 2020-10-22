import { debounce, Typography } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import ErrorAlert from "../components/ErrorAlert";
import { signup } from "../features/auth/authActions";
import { useAppDispatch, useTypedSelector } from "../store";
import { SignupRes } from "../pb/auth_pb";
import { authError, clearError } from "../features/auth/authSlice";
import { HostingStatus } from "../pb/api_pb";
import Autocomplete from "../components/Autocomplete";
import { getSignupEmail, submitEmail, validateUsername } from "../libs/signup";
import { signupRoute, signupSentRoute } from "../AppRoutes";
import { useForm } from "react-hook-form";

const optionLabels = {
  [HostingStatus.HOSTING_STATUS_CAN_HOST]: "Can host",
  [HostingStatus.HOSTING_STATUS_MAYBE]: "Can maybe host",
  [HostingStatus.HOSTING_STATUS_DIFFICULT]: "Difficult to host",
  [HostingStatus.HOSTING_STATUS_CANT_HOST]: "Can't host",
  [HostingStatus.HOSTING_STATUS_UNSPECIFIED]: "",
  [HostingStatus.HOSTING_STATUS_UNKNOWN]: "",
};

type SignupInputs = {
  email: string;
  username: string;
  name: string;
  birthdate: string;
  city: string;
  gender: string;
  hostingStatus: HostingStatus;
};

export default function Signup() {
  const dispatch = useAppDispatch();
  const authToken = useTypedSelector((state) => state.auth.authToken);
  const error = useTypedSelector((state) => state.auth.error);
  const authLoading = useTypedSelector((state) => state.auth.loading);

  const [loading, setLoading] = useState(false);

  const history = useHistory();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    errors,
  } = useForm<SignupInputs>({ shouldUnregister: false, mode: "onChange" });

  /*const [username, setUsername] = useState("");
  const debouncedUsername = useDebouncedValue(username, 500);
  const [usernameError, setUsernameError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState(
    //default date -> 25 years ago
    new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000)
  );
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [hostingStatus, setHostingStatus] = useState(
    HostingStatus.HOSTING_STATUS_UNSPECIFIED
  );*/

  const sendToken = async () => {
    setLoading(true);
    dispatch(clearError());
    try {
      const next = await submitEmail(getValues("email"));
      switch (next) {
        case SignupRes.SignupStep.EMAIL_EXISTS:
          throw Error("That email is already in use.");
        case SignupRes.SignupStep.INVALID_EMAIL:
          throw Error("That email isn't valid.");
        case SignupRes.SignupStep.SENT_SIGNUP_EMAIL:
          history.push(signupSentRoute);
          break;
      }
    } catch (err) {
      dispatch(authError(err.message));
    }
    setLoading(false);
  };

  //check for a signup token
  const { urlToken } = useParams<{ urlToken: string }>();
  const location = useLocation();
  useEffect(() => {
    (async () => {
      if (urlToken && location.pathname !== signupSentRoute) {
        setLoading(true);
        try {
          setValue("email", await getSignupEmail(urlToken), {
            shouldDirty: true,
          });
        } catch (err) {
          dispatch(authError("Signup token invalid."));
          history.push(signupRoute);
        }
        setLoading(false);
      }
    })();
  }, [urlToken, dispatch]);

  const completeSignup = handleSubmit(async (data: SignupInputs) => {
    const parsedBirthdate = new Date(data.birthdate);
    dispatch(
      signup({
        signupToken: urlToken,
        username: data.username,
        name: data.name,
        city: data.city,
        birthdate: parsedBirthdate,
        gender: data.gender,
        hostingStatus: data.hostingStatus,
      })
    );
    console.log({
      signupToken: urlToken,
      username: data.username,
      name: data.name,
      city: data.city,
      birthdate: parsedBirthdate,
      gender: data.gender,
      hostingStatus: data.hostingStatus,
    });
  });

  return (
    <>
      {authToken && <Redirect to="/" />}
      <Typography variant="h2">Signup</Typography>
      {error && <ErrorAlert error={error} />}

      <Switch>
        <Route path={signupSentRoute}>
          {!getValues("email") && <Redirect to={signupRoute} />}
          <Typography>
            A link to continue has been sent to {getValues("email")}.
          </Typography>
        </Route>
        //email entry
        <Route exact path={`${signupRoute}`}>
          <TextInput
            key="emailStep1"
            name="email"
            label="Email"
            inputRef={register({
              required: true,
            })}
          />
          <Button onClick={sendToken} loading={loading || authLoading}>
            Sign up
          </Button>
        </Route>
        //complete signup form
        <Route path={`${signupRoute}/:urlToken?`}>
          <form onSubmit={completeSignup}>
            <TextInput
              key="emailStep2"
              label="Email"
              value={getValues("email")}
              disabled
            />
            <TextInput
              name="name"
              label="Name"
              inputRef={register({
                required: "Enter your name",
                pattern: {
                  value: /\S+/,
                  message: "Name can't be just white space.",
                },
              })}
              helperText={errors?.name?.message}
            />
            <TextInput
              name="username"
              label="Username"
              inputRef={register({
                required: "Enter your username",
                pattern: {
                  value: /[a-z][0-9a-z_]*[a-z0-9]$/,
                  message:
                    "Username can only have letters, numbers or _, starting with a letter.",
                },
                ///TODO: Debounce
                validate: validateUsername,
              })}
              helperText={errors?.username?.type}
            />
            <TextInput
              name="city"
              label="City"
              inputRef={register({
                required: "Enter your city",
              })}
              helperText={errors?.city?.message}
            />
            <Autocomplete<string, false, true, true>
              label="Gender"
              onInputChange={(_event, value) => setValue("gender", value)}
              options={["Male", "Female", "<Type anything you like>"]}
              freeSolo
            />
            <TextInput
              name="birthdate"
              label="Birthdate"
              inputRef={register({
                required: "Enter your birthdate",
                validate: (stringDate) =>
                  !isNaN(new Date(stringDate).getTime()) || "Not a valid date.",
              })}
              helperText={errors?.birthdate?.message}
            />
            <Autocomplete<
              HostingStatus,
              false, //not multiple
              true, //not clearable
              false //not freely typeable
            >
              label="Hosting status"
              onChange={(_event, option) => setValue("hostingStatus", option)}
              options={[
                HostingStatus.HOSTING_STATUS_CAN_HOST,
                HostingStatus.HOSTING_STATUS_MAYBE,
                HostingStatus.HOSTING_STATUS_DIFFICULT,
                HostingStatus.HOSTING_STATUS_CANT_HOST,
              ]}
              getOptionLabel={(option) => optionLabels[option]}
              disableClearable
            />
            <Button onClick={completeSignup} loading={loading || authLoading}>
              Sign up
            </Button>
          </form>
        </Route>
      </Switch>
    </>
  );
}
