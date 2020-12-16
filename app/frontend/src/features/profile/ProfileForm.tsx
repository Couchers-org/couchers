import { makeStyles } from "@material-ui/core";
import { unwrapResult } from "@reduxjs/toolkit";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import { updateUserProfile } from "./index";
import ProfileTextInput from "./ProfileTextInput";
import { UpdateUserProfileData } from "../../service/user";
import { theme } from "../../theme";
import { useAppDispatch, useTypedSelector } from "../../store";
import ProfileMarkdownInput from "./ProfileMarkdownInput";
import ProfileTagInput from "./ProfileTagInput";

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
  const { control, register, handleSubmit } = useForm<UpdateUserProfileData>();

  const onSubmit = handleSubmit(async (data: UpdateUserProfileData) => {
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
            render={({ onChange, value }) => (
              <ProfileTagInput
                onChange={(_, value) => onChange(value)}
                value={value}
                options={[]}
                label="Languages I speak"
                id="languages"
              />
            )}
          />

          <Controller
            control={control}
            defaultValue={user.aboutMe}
            name="aboutMe"
            render={({ onChange, value }) => (
              <ProfileMarkdownInput
                label="About me"
                onChange={onChange}
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            defaultValue={user.aboutPlace}
            name="aboutPlace"
            render={({ onChange, value }) => (
              <ProfileMarkdownInput
                label="About my place"
                onChange={onChange}
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            defaultValue={user.countriesVisitedList}
            name="countriesVisited"
            render={({ onChange, value }) => (
              <ProfileTagInput
                onChange={(_, value) => onChange(value)}
                value={value}
                options={[]}
                label="Countries I've Visited"
                id="countries-visited"
              />
            )}
          />

          <Controller
            control={control}
            defaultValue={user.countriesLivedList}
            name="countriesLived"
            render={({ onChange, value }) => (
              <ProfileTagInput
                onChange={(_, value) => onChange(value)}
                value={value}
                options={[]}
                label="Countries I've Lived In"
                id="countries-lived"
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
