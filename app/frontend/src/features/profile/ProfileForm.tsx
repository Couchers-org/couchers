import { makeStyles } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import ProfileTextInput from "./ProfileTextInput";
import { UpdateUserProfileData } from "../../service/user";
import { theme } from "../../theme";
import ProfileMarkdownInput from "./ProfileMarkdownInput";
import EditUserLocationMap from "../../components/EditUserLocationMap";
import { useAuthContext } from "../auth/AuthProvider";

const useStyles = makeStyles({
  buttonContainer: {
    display: "flex",
    paddingTop: theme.spacing(1),
  },
});

export default function EditProfileForm() {
  const classes = useStyles();
  const { authState, profileActions } = useAuthContext();
  const user = authState.user;
  const [alertState, setShowAlertState] = useState<
    "success" | "error" | undefined
  >();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { control, register, handleSubmit, setValue } = useForm<
    UpdateUserProfileData
  >({
    defaultValues: {
      city: user?.city ?? undefined,
      lat: user?.lat ?? undefined,
      lng: user?.lng ?? undefined,
      radius: user?.radius ?? undefined,
    },
  });

  useEffect(() => {
    //register here because these don't exist as actual fields
    register("lat");
    register("lng");
    register("radius");
  }, [register]);

  const onSubmit = handleSubmit(async (data: UpdateUserProfileData) => {
    try {
      await profileActions.updateUserProfile(data);
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
          <Controller
            name="city"
            control={control}
            render={({ value, onChange }) => (
              <EditUserLocationMap
                user={user}
                city={value}
                setCity={(newValue) => onChange(newValue)}
                setLocation={(location) => {
                  setValue("lat", location.lat);
                  setValue("lng", location.lng);
                  setValue("radius", location.radius);
                }}
              />
            )}
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
