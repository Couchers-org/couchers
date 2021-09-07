import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  InputLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import Datepicker from "components/Datepicker";
import EditLocationMap, {
  ApproximateLocation,
} from "components/EditLocationMap";
import Select from "components/Select";
import TextField from "components/TextField";
import TOSLink from "components/TOSLink";
import { Dayjs } from "dayjs";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { HOSTING_STATUS } from "features/constants";
import { hostingStatusLabels } from "features/profile/constants";
import { Error as GrpcError } from "grpc-web";
import { HostingStatus } from "proto/api_pb";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import makeStyles from "utils/makeStyles";
import {
  lowercaseAndTrimField,
  usernameValidationPattern,
  validatePastDate,
} from "utils/validation";

import {
  BIRTHDAY_PAST_ERROR,
  BIRTHDAY_REQUIRED,
  GENDER_LABEL,
  GENDER_REQUIRED,
  LOCATION_LABEL,
  MAN,
  NON_BINARY,
  REQUIRED,
  SIGN_UP,
  SIGN_UP_BIRTHDAY,
  SIGN_UP_LOCATION_MISSING,
  SIGN_UP_TOS_ACCEPT,
  SIGN_UP_TOS_TEXT,
  SIGN_UP_USERNAME_ERROR,
  USERNAME,
  USERNAME_REQUIRED,
  USERNAME_TAKEN,
  WOMAN,
} from "../constants";

type SignupAccountInputs = {
  username: string;
  password?: string;
  name: string;
  birthdate: Dayjs;
  gender: string;
  acceptTOS: boolean;
  hostingStatus: HostingStatus;
  location: ApproximateLocation;
};

const useStyles = makeStyles((theme) => ({
  locationMap: {
    "&&": { marginBottom: theme.spacing(2) },
    width: "100%",
  },
  firstForm: {
    paddingBottom: 0,
  },
  errorAlert: {
    marginTop: theme.spacing(2),
  },
}));

export default function AccountForm() {
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;

  const { control, register, handleSubmit, errors, watch } =
    useForm<SignupAccountInputs>({
      defaultValues: { location: { address: "" } },
      mode: "onBlur",
      shouldUnregister: false,
    });

  const classes = useStyles();
  const authClasses = useAuthStyles();

  const mutation = useMutation<void, GrpcError, SignupAccountInputs>(
    async ({
      username,
      birthdate,
      gender,
      acceptTOS,
      hostingStatus,
      location,
    }) => {
      const state = await service.auth.signupFlowAccount(
        {
          flowToken: authState.flowState?.flowToken!,
          username: lowercaseAndTrimField(username),
          birthdate: birthdate.format().split("T")[0],
          gender,
          acceptTOS,
          hostingStatus,
          city: location.address,
          lat: location.lat,
          lng: location.lng,
          radius: location.radius,
        }
        // TODO: password
      );
      authActions.updateSignupState(state);
    },
    {
      onMutate() {
        authActions.clearError();
      },
      onSettled() {
        window.scroll({ top: 0, behavior: "smooth" });
      },
    }
  );

  const submit = handleSubmit(
    (data: SignupAccountInputs) => {
      mutation.mutate({
        ...data,
        username: lowercaseAndTrimField(data.username),
      });
    },
    () => {
      //location won't focus on error, so scroll to the top
      if (errors.location) window.scroll({ top: 0, behavior: "smooth" });
    }
  );

  const acceptTOS = watch("acceptTOS");

  const usernameInputRef = useRef<HTMLInputElement>();

  return (
    <>
      {errors.location && (
        //@ts-ignore - we register "location" but rhf thinks the error should be
        //under location.address
        <Alert severity="error">{errors.location?.message || ""}</Alert>
      )}
      {mutation.error && (
        <Alert severity="error">{mutation.error.message || ""}</Alert>
      )}
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
          inputRef={(el: HTMLInputElement | null) => {
            if (!usernameInputRef.current) el?.focus();
            if (el) usernameInputRef.current = el;
            register(el, {
              pattern: {
                message: SIGN_UP_USERNAME_ERROR,
                value: usernameValidationPattern,
              },
              required: USERNAME_REQUIRED,
              validate: async (username: string) => {
                const valid = await service.auth.validateUsername(
                  lowercaseAndTrimField(username)
                );
                return valid || USERNAME_TAKEN;
              },
            });
          }}
          helperText={errors?.username?.message ?? " "}
          error={!!errors?.username?.message}
        />
        <InputLabel className={authClasses.formLabel} htmlFor="birthdate">
          {SIGN_UP_BIRTHDAY}
        </InputLabel>
        <Datepicker
          className={authClasses.formField}
          control={control}
          error={
            //@ts-ignore Dayjs type breaks this
            !!errors?.birthdate?.message
          }
          helperText={
            //@ts-ignore
            errors?.birthdate?.message ?? " "
          }
          id="birthdate"
          rules={{
            required: BIRTHDAY_REQUIRED,
            validate: (stringDate) =>
              validatePastDate(stringDate) || BIRTHDAY_PAST_ERROR,
          }}
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
        rules={{
          validate: (location) =>
            !!location.address || SIGN_UP_LOCATION_MISSING,
        }}
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
        <InputLabel className={authClasses.formLabel} htmlFor="hosting-status">
          {HOSTING_STATUS}
        </InputLabel>
        <FormControl className={authClasses.formField}>
          {errors?.hostingStatus?.message && (
            <FormHelperText error>
              {errors.hostingStatus.message}
            </FormHelperText>
          )}
          <Controller
            control={control}
            defaultValue={""}
            rules={{ required: REQUIRED }}
            name="hostingStatus"
            render={({ onChange, value }) => (
              <Select
                onChange={(event) => {
                  onChange(Number.parseInt(event.target.value as string) || "");
                }}
                value={value}
                id="hosting-status"
                fullWidth
                className={authClasses.formField}
                options={[
                  "",
                  HostingStatus.HOSTING_STATUS_CAN_HOST,
                  HostingStatus.HOSTING_STATUS_MAYBE,
                  HostingStatus.HOSTING_STATUS_CANT_HOST,
                ]}
                optionLabelMap={{ "": "", ...hostingStatusLabels }}
              />
            )}
          />
        </FormControl>
        <Controller
          id="gender"
          control={control}
          name="gender"
          defaultValue=""
          rules={{ required: GENDER_REQUIRED }}
          render={({ onChange, value }) => (
            <FormControl component="fieldset">
              <FormLabel component="legend" className={authClasses.formLabel}>
                {GENDER_LABEL}
              </FormLabel>
              <RadioGroup
                row
                aria-label="gender"
                name="gender-radio"
                onChange={(e, value) => onChange(value)}
                value={value}
              >
                <FormControlLabel
                  value="Woman"
                  control={<Radio />}
                  label={WOMAN}
                />
                <FormControlLabel value="Man" control={<Radio />} label={MAN} />
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
          <TOSLink />.
        </Typography>
        <FormControlLabel
          control={
            <Controller
              control={control}
              name="acceptTOS"
              defaultValue={false}
              render={({ onChange, value }) => (
                <Checkbox
                  value={value}
                  onChange={(event) => onChange(event.target.checked)}
                />
              )}
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
          loading={authLoading || mutation.isLoading}
          disabled={!acceptTOS}
          fullWidth
        >
          {SIGN_UP}
        </Button>
      </form>
    </>
  );
}
