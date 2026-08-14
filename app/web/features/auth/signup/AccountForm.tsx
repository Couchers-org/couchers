import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  FormLabelProps,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  styled,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import { PickerOnlyDatepicker } from "components/Datepicker";
import EditLocationMap, { ApproximateLocation } from "components/EditLocationMap";
import Select from "components/Select";
import TOSLink from "components/TOSLink";
import { useAuthContext } from "features/auth/AuthProvider";
import { StyledButton, StyledInputLabel, StyledTextField } from "features/auth/useAuthStyles";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { HostingStatus } from "proto/api_pb";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { service } from "service";
import { Temporal } from "temporal-polyfill";
import { lowercaseAndTrimField, usernameValidationPattern, validatePassword } from "utils/validation";

export type SignupAccountInputs = {
  username: string;
  password: string;
  name: string;
  birthdate: Temporal.PlainDate;
  gender: string;
  acceptTOS: boolean;
  optInToNewsletter: boolean;
  hostingStatus:
    | HostingStatus.HOSTING_STATUS_CAN_HOST
    | HostingStatus.HOSTING_STATUS_MAYBE
    | HostingStatus.HOSTING_STATUS_CANT_HOST;
  location: ApproximateLocation;
};

const StyledForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(2),
  paddingBottom: 0,
  width: "100%",

  [theme.breakpoints.up("md")]: {
    alignItems: "flex-start",
  },
}));

const StyledFormLabel = styled(FormLabel)<FormLabelProps>(({ theme }) => ({
  color: "var(--mui-palette-text-primary)",
  fontWeight: 700,
  [theme.breakpoints.up("md")]: {
    marginBottom: theme.spacing(2),
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  marginTop: 0,
  width: "100%",

  "& .MuiInputBase-root": {
    backgroundColor: "var(--mui-palette-background-paper)",
  },
}));

const StyledDatepicker = styled(PickerOnlyDatepicker)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  marginTop: 0,
  width: "100%",

  "& .MuiInputBase-input": {
    backgroundColor: "var(--mui-palette-background-paper)",
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  marginTop: 0,
  width: "100%",
}));

const StyledEditLocationMap = styled(EditLocationMap)(({ theme }) => ({
  "&&": { marginBottom: theme.spacing(2) },
  width: "100%",
}));

export default function AccountForm() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupAccountInputs>({
    defaultValues: { location: { address: "" } },
    mode: "onBlur",
    shouldUnregister: false,
  });

  const mutation = useMutation<void, RpcError, SignupAccountInputs>({
    mutationFn: async ({
      username,
      password,
      birthdate,
      gender,
      acceptTOS,
      optInToNewsletter,
      hostingStatus,
      location,
    }) => {
      const state = await service.auth.signupFlowAccount({
        flowToken: authState.flowState!.flowToken,
        username: lowercaseAndTrimField(username),
        password: password,
        birthdate,
        gender,
        acceptTOS,
        optOutOfNewsletter: !optInToNewsletter,
        hostingStatus,
        city: location.address,
        lat: location.lat,
        lng: location.lng,
        radius: location.radius,
      });
      authActions.updateSignupState(state);
    },
  });

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
    },
  );

  const acceptTOS = watch("acceptTOS");

  const usernameInputRef = useRef<HTMLInputElement>(undefined);

  const handleBirthdateChange = (newBirthdate: Temporal.PlainDate) => {
    setValue("birthdate", newBirthdate, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <>
      {errors.location && <Alert severity="error">{errors.location?.message || ""}</Alert>}
      {mutation.error && <Alert severity="error">{mutation.error.message || ""}</Alert>}
      <StyledForm onSubmit={submit}>
        <StyledInputLabel htmlFor="username">{t("auth:account_form.username.field_label")}</StyledInputLabel>
        <StyledTextField
          id="username"
          {...register("username", {
            pattern: {
              message: t("auth:account_form.username.validation_error"),
              value: usernameValidationPattern,
            },
            required: t("auth:account_form.username.required_error"),
            validate: async (username: string) => {
              const valid = await service.auth.validateUsername(lowercaseAndTrimField(username));
              return valid || t("auth:account_form.username.username_taken_error");
            },
          })}
          variant="outlined"
          fullWidth
          inputRef={(el: HTMLInputElement | null) => {
            if (!usernameInputRef.current) el?.focus();
            if (el) usernameInputRef.current = el;
          }}
          helperText={errors?.username?.message ?? t("auth:account_form.username.helper_text")}
          error={!!errors?.username?.message}
          autoComplete="username"
        />
        <StyledInputLabel htmlFor="password">{t("auth:account_form.password.field_label")}</StyledInputLabel>
        <StyledTextField
          id="password"
          {...register("password", {
            required: t("auth:account_form.password.required_error"),
            validate: (password) => validatePassword(password) || t("auth:account_form.password.validation_error"),
          })}
          variant="outlined"
          type={showPassword ? "text" : "password"}
          fullWidth
          helperText={errors?.password?.message ?? " "}
          error={!!errors?.password?.message}
          autoComplete="new-password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end" sx={{ marginRight: 1 }}>
                  <IconButton
                    aria-label={
                      showPassword ? t("auth:login_page.form.hide_password") : t("auth:login_page.form.show_password")
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <StyledInputLabel htmlFor="birthdate">{t("auth:account_form.birthday.field_label")}</StyledInputLabel>
        <StyledDatepicker
          control={control}
          error={!!errors?.birthdate?.message}
          helperText={errors?.birthdate?.message}
          id="birthdate"
          variant="outlined"
          rules={{
            required: t("auth:account_form.birthday.required_error"),
            validate: (birthDate: Temporal.PlainDate) => {
              const age = Temporal.Now.plainDateISO().since(birthDate, {
                smallestUnit: "year",
                roundingMode: "floor",
              }).years;

              if (age < 18) {
                return t("auth:account_form.birthday.too_young_error");
              }

              if (age > 120) {
                return t("auth:account_form.birthday.not_real_date_error");
              }

              if (Temporal.PlainDate.compare(birthDate, Temporal.Now.plainDateISO()) >= 0) {
                return t("auth:account_form.birthday.validation_error");
              }

              return true; // Validation passes
            },
          }}
          minValue={Temporal.Now.plainDateISO().add({ years: -120 })}
          maxValue={Temporal.Now.plainDateISO().add({ years: -18 })}
          openTo="year"
          name="birthdate"
          onPostChange={handleBirthdateChange}
          inputProps={{
            sx: { backgroundColor: "var(--mui-palette-background-paper)" },
          }}
        />
        <StyledInputLabel htmlFor="location">{t("auth:location.field_label")}</StyledInputLabel>
      </StyledForm>
      <Controller
        name="location"
        control={control}
        rules={{
          validate: (location) => !!location.address || t("auth:location.validation_error"),
        }}
        render={({ field, fieldState: { error } }) => (
          <StyledEditLocationMap
            inputFieldError={error}
            updateLocation={(location) => {
              if (location) {
                field.onChange({
                  address: location.address,
                  lat: location.lat,
                  lng: location.lng,
                  radius: location.radius,
                });
              } else {
                field.onChange({
                  address: "",
                });
              }
            }}
            sx={{
              "& .MuiInputBase-root": {
                backgroundColor: "var(--mui-palette-common-paper)",
              },
            }}
            variant="outlined"
          />
        )}
      />
      <StyledForm onSubmit={submit}>
        <StyledInputLabel htmlFor="hosting-status">
          {t("auth:account_form.hosting_status.field_label")}
        </StyledInputLabel>
        <StyledFormControl variant="outlined">
          {errors?.hostingStatus?.message && <FormHelperText error>{errors.hostingStatus.message}</FormHelperText>}
          <Controller
            control={control}
            rules={{ required: t("global:required") }}
            name="hostingStatus"
            render={({ field }) => (
              <StyledSelect
                {...field}
                variant="outlined"
                onChange={(event) => {
                  field.onChange(Number.parseInt(event.target.value as string) || "");
                }}
                value={field.value}
                id="hosting-status"
                fullWidth
                options={[
                  "",
                  HostingStatus.HOSTING_STATUS_CAN_HOST,
                  HostingStatus.HOSTING_STATUS_MAYBE,
                  HostingStatus.HOSTING_STATUS_CANT_HOST,
                ]}
                optionLabelMap={{
                  "": "",
                  [HostingStatus.HOSTING_STATUS_CAN_HOST]: t("auth:account_form.hosting_status.can_host"),
                  [HostingStatus.HOSTING_STATUS_MAYBE]: t("auth:account_form.hosting_status.maybe"),
                  [HostingStatus.HOSTING_STATUS_CANT_HOST]: t("auth:account_form.hosting_status.cant_host"),
                }}
              />
            )}
          />
        </StyledFormControl>
        <Controller
          control={control}
          name="gender"
          defaultValue=""
          rules={{ required: t("auth:account_form.gender.required_error") }}
          render={({ field }) => (
            <FormControl variant="standard" component="fieldset">
              <StyledFormLabel component="legend">{t("auth:account_form.gender.field_label")}</StyledFormLabel>
              <RadioGroup
                id="gender"
                {...field}
                row
                aria-label={t("auth:account_form.gender.selector_a11y")}
                name="gender-radio"
              >
                <FormControlLabel value="Woman" control={<Radio />} label={t("auth:account_form.gender.woman")} />
                <FormControlLabel value="Man" control={<Radio />} label={t("auth:account_form.gender.man")} />
                <FormControlLabel
                  value="Non-binary"
                  control={<Radio />}
                  label={t("auth:account_form.gender.non_binary")}
                />
              </RadioGroup>
              <FormHelperText error={!!errors?.gender?.message}>{errors?.gender?.message ?? " "}</FormHelperText>
            </FormControl>
          )}
        />
        <Typography variant="body1">
          <Trans i18nKey="auth:account_form.tos_prompt" components={{ tosLink: <TOSLink /> }} />
        </Typography>
        <FormControlLabel
          control={
            <Controller
              control={control}
              name="acceptTOS"
              defaultValue={false}
              render={({ field }) => <Checkbox {...field} />}
            />
          }
          label={t("auth:account_form.tos_accept_label")}
        />
        <FormControlLabel
          control={
            <Controller
              control={control}
              name="optInToNewsletter"
              defaultValue={true}
              render={({ field }) => <Checkbox {...field} defaultChecked={true} />}
            />
          }
          label={t("auth:account_form.opt_in_newsletter")}
        />
        <StyledButton
          onClick={submit}
          type="submit"
          loading={authLoading || mutation.isPending}
          disabled={!acceptTOS}
          fullWidth
        >
          {t("global:sign_up")}
        </StyledButton>
      </StyledForm>
    </>
  );
}
