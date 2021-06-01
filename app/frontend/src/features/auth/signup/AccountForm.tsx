import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@material-ui/core";
import Autocomplete from "components/Autocomplete";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import Datepicker from "components/Datepicker";
import EditLocationMap, {
  ApproximateLocation,
} from "components/EditLocationMap";
import TextField from "components/TextField";
import TOSLink from "components/TOSLink";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { HOSTING_STATUS } from "features/constants";
import { hostingStatusLabels } from "features/profile/constants";
import { HostingStatus } from "pb/api_pb";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { service } from "service";
import makeStyles from "utils/makeStyles";
import {
  lowercaseAndTrimField,
  usernameValidationPattern,
  validatePastDate,
} from "utils/validation";

import {
  BIRTHDATE_LABEL,
  BIRTHDAY_PAST_ERROR,
  BIRTHDAY_REQUIRED,
  FEMALE,
  GENDER_LABEL,
  GENDER_REQUIRED,
  LOCATION_LABEL,
  MALE,
  NON_BINARY,
  SIGN_UP,
  SIGN_UP_BIRTHDAY,
  SIGN_UP_LOCATION_MISSING,
  SIGN_UP_TOS_ACCEPT,
  SIGN_UP_TOS_TEXT,
  SIGN_UP_USERNAME_ERROR,
  USERNAME,
  USERNAME_REQUIRED,
  USERNAME_TAKEN,
} from "../constants";
import { SignupFormProps } from "./Signup";

type SignupAccountInputs = {
  username: string;
  password?: string;
  name: string;
  birthdate: Date;
  gender: string;
  acceptTOS: boolean;
  hostingStatus: HostingStatus;
  location: ApproximateLocation;
};

const useStyles = makeStyles((theme) => ({
  genderRadio: {
    display: "flex",
    flexDirection: "row",
  },
  locationMap: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
    width: "100%",
  },
  firstForm: {
    paddingBottom: 0,
  },
  errorAlert: {
    marginTop: theme.spacing(2),
  },
}));

export default function AccountForm({ token, updateState }: SignupFormProps) {
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;

  const { control, register, handleSubmit, errors } =
    useForm<SignupAccountInputs>({
      defaultValues: { location: { address: "" } },
      mode: "onBlur",
      shouldUnregister: false,
    });

  const [loading, setLoading] = useState(false);
  const [acceptedTOS, setAcceptedTOS] = useState(false);

  const classes = useStyles();
  const authClasses = useAuthStyles();

  const submit = handleSubmit(async (data: SignupAccountInputs) => {
    authActions.clearError();

    if ((data.location?.address ?? "") === "") {
      authActions.authError(SIGN_UP_LOCATION_MISSING);
      return;
    }
    setLoading(true);

    try {
      // authActions catches errors here
      const res = await service.auth.signupFlowAccount(
        token,
        lowercaseAndTrimField(data.username),
        data.birthdate.toISOString().split("T")[0],
        data.gender,
        acceptedTOS,
        data.hostingStatus,
        data.location.address,
        data.location.lat,
        data.location.lng,
        data.location.radius
        // TODO password
      );
      updateState(res);
    } catch (err) {
      authActions.authError(err.message);
    }
    setLoading(false);
  });

  return (
    <>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <form
            className={`${authClasses.form} ${classes.firstForm}`}
            onSubmit={submit}
          >
            <InputLabel className={authClasses.formLabel} htmlFor="username">
              {USERNAME}
            </InputLabel>
            <TextField
              className={authClasses.formField}
              variant="standard"
              id="username"
              name="username"
              fullWidth
              inputRef={register({
                pattern: {
                  // copied from backend, added ^ at the start
                  message: SIGN_UP_USERNAME_ERROR,
                  value: usernameValidationPattern,
                },
                required: USERNAME_REQUIRED,
                validate: async (username) => {
                  const valid = await service.auth.validateUsername(username);
                  return valid || USERNAME_TAKEN;
                },
              })}
              helperText={errors?.username?.message ?? " "}
              error={!!errors?.username?.message}
            />
            <InputLabel className={authClasses.formLabel} htmlFor="birthdate">
              {SIGN_UP_BIRTHDAY}
            </InputLabel>
            <Datepicker
              className={authClasses.formField}
              control={control}
              error={!!errors?.birthdate?.message}
              helperText={errors?.birthdate?.message ?? " "}
              id="birthdate"
              inputRef={register({
                required: BIRTHDAY_REQUIRED,
                validate: (stringDate) =>
                  validatePastDate(stringDate) || BIRTHDAY_PAST_ERROR,
              })}
              label={BIRTHDATE_LABEL}
              minDate={new Date(1899, 12, 1)}
              name="birthdate"
              openTo="year"
            />
            <InputLabel className={authClasses.formLabel} htmlFor="location">
              {LOCATION_LABEL}
            </InputLabel>
          </form>
          <Controller
            name="location"
            control={control}
            inputRef={register}
            render={({ onChange }) => (
              <EditLocationMap
                className={classes.locationMap}
                updateLocation={(location) => {
                  if (location) {
                    onChange({
                      address: location.address,
                      lat: location.lat,
                      lng: location.lng,
                      radius: location.radius,
                    });
                  } else {
                    onChange({
                      address: "",
                    });
                  }
                }}
              />
            )}
          />
          <form className={authClasses.form} onSubmit={submit}>
            <InputLabel
              className={authClasses.formLabel}
              htmlFor="hosting-status"
            >
              {HOSTING_STATUS}
            </InputLabel>
            <Controller
              control={control}
              name="hostingStatus"
              defaultValue={null}
              render={({ onChange }) => (
                <Autocomplete
                  className={authClasses.formField}
                  id="hosting-status"
                  label=""
                  onChange={(_, option) => onChange(option)}
                  options={[
                    HostingStatus.HOSTING_STATUS_CAN_HOST,
                    HostingStatus.HOSTING_STATUS_MAYBE,
                    HostingStatus.HOSTING_STATUS_CANT_HOST,
                  ]}
                  getOptionLabel={(option) => hostingStatusLabels[option]}
                  disableClearable
                  // below required for type inference
                  multiple={false}
                  freeSolo={false}
                />
              )}
            />
            <InputLabel className={authClasses.formLabel} htmlFor="gender">
              {GENDER_LABEL}
            </InputLabel>
            <Controller
              id="gender"
              control={control}
              name="gender"
              defaultValue=""
              rules={{ required: GENDER_REQUIRED }}
              render={({ onChange }) => (
                <FormControl>
                  <RadioGroup
                    className={classes.genderRadio}
                    aria-label="gender"
                    name="gender-radio"
                    onChange={onChange}
                  >
                    <FormControlLabel
                      value="Female"
                      control={<Radio />}
                      label={FEMALE}
                    />
                    <FormControlLabel
                      value="Male"
                      control={<Radio />}
                      label={MALE}
                    />
                    <FormControlLabel
                      value="Non-binary"
                      control={<Radio />}
                      label={NON_BINARY}
                    />
                  </RadioGroup>
                  <FormHelperText error={!!errors?.gender?.message}>
                    {errors?.gender?.message ?? " "}
                  </FormHelperText>
                </FormControl>
              )}
            />
            <Typography variant="body1">
              {SIGN_UP_TOS_TEXT}
              <TOSLink inline />.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={(event) => setAcceptedTOS(event.target.checked)}
                />
              }
              label={SIGN_UP_TOS_ACCEPT}
            />
            <Button
              classes={{
                label: authClasses.buttonText,
                root: authClasses.button,
              }}
              onClick={submit}
              type="submit"
              loading={authLoading || loading}
              disabled={!acceptedTOS}
            >
              {SIGN_UP}
            </Button>
          </form>
        </>
      )}
    </>
  );
}
