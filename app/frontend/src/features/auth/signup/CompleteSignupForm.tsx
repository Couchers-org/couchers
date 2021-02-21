import {
  FormControlLabel,
  InputLabel,
  makeStyles,
  Radio,
  RadioGroup,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useHistory, useLocation, useParams } from "react-router-dom";

import Autocomplete from "../../../components/Autocomplete";
import Button from "../../../components/Button";
import CircularProgress from "../../../components/CircularProgress";
import TextField from "../../../components/TextField";
import { HostingStatus } from "../../../pb/api_pb";
import { signupRoute } from "../../../routes";
import { service } from "../../../service";
import {
  nameValidationPattern,
  usernameValidationPattern,
  validatePastDate,
} from "../../../utils/validation";
import { hostingStatusLabels } from "../../profile/constants";
import { useAuthContext } from "../AuthProvider";

type SignupInputs = {
  email: string;
  username: string;
  name: string;
  birthdate: string;
  location: string;
  gender: string;
  hostingStatus: HostingStatus;
};

const useStyles = makeStyles((theme) => ({
  completeSignupForm: {
    display: "flex",
    flexDirection: "column",
    marginBottom: theme.spacing(5),
    width: "100%",
  },
  formField: {
    marginBottom: theme.spacing(2),
  },
  formLabel: {
    color: "#333333",
    fontWeight: 700,
  },
  button: {
    marginTop: theme.spacing(4),
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: 700,
  },
  genderRadio: {
    display: "flex",
    flexDirection: "row",
  },
  genderRadioButton: {},
}));

export default function CompleteSignup() {
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    errors,
  } = useForm<SignupInputs>({
    shouldUnregister: false,
    mode: "onBlur",
  });

  const [loading, setLoading] = useState(false);

  const { urlToken } = useParams<{ urlToken: string }>();
  const location = useLocation();
  const history = useHistory();
  const classes = useStyles();

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
    authActions.signup({
      signupToken: urlToken,
      username: data.username,
      name: data.name,
      city: data.location,
      birthdate: data.birthdate,
      gender: data.gender,
      hostingStatus: data.hostingStatus,
    });
  });

  return (
    <>
      {loading ? (
        <CircularProgress />
      ) : (
        <form className={classes.completeSignupForm} onSubmit={completeSignup}>
          <InputLabel className={classes.formLabel} htmlFor="username">
            Username
          </InputLabel>
          <TextField
            className={classes.formField}
            variant="standard"
            name="username"
            fullWidth
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
          <InputLabel className={classes.formLabel} htmlFor="full-name">
            Full name
          </InputLabel>
          <TextField
            id="full-name"
            className={classes.formField}
            variant="standard"
            name="name"
            fullWidth
            inputRef={register({
              required: "Enter your name",
              pattern: {
                value: nameValidationPattern,
                message: "Name can't be just white space.",
              },
            })}
            helperText={errors?.name?.message}
          />
          <InputLabel className={classes.formLabel} htmlFor="full-name">
            Birthday
          </InputLabel>
          <TextField
            id="birthday"
            fullWidth
            className={classes.formField}
            variant="standard"
            name="birthdate"
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
          <InputLabel className={classes.formLabel} htmlFor="location">
            Your location
          </InputLabel>
          <TextField
            id="location"
            className={classes.formField}
            variant="standard"
            name="location"
            fullWidth
            inputRef={register({
              required: "Enter your location",
            })}
            helperText={errors?.location?.message}
          />
          <InputLabel className={classes.formLabel} htmlFor="hosting-status">
            Hosting status
          </InputLabel>
          <Controller
            
            control={control}
            name="hostingStatus"
            defaultValue={null}
            render={({ onChange }) => (
              <Autocomplete
              className={classes.formField}
                id="hosting-status"
                label=""
                onChange={(_, option) => onChange(option)}
                options={[
                  HostingStatus.HOSTING_STATUS_CAN_HOST,
                  HostingStatus.HOSTING_STATUS_MAYBE,
                  HostingStatus.HOSTING_STATUS_DIFFICULT,
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
          <InputLabel className={classes.formLabel} htmlFor="gender">
            I identify as ....
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
                // value={value}
                onChange={onChange}
              >
                <FormControlLabel
                  value="female"
                  control={
                    <Radio classes={{ root: classes.genderRadioButton }} />
                  }
                  label="Woman"
                />
                <FormControlLabel
                  value="male"
                  control={
                    <Radio classes={{ root: classes.genderRadioButton }} />
                  }
                  label="Man"
                />
                <FormControlLabel
                  value="other"
                  control={
                    <Radio classes={{ root: classes.genderRadioButton }} />
                  }
                  label="Non-binary"
                />
              </RadioGroup>
            )}
          />
          <Button
            classes={{
              root: classes.button,
              label: classes.buttonText,
            }}
            color="secondary"
            onClick={completeSignup}
            type="submit"
            loading={authLoading || loading}
          >
            Sign up
          </Button>
        </form>
      )}
    </>
  );
}
