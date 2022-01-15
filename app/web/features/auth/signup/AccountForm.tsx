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
import { Error as GrpcError } from "grpc-web";
import { Trans, useTranslation } from "next-i18next";
import { HostingStatus } from "proto/api_pb";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import makeStyles from "utils/makeStyles";
import {
  lowercaseAndTrimField,
  usernameValidationPattern,
  validatePassword,
  validatePastDate,
} from "utils/validation";

type SignupAccountInputs = {
  username: string;
  password: string;
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
  const { t } = useTranslation(["auth", "global"]);
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
      password,
      birthdate,
      gender,
      acceptTOS,
      hostingStatus,
      location,
    }) => {
      const state = await service.auth.signupFlowAccount({
        flowToken: authState.flowState!.flowToken,
        username: lowercaseAndTrimField(username),
        password: password,
        birthdate: birthdate.format().split("T")[0],
        gender,
        acceptTOS,
        hostingStatus,
        city: location.address,
        lat: location.lat,
        lng: location.lng,
        radius: location.radius,
      });
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
          {t("auth:account_form.username.field_label")}
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
                message: t("auth:account_form.username.validation_error"),
                value: usernameValidationPattern,
              },
              required: t("auth:account_form.username.required_error"),
              validate: async (username: string) => {
                const valid = await service.auth.validateUsername(
                  lowercaseAndTrimField(username)
                );
                return (
                  valid || t("auth:account_form.username.username_taken_error")
                );
              },
            });
          }}
          helperText={errors?.username?.message ?? " "}
          error={!!errors?.username?.message}
        />
        <InputLabel className={authClasses.formLabel} htmlFor="password">
          {t("auth:account_form.password.field_label")}
        </InputLabel>
        <TextField
          className={authClasses.formField}
          variant="standard"
          type="password"
          id="password"
          name="password"
          fullWidth
          inputRef={register({
            required: t("auth:account_form.password.required_error"),
            validate: (password) =>
              validatePassword(password) ||
              t("auth:account_form.password.validation_error"),
          })}
          helperText={errors?.password?.message ?? " "}
          error={!!errors?.password?.message}
        />
        <InputLabel className={authClasses.formLabel} htmlFor="birthdate">
          {t("auth:account_form.birthday.field_label")}
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
            required: t("auth:account_form.birthday.required_error"),
            validate: (stringDate) =>
              validatePastDate(stringDate) ||
              t("auth:account_form.birthday.validation_error"),
          }}
          minDate={new Date(1899, 12, 1)}
          name="birthdate"
          openTo="year"
        />
        <InputLabel className={authClasses.formLabel} htmlFor="location">
          {t("auth:location.field_label")}
        </InputLabel>
      </form>
      <Controller
        name="location"
        control={control}
        rules={{
          validate: (location) =>
            !!location.address || t("auth:location.validation_error"),
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
          {t("auth:account_form.hosting_status.field_label")}
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
            rules={{ required: t("global:required") }}
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
                optionLabelMap={{
                  "": "",
                  [HostingStatus.HOSTING_STATUS_CAN_HOST]: t(
                    "auth:account_form.hosting_status.can_host"
                  ),
                  [HostingStatus.HOSTING_STATUS_MAYBE]: t(
                    "auth:account_form.hosting_status.maybe"
                  ),
                  [HostingStatus.HOSTING_STATUS_CANT_HOST]: t(
                    "auth:account_form.hosting_status.cant_host"
                  ),
                  [HostingStatus.HOSTING_STATUS_UNSPECIFIED]:
                    t("global:ask_me"),
                  [HostingStatus.HOSTING_STATUS_UNKNOWN]: t("global:ask_me"),
                }}
              />
            )}
          />
        </FormControl>
        <Controller
          id="gender"
          control={control}
          name="gender"
          defaultValue=""
          rules={{ required: t("auth:account_form.gender.required_error") }}
          render={({ onChange, value }) => (
            <FormControl component="fieldset">
              <FormLabel component="legend" className={authClasses.formLabel}>
                {t("auth:account_form.gender.field_label")}
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
                  label={t("auth:account_form.gender.woman")}
                />
                <FormControlLabel
                  value="Man"
                  control={<Radio />}
                  label={t("auth:account_form.gender.man")}
                />
                <FormControlLabel
                  value="Non-binary"
                  control={<Radio />}
                  label={t("auth:account_form.gender.non_binary")}
                />
              </RadioGroup>
              <FormHelperText error={!!errors?.gender?.message}>
                {errors?.gender?.message ?? " "}
              </FormHelperText>
            </FormControl>
          )}
        />
        <Typography variant="body1">
          <Trans i18nKey="auth:account_form.tos_prompt">
            To continue, please read and accept the <TOSLink />.
          </Trans>
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
          label={t("auth:account_form.tos_accept_label")}
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
          {t("global:sign_up")}
        </Button>
      </form>
    </>
  );
}
