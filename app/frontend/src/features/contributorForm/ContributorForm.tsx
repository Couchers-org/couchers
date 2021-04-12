import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  makeStyles,
  Radio,
  RadioGroup,
  Typography,
} from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { signupRoute } from "routes";
import { service } from "service";

import {
  AGE,
  ALREADY_FILLED_IN,
  CONTRIBUTE_ARIA_LABEL,
  CONTRIBUTE_LABEL,
  CONTRIBUTE_OPTIONS,
  CONTRIBUTE_REQUIRED,
  EMAIL,
  EMAIL_REQUIRED,
  EXPERIENCE_HELPER,
  EXPERIENCE_LABEL,
  EXPERTISE_HELPER,
  EXPERTISE_LABEL,
  FEATURES_HELPER,
  FEATURES_LABEL,
  FILL_IN_AGAIN,
  FILL_IN_THE_FORM,
  GENDER,
  GENDER_ARIA_LABEL,
  GENDER_OPTIONS,
  IDEAS_HELPER,
  IDEAS_LABEL,
  LOCATION_HELPER,
  LOCATION_LABEL,
  NAME,
  NAME_REQUIRED,
  PLEASE_SIGN_UP,
  QUESTIONS_OPTIONAL,
  SIGN_UP,
  SUBMIT,
  SUCCESS_MSG,
  YOU_CAN_ALSO,
} from "./constants";

type ContributorInputs = {
  username?: string;
  name: string;
  email: string;
  contribute: string;
  ideas: string;
  features: string;
  age: string;
  gender: string;
  location: string;
  experience: string;
  develop: string;
  expertise: string;
};

type FormResponse = {
  success: boolean;
};

const useStyles = makeStyles((theme) => ({
  genderRadio: {
    display: "flex",
    flexDirection: "row",
  },
}));

export default function ContributorForm() {
  const classes = useStyles();
  const { authState } = useAuthContext();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [filled, setFilled] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    errors,
  } = useForm<ContributorInputs>({
    defaultValues: {},
    mode: "onBlur",
    shouldUnregister: false,
  });

  useEffect(() => {
    if (authState.authenticated) {
      (async () => {
        const info = await service.account.getContributorFormInfo();
        setValue("username", info.username);
        setValue("name", info.name);
        setValue("email", info.email);
        setValue("age", info.age);
        setValue("gender", info.gender);
        setValue("location", info.location);
        setFilled(info.filledContributorForm);
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
  }, [authState, setLoading, setValue, setFilled]);

  const submit = handleSubmit(async (data: ContributorInputs) => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://ja4o9uz9u3.execute-api.us-east-1.amazonaws.com/form_handler",
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json;charset=UTF-8",
          },
          mode: "cors",
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      const result = (await response.json()) as FormResponse;
      if (result.success) {
        if (authState.authenticated) {
          await service.account.markContributorFormFilled();
        }
        setSuccess(true);
      } else {
        setError("An unknown error occured");
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  });

  const toggleCheckbox = (
    option: string,
    contribute: string,
    setContribute: (s: string) => void
  ) => {
    const currentChoices = contribute.split(",").filter((v) => !!v);
    if (currentChoices.includes(option)) {
      setContribute(currentChoices.filter((opt) => opt !== option).join(","));
    } else {
      setContribute(currentChoices.concat(option).join(","));
    }
  };

  return loading || authState.loading ? (
    <CircularProgress />
  ) : (
    <>
      {filled ? (
        <>
          <Typography variant="body1">{ALREADY_FILLED_IN}</Typography>
          <Button onClick={() => setFilled(false)}>{FILL_IN_AGAIN}</Button>
        </>
      ) : success ? (
        <>
          <Typography variant="body1">{SUCCESS_MSG}</Typography>
          {!authState.authenticated && (
            <>
              <Typography variant="body1">{PLEASE_SIGN_UP}</Typography>
              <Button component={Link} to={signupRoute}>
                {SIGN_UP}
              </Button>
            </>
          )}
        </>
      ) : (
        <form onSubmit={submit}>
          <Typography variant="body1">{FILL_IN_THE_FORM}</Typography>
          {!authState.authenticated && (
            <>
              <Button component={Link} to={signupRoute}>
                {SIGN_UP}
              </Button>
              <Typography variant="body1">{YOU_CAN_ALSO}</Typography>
            </>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {!authState.authenticated && (
            <>
              <TextField
                id="name"
                label={NAME}
                variant="standard"
                margin="normal"
                fullWidth
                name="name"
                inputRef={register({
                  required: NAME_REQUIRED,
                })}
                helperText={errors?.name?.message ?? " "}
                error={!!errors?.name?.message}
              />
              <TextField
                id="email"
                label={EMAIL}
                variant="standard"
                margin="normal"
                fullWidth
                name="email"
                inputRef={register({
                  required: EMAIL_REQUIRED,
                })}
                helperText={errors?.email?.message ?? " "}
                error={!!errors?.email?.message}
              />
            </>
          )}
          <Controller
            id="contribute"
            control={control}
            name="contribute"
            defaultValue=""
            rules={{ required: CONTRIBUTE_REQUIRED }}
            render={({ onChange, value }) => (
              <FormControl>
                <FormLabel>{CONTRIBUTE_LABEL}</FormLabel>
                <FormGroup aria-label={CONTRIBUTE_ARIA_LABEL}>
                  {CONTRIBUTE_OPTIONS.map(({ name, description }) => (
                    <FormControlLabel
                      key={name}
                      value={name}
                      control={
                        <Checkbox
                          checked={value.includes(name)}
                          onChange={() => toggleCheckbox(name, value, onChange)}
                          name={name}
                        />
                      }
                      label={description}
                    />
                  ))}
                </FormGroup>
                <FormHelperText error={!!errors?.contribute?.message}>
                  {errors?.contribute?.message ?? " "}
                </FormHelperText>
              </FormControl>
            )}
          />
          <Typography variant="body1">{QUESTIONS_OPTIONAL}</Typography>
          <TextField
            inputRef={register}
            id="ideas"
            margin="normal"
            name="ideas"
            label={IDEAS_LABEL}
            helperText={IDEAS_HELPER}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
          />
          <TextField
            inputRef={register}
            id="features"
            margin="normal"
            name="features"
            label={FEATURES_LABEL}
            helperText={FEATURES_HELPER}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
          />
          {!authState.authenticated && (
            <>
              <TextField
                inputRef={register}
                id="age"
                type="number"
                margin="normal"
                name="age"
                label={AGE}
                fullWidth
              />
              <Controller
                id="gender"
                control={control}
                name="gender"
                render={({ onChange }) => (
                  <FormControl>
                    <FormLabel component="legend">{GENDER}</FormLabel>
                    <RadioGroup
                      className={classes.genderRadio}
                      aria-label={GENDER_ARIA_LABEL}
                      name="gender-radio"
                      onChange={onChange}
                    >
                      {GENDER_OPTIONS.map((opt) => (
                        <FormControlLabel
                          key={opt}
                          value={opt}
                          control={<Radio />}
                          label={opt}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}
              />
              <TextField
                inputRef={register}
                id="location"
                margin="normal"
                name="location"
                label={LOCATION_LABEL}
                helperText={LOCATION_HELPER}
                fullWidth
              />
            </>
          )}
          <TextField
            inputRef={register}
            id="experience"
            margin="normal"
            name="experience"
            label={EXPERIENCE_LABEL}
            helperText={EXPERIENCE_HELPER}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
          />
          <TextField
            inputRef={register}
            id="expertise"
            margin="normal"
            name="expertise"
            label={EXPERTISE_LABEL}
            helperText={EXPERTISE_HELPER}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
          />
          <Button onClick={submit} type="submit" loading={loading}>
            {SUBMIT}
          </Button>
        </form>
      )}
    </>
  );
}
