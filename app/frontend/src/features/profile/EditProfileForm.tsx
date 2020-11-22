import { makeStyles } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { unwrapResult } from "@reduxjs/toolkit";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import { updateUserProfile } from "./index";
import ProfileTextInput from "./ProfileTextInput";
import { ProfileFormData } from "../../service/user";
import { theme } from "../../theme";
import { useAppDispatch, useTypedSelector } from "../../store";

const useStyles = makeStyles({
  buttonContainer: {
    display: "flex",
    paddingTop: theme.spacing(1),
  },
});

export default function EditProfileForm() {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const user = useTypedSelector((state) => state.auth.user);
  const [alertState, setShowAlertState] = useState<
    "success" | "error" | undefined
  >();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { control, register, handleSubmit } = useForm<ProfileFormData>();

  const onSubmit = handleSubmit(async (data: ProfileFormData) => {
    try {
      unwrapResult(await dispatch(updateUserProfile(data)));
      setShowAlertState("success");
    } catch (error) {
      setShowAlertState("error");
      setErrorMessage(error.message);
    }
  });

  return (
    <>
      {alertState === "success" ? (
        <Alert severity={alertState}>Successfully updated profile!</Alert>
      ) : alertState === "error" ? (
        <Alert severity={alertState}>{errorMessage}</Alert>
      ) : null}
      {user && (
        <form onSubmit={onSubmit}>
          <ProfileTextInput
            label="Name"
            name="name"
            defaultValue={user.name}
            inputRef={register}
          />
          <ProfileTextInput
            label="City"
            name="city"
            defaultValue={user.city}
            inputRef={register}
          />
          <ProfileTextInput
            label="Gender"
            name="gender"
            defaultValue={user.gender}
            inputRef={register}
          />
          <ProfileTextInput
            label="Occupation"
            name="occupation"
            defaultValue={user.occupation}
            inputRef={register}
          />
          <Controller
            control={control}
            defaultValue={user.languagesList}
            name="languages"
            render={({ onChange }) => (
              <Autocomplete
                defaultValue={user.languagesList}
                disableClearable={false}
                freeSolo
                multiple
                onChange={(_, value) => onChange(value)}
                open={false}
                options={[""]}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    helperText="Press 'Enter' to add"
                    label="Languages"
                  />
                )}
              />
            )}
          />
          <ProfileTextInput
            label="About me"
            name="aboutMe"
            defaultValue={user.aboutMe}
            inputRef={register}
            rowsMax={5}
            multiline
          />
          <ProfileTextInput
            label="About my place"
            name="aboutPlace"
            defaultValue={user.aboutPlace}
            inputRef={register}
            rowsMax={5}
            multiline
          />
          <Controller
            control={control}
            defaultValue={user.countriesVisitedList}
            name="countriesVisited"
            render={({ onChange }) => (
              <Autocomplete
                defaultValue={user.countriesVisitedList}
                disableClearable={false}
                freeSolo
                multiple
                onChange={(_, value) => onChange(value)}
                open={false}
                options={[""]}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    helperText="Press 'Enter' to add"
                    label="Countries I visited"
                  />
                )}
              />
            )}
          />
          <Controller
            control={control}
            defaultValue={user.countriesLivedList}
            name="countriesLived"
            render={({ onChange }) => (
              <Autocomplete
                defaultValue={user.countriesLivedList}
                disableClearable={false}
                freeSolo
                multiple
                onChange={(_, value) => onChange(value)}
                open={false}
                options={[""]}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    helperText="Press 'Enter' to add"
                    label="Countries I lived in"
                  />
                )}
              />
            )}
          />
          <div className={classes.buttonContainer}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={onSubmit}
            >
              Save
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
