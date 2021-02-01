import { makeStyles } from "@material-ui/core";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import ProfileTextInput from "./ProfileTextInput";
import { UpdateUserProfileData } from "../../service/user";
import ProfileMarkdownInput from "./ProfileMarkdownInput";
import ProfileTagInput from "./ProfileTagInput";
import EditUserLocationMap from "../../components/EditUserLocationMap";
import CircularProgress from "../../components/CircularProgress";
import useCurrentUser from "../userQueries/useCurrentUser";
import useUpdateUserProfile from "./useUpdateUserProfile";
import { useIsMounted, useSafeState } from "../../utils/hooks";

const useStyles = makeStyles((theme) => ({
  buttonContainer: {
    display: "flex",
    paddingTop: theme.spacing(1),
  },
  field: {
    "& > .MuiInputBase-root": {
      width: "100%",
    },
    [theme.breakpoints.up("md")]: {
      "& > .MuiInputBase-root": {
        width: 400,
      },
    },
  },
  tagInput: {
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: 400,
    },
  },
}));

export default function EditProfileForm() {
  const classes = useStyles();
  const {
    updateUserProfile,
    status: updateStatus,
    reset: resetUpdate,
  } = useUpdateUserProfile();
  const { data: user } = useCurrentUser();
  const isMounted = useIsMounted();
  const [errorMessage, setErrorMessage] = useSafeState<string | null>(
    isMounted,
    null
  );
  const {
    control,
    register,
    handleSubmit,
    setValue,
  } = useForm<UpdateUserProfileData>({
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

  const onSubmit = handleSubmit((data) => {
    resetUpdate();
    updateUserProfile({ profileData: data, setMutationError: setErrorMessage });
  });

  return (
    <>
      {updateStatus === "success" ? (
        <Alert severity="success">Successfully updated profile!</Alert>
      ) : updateStatus === "error" ? (
        <Alert severity="error">{errorMessage}</Alert>
      ) : null}
      {user ? (
        <>
          <form onSubmit={onSubmit}>
            <ProfileTextInput
              label="Name"
              name="name"
              defaultValue={user.name}
              inputRef={register}
              className={classes.field}
            />
          </form>
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
          <form onSubmit={onSubmit}>
            <ProfileTextInput
              label="Gender"
              name="gender"
              defaultValue={user.gender}
              inputRef={register}
              className={classes.field}
            />
            <ProfileTextInput
              label="Occupation"
              name="occupation"
              defaultValue={user.occupation}
              inputRef={register}
              className={classes.field}
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
                  className={classes.tagInput}
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
                  className={classes.tagInput}
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
                  className={classes.tagInput}
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
        </>
      ) : (
        <CircularProgress />
      )}
    </>
  );
}
