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
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import { GetContributorFormInfoRes } from "pb/account_pb";
import { contributorFormInfoQueryKey } from "queryKeys";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { signupRoute } from "routes";
import { service } from "service";

import {
  AGE,
  ALREADY_FILLED_IN,
  CONTRIBUTE_LABEL,
  CONTRIBUTE_OPTIONS,
  CONTRIBUTE_REQUIRED,
  EMAIL,
  EMAIL_REQUIRED,
  EXPERIENCE_HELPER,
  EXPERIENCE_LABEL,
  EXPERTISE_HELPER,
  EXPERTISE_LABEL,
  EXPERTISE_REQUIRED,
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
  marginTop: { marginTop: theme.spacing(4) },
}));

export default function ContributorForm() {
  const classes = useStyles();
  const { authState } = useAuthContext();
  const queryClient = useQueryClient();

  const [fillAgain, setFillAgain] = useState(false);

  const { control, register, handleSubmit, setValue, errors } =
    useForm<ContributorInputs>({
      defaultValues: {},
      mode: "onBlur",
      shouldUnregister: false,
    });

  const {
    data,
    isLoading: queryLoading,
    error: queryError,
  } = useQuery<GetContributorFormInfoRes.AsObject, Error>(
    contributorFormInfoQueryKey,
    service.account.getContributorFormInfo,
    {
      enabled: authState.authenticated,
      onSuccess: (data) => {
        setValue("username", data.username);
        setValue("name", data.name);
        setValue("email", data.email);
        setValue("age", data.age);
        setValue("gender", data.gender);
        setValue("location", data.location);
      },
    }
  );

  const postForm = async (data: ContributorInputs) => {
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
    return response.json();
  };

  const {
    error,
    isLoading: loading,
    isSuccess: success,
    mutate: submitForm,
  } = useMutation<FormResponse, Error, ContributorInputs>(postForm, {
    onSuccess: async () => {
      if (authState.authenticated) {
        await service.account.markContributorFormFilled();
        queryClient.invalidateQueries(contributorFormInfoQueryKey);
      }
    },
  });

  const submit = handleSubmit((data: ContributorInputs) => {
    submitForm(data);
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

  return loading || authState.loading || queryLoading ? (
    <CircularProgress />
  ) : (
    <>
      {queryError && <Alert severity="error">{queryError?.message}</Alert>}
      {data && data.filledContributorForm && !fillAgain ? (
        <>
          <Typography variant="body1">{ALREADY_FILLED_IN}</Typography>
          <Button onClick={() => setFillAgain(true)}>{FILL_IN_AGAIN}</Button>
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
          <Typography variant="body1" paragraph>
            {FILL_IN_THE_FORM}
          </Typography>
          {!authState.authenticated && (
            <>
              <Button component={Link} to={signupRoute}>
                {SIGN_UP}
              </Button>
              <Typography variant="body1">{YOU_CAN_ALSO}</Typography>
            </>
          )}
          {error && <Alert severity="error">{error?.message}</Alert>}
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
              <FormControl fullWidth>
                <FormLabel>{CONTRIBUTE_LABEL}</FormLabel>
                <FormGroup aria-label={CONTRIBUTE_LABEL}>
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
                {errors?.contribute?.message && (
                  <FormHelperText error>
                    {errors.contribute.message}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
          <Typography
            variant="body1"
            id="expertise-label"
            className={classes.marginTop}
          >
            {EXPERTISE_LABEL}
          </Typography>
          <TextField
            inputRef={register({
              required: EXPERTISE_REQUIRED,
            })}
            id="expertise"
            margin="normal"
            name="expertise"
            helperText={errors?.name?.message ?? EXPERTISE_HELPER}
            error={!!errors?.name?.message}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
            aria-labelledby="expertise-label"
          />
          <Typography variant="h3" component="p" className={classes.marginTop}>
            {QUESTIONS_OPTIONAL}
          </Typography>
          <Typography
            variant="body1"
            id="experience-label"
            className={classes.marginTop}
          >
            {EXPERIENCE_LABEL}
          </Typography>
          <TextField
            inputRef={register}
            id="experience"
            margin="normal"
            name="experience"
            helperText={EXPERIENCE_HELPER}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
            aria-labelledby="experience-label"
          />
          <Typography
            variant="body1"
            id="ideas-label"
            className={classes.marginTop}
          >
            {IDEAS_LABEL}
          </Typography>
          <TextField
            inputRef={register}
            id="ideas"
            margin="normal"
            name="ideas"
            helperText={IDEAS_HELPER}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
            aria-labelledby="ideas-label"
          />
          <Typography
            variant="body1"
            id="features-label"
            className={classes.marginTop}
          >
            {FEATURES_LABEL}
          </Typography>
          <TextField
            inputRef={register}
            id="features"
            margin="normal"
            name="features"
            helperText={FEATURES_HELPER}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
            aria-labelledby="features-label"
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
                defaultValue=""
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
          <Button onClick={submit} type="submit" loading={loading}>
            {SUBMIT}
          </Button>
        </form>
      )}
    </>
  );
}
