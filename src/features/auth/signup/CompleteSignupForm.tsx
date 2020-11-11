import { Typography } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import Button from "../../../components/Button";
import TextInput from "../../../components/TextInput";
import { signup } from "../authActions";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { authError } from "../authSlice";
import { HostingStatus } from "../../../pb/api_pb";
import Autocomplete from "../../../components/Autocomplete";
import { getSignupEmail, validateUsername } from "./lib";
import { signupRoute } from "../../../AppRoutes";
import { useForm, ValidateResult } from "react-hook-form";
import { Skeleton } from "@material-ui/lab";
import CircularProgress from "../../../components/CircularProgress";

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

export default function CompleteSignup() {
  const dispatch = useAppDispatch();
  const authLoading = useTypedSelector((state) => state.auth.loading);

  const { register, handleSubmit, setValue, errors, getValues } = useForm<
    SignupInputs
  >({
    shouldUnregister: false,
    mode: "onBlur",
  });

  const [loading, setLoading] = useState(false);

  const { urlToken } = useParams<{ urlToken: string }>();
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    (async () => {
      if (urlToken) {
        setLoading(true);
        try {
          setValue("email", await getSignupEmail(urlToken), {
            shouldDirty: true,
          });
        } catch (err) {
          dispatch(authError(err.message));
          history.push(signupRoute);
          return;
        }
        setLoading(false);
      }
    })();
  }, [urlToken, dispatch, location.pathname, setValue, history]);

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
  });

  return (
    <>
      {loading ? (
        <CircularProgress />
      ) : (
        <form onSubmit={completeSignup}>
          <Typography variant="h3">{getValues("email")}</Typography>
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
                //copied from backend, added ^ at the start
                value: /^[a-z][0-9a-z_]*[a-z0-9]$/,
                message:
                  "Username can only have lowercase letters, numbers or _, starting with a letter.",
              },
              validate: async (username) => {
                const valid = await validateUsername(username);
                return valid || "This username is taken.";
              },
            })}
            helperText={errors?.username?.message}
          />
          <TextInput
            name="city"
            label="City"
            inputRef={register({
              required: "Enter your city",
            })}
            helperText={errors?.city?.message}
          />
          <Autocomplete
            label="Gender"
            onInputChange={(_event, value) => setValue("gender", value)}
            options={["Male", "Female", "<Type anything you like>"]}
            freeSolo
          />
          <TextInput
            name="birthdate"
            label="Birthdate"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            inputRef={register({
              required: "Enter your birthdate",
              validate: (stringDate) =>
                !isNaN(new Date(stringDate).getTime()) || "Not a valid date.",
            })}
            helperText={errors?.birthdate?.message}
          />
          <Autocomplete
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
            //below required for type inference
            multiple={false}
            freeSolo={false}
          />
          <Button onClick={completeSignup} loading={authLoading || loading}>
            Sign up
          </Button>
        </form>
      )}
    </>
  );
}
