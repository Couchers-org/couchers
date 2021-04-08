import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  makeStyles,
  Radio,
  RadioGroup,
} from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import { useUser } from "features/userQueries/useUsers";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  AGE,
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
  GENDER,
  GENDER_OPTIONS,
  IDEAS_HELPER,
  IDEAS_LABEL,
  LOCATION_HELPER,
  LOCATION_LABEL,
  NAME,
  NAME_REQUIRED,
  QUESTIONS_OPTIONAL,
  SUBMIT,
} from "./constants";

type ContributorInputs = {
  name: string;
  // doubles as username for logged in users
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
  hidden: {
    display: "none",
  },
}));

export default function ContributorForm() {
  const { authState } = useAuthContext();

  const { data: user, isLoading: userIsLoading } = useUser(
    authState.userId ?? 0
  );
  const hasUser = !!user;

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

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const classes = useStyles();

  useEffect(() => {
    if (!userIsLoading && user) {
      // hard to get email from backend since it's not part of the normal User object
      setValue("email", user.username);
      setValue("name", user.name);
      setValue("age", user.age);
      setValue("gender", user.gender);
      setValue("location", user.city);
    }
  }, [userIsLoading, setValue, user]);

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
        setSuccess(true);
      } else {
        setError("An unknown error occured");
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  });

  return (
    <>
      {loading || userIsLoading ? (
        <CircularProgress />
      ) : (
        <>
          {success ? (
            <>Thank you, we may be in touch soon</>
          ) : (
            <form onSubmit={submit}>
              {error && <Alert severity="error">{error}</Alert>}
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
                className={classNames({ [classes.hidden]: hasUser })}
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
                className={classNames({ [classes.hidden]: hasUser })}
              />
              <Controller
                id="contribute"
                control={control}
                name="contribute"
                defaultValue=""
                rules={{ required: CONTRIBUTE_REQUIRED }}
                render={({ onChange }) => (
                  <FormControl>
                    <FormLabel>{CONTRIBUTE_LABEL}</FormLabel>
                    <RadioGroup
                      aria-label="contribute"
                      name="contribute-radio"
                      onChange={onChange}
                    >
                      {CONTRIBUTE_OPTIONS.map((opt) => (
                        <FormControlLabel
                          key={opt}
                          value={opt}
                          control={<Radio />}
                          label={opt}
                        />
                      ))}
                    </RadioGroup>
                    <FormHelperText error={!!errors?.contribute?.message}>
                      {errors?.contribute?.message ?? " "}
                    </FormHelperText>
                  </FormControl>
                )}
              />
              <p>{QUESTIONS_OPTIONAL}</p>
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
              <TextField
                inputRef={register}
                id="age"
                type="number"
                margin="normal"
                name="age"
                label={AGE}
                fullWidth
                className={classNames({ [classes.hidden]: hasUser })}
              />
              <Controller
                id="gender"
                control={control}
                name="gender"
                render={({ onChange }) => (
                  <FormControl
                    className={classNames({ [classes.hidden]: hasUser })}
                  >
                    <FormLabel component="legend">{GENDER}</FormLabel>
                    <RadioGroup
                      className={classes.genderRadio}
                      aria-label="gender"
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
                className={classNames({ [classes.hidden]: hasUser })}
              />
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
              <Button
                classes={{}}
                onClick={submit}
                type="submit"
                loading={loading}
              >
                {SUBMIT}
              </Button>
            </form>
          )}
        </>
      )}
    </>
  );
}
