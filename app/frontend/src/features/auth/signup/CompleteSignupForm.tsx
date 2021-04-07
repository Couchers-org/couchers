import {
  FormControlLabel,
  InputLabel,
  makeStyles,
  Radio,
  RadioGroup,
} from "@material-ui/core";
import Autocomplete from "components/Autocomplete";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import Datepicker from "components/Datepicker";
import EditUserLocationMap, {
  ApproximateLocation,
} from "components/EditUserLocationMap";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import TOS from "components/TOS";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { HOSTING_STATUS } from "features/constants";
import { hostingStatusLabels } from "features/profile/constants";
import { HostingStatus } from "pb/api_pb";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { signupRoute } from "routes";
import { service } from "service";
import {
  nameValidationPattern,
  sanitizeName,
  usernameValidationPattern,
  validatePastDate,
} from "utils/validation";

import {
  ACCEPT,
  BIRTHDATE_LABEL,
  BIRTHDAY_PAST_ERROR,
  BIRTHDAY_REQUIRED,
  FEMALE,
  GENDER_LABEL,
  LOCATION_LABEL,
  MALE,
  NAME_EMPTY,
  NAME_REQUIRED,
  NON_BINARY,
  SIGN_UP,
  SIGN_UP_BIRTHDAY,
  SIGN_UP_FULL_NAME,
  SIGN_UP_LOCATION_MISSING,
  SIGN_UP_USERNAME_ERROR,
  THANKS,
  USERNAME,
  USERNAME_REQUIRED,
  USERNAME_TAKEN,
} from "../constants";

type SignupInputs = {
  email: string;
  username: string;
  name: string;
  birthdate: Date;
  city: string;
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
}));

export default function CompleteSignupForm() {
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    errors,
  } = useForm<SignupInputs>({
    defaultValues: { city: "", location: {} },
    mode: "onBlur",
    shouldUnregister: false,
  });

  const [loading, setLoading] = useState(false);
  const [isLocationEmpty, setIsLocationEmpty] = useState(false);
  const [acceptedTOS, setAcceptedTOS] = useState(false);

  const { urlToken } = useParams<{ urlToken: string }>();
  const location = useLocation();
  const history = useHistory();
  const classes = useStyles();
  const authClasses = useAuthStyles();

  useEffect(() => {
    (async () => {
      if (urlToken) {
        setLoading(true);
        try {
          setValue("email", await service.auth.getSignupEmail(urlToken), {
            shouldDirty: true,
          });
        } catch (err) {
          authActions.authError(err.message);
          history.push(signupRoute);
          return;
        }
        setLoading(false);
      }
    })();
  }, [urlToken, authActions, location.pathname, setValue, history]);

  const completeSignup = handleSubmit(async (data: SignupInputs) => {
    if (Object.entries(data.location).length === 0) {
      setIsLocationEmpty(true);
      return;
    }

    authActions.signup({
      acceptTOS: acceptedTOS,
      birthdate: data.birthdate.toISOString().split("T")[0],
      city: data.city,
      gender: data.gender,
      hostingStatus: data.hostingStatus,
      location: data.location,
      name: data.name,
      signupToken: urlToken,
      username: sanitizeName(data.username),
    });
  });

  return (
    <>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <form
            className={`${authClasses.form} ${classes.firstForm}`}
            onSubmit={completeSignup}
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
              helperText={errors?.username?.message}
            />
            <InputLabel className={authClasses.formLabel} htmlFor="full-name">
              {SIGN_UP_FULL_NAME}
            </InputLabel>
            <TextField
              className={authClasses.formField}
              id="full-name"
              variant="standard"
              name="name"
              fullWidth
              inputRef={register({
                pattern: {
                  message: NAME_EMPTY,
                  value: nameValidationPattern,
                },
                required: NAME_REQUIRED,
              })}
              helperText={errors?.name?.message}
            />
            <InputLabel className={authClasses.formLabel} htmlFor="birthdate">
              {SIGN_UP_BIRTHDAY}
            </InputLabel>
            <Datepicker
              className={authClasses.formField}
              control={control}
              error={!!errors.birthdate}
              helperText={errors?.birthdate?.message}
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
              <EditUserLocationMap
                className={classes.locationMap}
                // react-hook-forms doesn't set value immediately
                // so || "" prevents a uncontrolled->controlled warning
                city={getValues("city") || ""}
                setCity={(value) => setValue("city", value)}
                setLocation={(location) => {
                  setIsLocationEmpty(false);
                  return onChange({
                    lat: location.lat,
                    lng: location.lng,
                    radius: location.radius,
                  });
                }}
              />
            )}
          />
          {isLocationEmpty && <TextBody>{SIGN_UP_LOCATION_MISSING}</TextBody>}
          <form className={authClasses.form} onSubmit={completeSignup}>
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
              render={({ onChange }) => (
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
              )}
            />
            <div>
              <TOS />
              <Button
                classes={{
                  label: authClasses.buttonText,
                  root: authClasses.button,
                }}
                loading={loading}
                onClick={() => setAcceptedTOS(true)}
                disabled={acceptedTOS}
              >
                {acceptedTOS ? THANKS : ACCEPT}
              </Button>
            </div>
            <Button
              classes={{
                label: authClasses.buttonText,
                root: authClasses.button,
              }}
              onClick={completeSignup}
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
