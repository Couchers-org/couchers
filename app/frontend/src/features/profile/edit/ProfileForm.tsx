import {
  FormControlLabel,
  makeStyles,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import EditUserLocationMap from "components/EditUserLocationMap";
import {
  ABOUT_HOME,
  ABOUT_ME,
  ADDITIONAL,
  COUNTRIES_LIVED,
  COUNTRIES_VISITED,
  EDUCATION,
  FEMALE,
  FEMALE_PRONOUNS,
  GENDER,
  HOBBIES,
  HOMETOWN,
  HOSTING_STATUS,
  LANGUAGES_SPOKEN,
  MALE,
  MALE_PRONOUNS,
  OCCUPATION,
  PRONOUNS,
  SAVE,
} from "features/constants";
import {
  ACCEPTING,
  MAYBE_ACCEPTING,
  MAYBE_MEETUP,
  MEETUP,
  NO_MEETUP,
  NOT_ACCEPTING,
} from "features/profile/constants";
import ProfileTagInput from "features/profile/ProfileTagInput";
import ProfileTextInput from "features/profile/ProfileTextInput";
import useUpdateUserProfile from "features/profile/useUpdateUserProfile";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { HostingStatus, MeetupStatus } from "pb/api_pb";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { UpdateUserProfileData } from "service/index";
import { useIsMounted, useSafeState } from "utils/hooks";

const useStyles = makeStyles((theme) => ({
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    paddingBottom: theme.spacing(1),
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
        <Alert severity="error">{errorMessage || "Unknown error"}</Alert>
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
            <Controller
              control={control}
              defaultValue={user.hostingStatus}
              name="hostingStatus"
              render={({ onChange, value }) => (
                <>
                  <Typography variant="h2">{HOSTING_STATUS}</Typography>
                  <RadioGroup
                    row
                    aria-label="hosting status"
                    name="hostingStatus"
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
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
                  <Typography variant="h2">{HOSTING_STATUS}</Typography>
                  <RadioGroup
                    row
                    aria-label="meetup status"
                    name="meetupStatus"
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
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
              defaultValue={user.gender}
              name="gender"
              render={({ onChange, value }) => {
                const other = value === FEMALE || value === MALE ? "" : value;
                return (
                  <>
                    <Typography variant="h2">{GENDER}</Typography>
                    <RadioGroup
                      row
                      aria-label="gender"
                      name="gender"
                      value={value}
                      onChange={(_, value) => onChange(value)}
                    >
                      <FormControlLabel
                        value={FEMALE}
                        control={<Radio />}
                        label={FEMALE}
                      />
                      <FormControlLabel
                        value={MALE}
                        control={<Radio />}
                        label={MALE}
                      />
                      <FormControlLabel
                        value={other}
                        control={<Radio />}
                        checked={value !== FEMALE && value !== MALE}
                        label={
                          <TextField
                            onChange={(event) => onChange(event.target.value)}
                            defaultValue={other}
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
                      aria-label="pronouns"
                      name="pronouns"
                      value={value}
                      onChange={(_, value) => onChange(value)}
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
                            defaultValue={other}
                            value={other}
                          />
                        }
                      />
                    </RadioGroup>
                  </>
                );
              }}
            />
            <ProfileTextInput
              label={HOMETOWN}
              name="hometown"
              defaultValue={user.hometown}
              inputRef={register}
              className={classes.field}
            />
            <ProfileTextInput
              label={OCCUPATION}
              name="occupation"
              defaultValue={user.occupation}
              inputRef={register}
              className={classes.field}
            />
            <ProfileTextInput
              label={EDUCATION}
              name="education"
              defaultValue={user.education}
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
                  label={LANGUAGES_SPOKEN}
                  id="languages"
                  className={classes.tagInput}
                />
              )}
            />
            <ProfileTextInput
              label={ABOUT_ME}
              name="aboutMe"
              defaultValue={user.aboutMe}
              inputRef={register}
              className={classes.field}
              multiline
              rows={10}
            />
            <ProfileTextInput
              label={HOBBIES}
              name="thingsILike"
              defaultValue={user.thingsILike}
              inputRef={register}
              className={classes.field}
              multiline
              rows={10}
            />
            <ProfileTextInput
              label={ADDITIONAL}
              name="additionalInformation"
              defaultValue={user.additionalInformation}
              inputRef={register}
              className={classes.field}
              multiline
              rows={10}
            />
            <ProfileTextInput
              label={ABOUT_HOME}
              name="aboutPlace"
              defaultValue={user.aboutPlace}
              inputRef={register}
              className={classes.field}
              multiline
              rows={10}
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
                  label={COUNTRIES_LIVED}
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
