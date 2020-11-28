import { Typography } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { signupRoute } from "../../../AppRoutes";
import Autocomplete from "../../../components/Autocomplete";
import Button from "../../../components/Button";
import CircularProgress from "../../../components/CircularProgress";
import TextField from "../../../components/TextField";
import { hostingStatusLabels } from "../../../constants";
import { HostingStatus } from "../../../pb/api_pb";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { signup } from "../authActions";
import { authError } from "../authSlice";
import { service } from "../../../service";
import {
  nameValidationPattern,
  usernameValidationPattern,
  validatePastDate,
} from "../../../utils/validation";

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

  const {
    control,
    register,
    handleSubmit,
    setValue,
    errors,
    getValues,
  } = useForm<SignupInputs>({
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
          setValue("email", await service.auth.getSignupEmail(urlToken), {
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
    dispatch(
      signup({
        signupToken: urlToken,
        username: data.username,
        name: data.name,
        city: data.city,
        birthdate: data.birthdate,
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
          <TextField
            name="name"
            label="Name"
            inputRef={register({
              required: "Enter your name",
              pattern: {
                value: nameValidationPattern,
                message: "Name can't be just white space.",
              },
            })}
            helperText={errors?.name?.message}
          />
          <TextField
            name="username"
            label="Username"
            inputRef={register({
              required: "Enter your username",
              pattern: {
                //copied from backend, added ^ at the start
                value: usernameValidationPattern,
                message:
                  "Username can only have lowercase letters, numbers or _, starting with a letter.",
              },
              validate: async (username) => {
                const valid = await service.auth.validateUsername(username);
                return valid || "This username is taken.";
              },
            })}
            helperText={errors?.username?.message}
          />
          <TextField
            name="city"
            label="City"
            inputRef={register({
              required: "Enter your city",
            })}
            helperText={errors?.city?.message}
          />
          <Controller
            control={control}
            name="gender"
            defaultValue=""
            render={({ onChange }) => (
              <Autocomplete
                label="Gender"
                onInputChange={(_, value) => onChange(value)}
                options={["Male", "Female", "<Type anything you like>"]}
                freeSolo
              />
            )}
          />
          <TextField
            name="birthdate"
            label="Birthdate"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            inputRef={register({
              required: "Enter your birthdate",
              validate: (stringDate) =>
                validatePastDate(stringDate) ||
                "Must be a valid date in the past.",
            })}
            helperText={errors?.birthdate?.message}
          />
          <Controller
            control={control}
            name="hostingStatus"
            defaultValue={null}
            render={({ onChange }) => (
              <Autocomplete
                label="Hosting status"
                onChange={(_, option) => onChange(option)}
                options={[
                  HostingStatus.HOSTING_STATUS_CAN_HOST,
                  HostingStatus.HOSTING_STATUS_MAYBE,
                  HostingStatus.HOSTING_STATUS_DIFFICULT,
                  HostingStatus.HOSTING_STATUS_CANT_HOST,
                ]}
                getOptionLabel={(option) => hostingStatusLabels[option]}
                disableClearable
                //below required for type inference
                multiple={false}
                freeSolo={false}
              />
            )}
          />
          <Button onClick={completeSignup} loading={authLoading || loading}>
            Sign up
          </Button>
        </form>
      )}
    </>
  );
}
