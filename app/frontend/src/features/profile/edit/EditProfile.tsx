import {
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import EditLocationMap from "components/EditLocationMap";
import ImageInput from "components/ImageInput";
import PageTitle from "components/PageTitle";
import {
  ACCOUNT_SETTINGS,
  ADDITIONAL,
  COUNTRIES_LIVED,
  COUNTRIES_VISITED,
  EDIT_PROFILE,
  EDUCATION,
  FEMALE_PRONOUNS,
  HOBBIES,
  HOMETOWN,
  HOSTING_STATUS,
  LANGUAGES_SPOKEN,
  MALE_PRONOUNS,
  MEETUP_STATUS,
  NAME,
  OCCUPATION,
  PRONOUNS,
  SAVE,
  WHO,
} from "features/constants";
import {
  ACCEPTING,
  MAYBE_ACCEPTING,
  MAYBE_MEETUP,
  MEETUP,
  NO_MEETUP,
  NOT_ACCEPTING,
} from "features/profile/constants";
import useUpdateUserProfile from "features/profile/hooks/useUpdateUserProfile";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import ProfileTagInput from "features/profile/ProfileTagInput";
import ProfileTextInput from "features/profile/ProfileTextInput";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { HostingStatus, MeetupStatus } from "pb/api_pb";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { settingsRoute } from "routes";
import { UpdateUserProfileData } from "service/index";
import { useIsMounted, useSafeState } from "utils/hooks";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  avatar: {
    width: 120,
    height: 120,
  },
  topFormContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    [theme.breakpoints.up("md")]: {
      flexDirection: "row",
      margin: theme.spacing(0, 10),
    },
    "& .MuiTextField-root": {
      width: "100%",
    },
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    paddingBottom: theme.spacing(1),
    paddingTop: theme.spacing(1),
  },
  // Everything under the mapbox
  bottomFormContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    [theme.breakpoints.up("md")]: {
      margin: theme.spacing(0, 10),
    },
  },
  // .field is the free text fields
  field: {
    "& > .MuiInputBase-root": {
      width: "100%",
    },
  },
  radioButtons: {
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.up("sm")]: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
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
  const { data: user, isLoading: userIsLoading } = useCurrentUser();
  const isMounted = useIsMounted();
  const [errorMessage, setErrorMessage] = useSafeState<string | null>(
    isMounted,
    null
  );
  const {
    control,
    errors,
    register,
    handleSubmit,
    setValue,
  } = useForm<UpdateUserProfileData>({
    defaultValues: {
      city: user?.city,
      lat: user?.lat,
      lng: user?.lng,
      radius: user?.radius,
    },
  });

  //Although the default value was set above, if the page is just loaded,
  //user will be undefined on first render, so the default values will be undefined.
  //So make sure to set values when user finshes loading
  useEffect(() => {
    if (!userIsLoading && user) {
      setValue("city", user.city);
      setValue("lat", user.lat);
      setValue("lng", user.lng);
      setValue("radius", user.radius);
    }
  }, [userIsLoading, setValue, user]);

  useEffect(() => {
    //register here because these don't exist as actual fields
    register("city");
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
      <Grid
        container
        direction="row"
        justify="space-between"
        alignItems="center"
      >
        <PageTitle>{EDIT_PROFILE}</PageTitle>
        <div className={classes.buttonContainer}>
          <Button
            component={Link}
            to={settingsRoute}
            variant="contained"
            color="primary"
          >
            {ACCOUNT_SETTINGS}
          </Button>
        </div>
      </Grid>
      {updateStatus === "success" ? (
        <Alert severity="success">Successfully updated profile!</Alert>
      ) : updateStatus === "error" ? (
        <Alert severity="error">{errorMessage || "Unknown error"}</Alert>
      ) : null}
      {errors.avatarKey && (
        <Alert severity="error">{errors.avatarKey?.message || ""}</Alert>
      )}
      {user ? (
        <>
          <form onSubmit={onSubmit} className={classes.topFormContainer}>
            <ImageInput
              className={classes.avatar}
              control={control}
              id="profile-picture"
              name="avatarKey"
              initialPreviewSrc={user.avatarUrl}
              userName={user.name}
              type="avatar"
            />
            <ProfileTextInput
              id="name"
              label={NAME}
              name="name"
              defaultValue={user.name}
              error={!!errors.name}
              inputRef={register({ required: true })}
              className={classes.field}
            />
          </form>
          <Controller
            defaultValue=""
            name="location"
            control={control}
            render={() => (
              <EditLocationMap
                showRadiusSlider
                initialLocation={{
                  address: user.city,
                  lat: user.lat,
                  lng: user.lng,
                  radius: user.radius,
                }}
                updateLocation={(location) => {
                  if (location) {
                    setValue("city", location.address);
                    setValue("lat", location.lat);
                    setValue("lng", location.lng);
                    setValue("radius", location.radius);
                  }
                }}
              />
            )}
          />
          <form onSubmit={onSubmit} className={classes.bottomFormContainer}>
            <Controller
              control={control}
              defaultValue={user.hostingStatus}
              name="hostingStatus"
              render={({ onChange, value }) => (
                <>
                  <Typography variant="h2">{HOSTING_STATUS}</Typography>
                  <RadioGroup
                    row
                    aria-label={HOSTING_STATUS}
                    name="hostingStatus"
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className={classes.radioButtons}
                  >
                    <FormControlLabel
                      value={HostingStatus.HOSTING_STATUS_CAN_HOST}
                      control={<Radio />}
                      label={ACCEPTING}
                    />
                    <FormControlLabel
                      value={HostingStatus.HOSTING_STATUS_MAYBE}
                      control={<Radio />}
                      label={MAYBE_ACCEPTING}
                    />
                    <FormControlLabel
                      value={HostingStatus.HOSTING_STATUS_CANT_HOST}
                      control={<Radio />}
                      label={NOT_ACCEPTING}
                    />
                  </RadioGroup>
                </>
              )}
            />
            <Controller
              control={control}
              defaultValue={user.meetupStatus}
              name="meetupStatus"
              render={({ onChange, value }) => (
                <>
                  <Typography variant="h2">{MEETUP_STATUS}</Typography>
                  <RadioGroup
                    row
                    aria-label={MEETUP_STATUS}
                    name="meetupStatus"
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className={classes.radioButtons}
                  >
                    <FormControlLabel
                      value={MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP}
                      control={<Radio />}
                      label={MEETUP}
                    />
                    <FormControlLabel
                      value={MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP}
                      control={<Radio />}
                      label={MAYBE_MEETUP}
                    />
                    <FormControlLabel
                      value={MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP}
                      control={<Radio />}
                      label={NO_MEETUP}
                    />
                  </RadioGroup>
                </>
              )}
            />
            <Controller
              control={control}
              defaultValue={user.pronouns}
              name="pronouns"
              render={({ onChange, value }) => {
                const other =
                  value === FEMALE_PRONOUNS || value === MALE_PRONOUNS
                    ? ""
                    : value;
                return (
                  <>
                    <Typography variant="h2">{PRONOUNS}</Typography>
                    <RadioGroup
                      row
                      aria-label={PRONOUNS}
                      name="pronouns"
                      value={value}
                      onChange={(_, value) => onChange(value)}
                      className={classes.radioButtons}
                    >
                      <FormControlLabel
                        value={FEMALE_PRONOUNS}
                        control={<Radio />}
                        label={FEMALE_PRONOUNS}
                      />
                      <FormControlLabel
                        value={MALE_PRONOUNS}
                        control={<Radio />}
                        label={MALE_PRONOUNS}
                      />
                      <FormControlLabel
                        value={other}
                        control={<Radio />}
                        label={
                          <TextField
                            onChange={(event) => onChange(event.target.value)}
                            value={other}
                          />
                        }
                      />
                    </RadioGroup>
                  </>
                );
              }}
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
                  label={LANGUAGES_SPOKEN}
                  id="languages"
                />
              )}
            />
            <ProfileTextInput
              id="hometown"
              label={HOMETOWN}
              name="hometown"
              defaultValue={user.hometown}
              inputRef={register}
              className={classes.field}
            />
            <ProfileTextInput
              id="occupation"
              label={OCCUPATION}
              name="occupation"
              defaultValue={user.occupation}
              inputRef={register}
              className={classes.field}
            />
            <ProfileTextInput
              id="education"
              label={EDUCATION}
              name="education"
              defaultValue={user.education}
              inputRef={register}
              className={classes.field}
            />
            <ProfileMarkdownInput
              id="aboutMe"
              label={WHO}
              name="aboutMe"
              defaultValue={user.aboutMe}
              control={control}
              className={classes.field}
            />
            <ProfileMarkdownInput
              id="thingsILike"
              label={HOBBIES}
              name="thingsILike"
              defaultValue={user.thingsILike}
              control={control}
              className={classes.field}
            />
            <ProfileMarkdownInput
              id="additionalInformation"
              label={ADDITIONAL}
              name="additionalInformation"
              defaultValue={user.additionalInformation}
              control={control}
              className={classes.field}
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
                  label={COUNTRIES_VISITED}
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
                  label={COUNTRIES_LIVED}
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
                {SAVE}
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
