import {
  FormControlLabel,
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
import {
  ADDITIONAL,
  EDUCATION,
  HOBBIES,
  HOMETOWN,
  HOSTING_STATUS,
  LANGUAGES_SPOKEN,
  MAN_PRONOUNS,
  MEETUP_STATUS,
  NAME,
  OCCUPATION,
  PRONOUNS,
  REGIONS_LIVED,
  REGIONS_VISITED,
  SAVE,
  WHO,
  WOMAN_PRONOUNS,
} from "features/constants";
import {
  ACCEPTING,
  MAYBE_ACCEPTING,
  MAYBE_MEETUP,
  MEETUP,
  NO_MEETUP,
  NOT_ACCEPTING,
} from "features/profile/constants";
import { useLanguages } from "features/profile/hooks/useLanguages";
import { useRegions } from "features/profile/hooks/useRegions";
import useUpdateUserProfile from "features/profile/hooks/useUpdateUserProfile";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import ProfileTagInput from "features/profile/ProfileTagInput";
import ProfileTextInput from "features/profile/ProfileTextInput";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { HostingStatus, LanguageAbility, MeetupStatus } from "proto/api_pb";
import { userKey } from "queryKeys";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { service, UpdateUserProfileData } from "service/index";
import { useIsMounted, useSafeState } from "utils/hooks";

import {
  DEFAULT_ABOUT_ME_HEADINGS,
  DEFAULT_HOBBIES_HEADINGS,
} from "./constants";
import useStyles from "./styles";

type FormValues = Omit<UpdateUserProfileData, "languageAbilities"> & {
  fluentLanguages: string[];
};

export default function EditProfileForm() {
  const classes = useStyles();
  const {
    updateUserProfile,
    reset: resetUpdate,
    isLoading: updateIsLoading,
    isError: updateError,
  } = useUpdateUserProfile();
  const { data: user, isLoading: userIsLoading } = useCurrentUser();
  const isMounted = useIsMounted();
  const [errorMessage, setErrorMessage] = useSafeState<string | null>(
    isMounted,
    null
  );
  const queryClient = useQueryClient();
  const { control, errors, register, handleSubmit, setValue } =
    useForm<FormValues>({
      defaultValues: {
        city: user?.city,
        lat: user?.lat,
        lng: user?.lng,
        radius: user?.radius,
      },
      shouldFocusError: true,
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

  const { regions, regionsLookup } = useRegions();
  const { languages, languagesLookup } = useLanguages();

  const onSubmit = handleSubmit(
    ({ regionsLived, regionsVisited, fluentLanguages, ...data }) => {
      resetUpdate();
      updateUserProfile(
        {
          profileData: {
            ...data,
            regionsVisited: regionsVisited.map(
              (region) => (regionsLookup || {})[region]
            ),
            regionsLived: regionsLived.map(
              (region) => (regionsLookup || {})[region]
            ),
            languageAbilities: {
              valueList: fluentLanguages.map((language) => ({
                code: (languagesLookup || {})[language],
                fluency: LanguageAbility.Fluency.FLUENCY_FLUENT,
              })),
            },
            aboutMe: DEFAULT_ABOUT_ME_HEADINGS.includes(data.aboutMe)
              ? ""
              : data.aboutMe,
            thingsILike: DEFAULT_HOBBIES_HEADINGS.includes(data.thingsILike)
              ? ""
              : data.thingsILike,
          },
          setMutationError: setErrorMessage,
        },
        {
          // Scoll to top on submission error
          onError: () => {
            window.scroll({ top: 0, behavior: "smooth" });
          },
        }
      );
    },
    // All field validation errors should scroll to their respective field
    // Except the avatar, so this scrolls to top on avatar validation error
    (errors) =>
      errors.avatarKey && window.scroll({ top: 0, behavior: "smooth" })
  );

  return (
    <>
      {updateError && (
        <Alert severity="error">{errorMessage || "Unknown error"}</Alert>
      )}
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
              onSuccess={async (data) => {
                await service.user.updateAvatar(data.key);
                if (user) queryClient.invalidateQueries(userKey(user.userId));
              }}
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
                  value === WOMAN_PRONOUNS || value === MAN_PRONOUNS
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
                        value={WOMAN_PRONOUNS}
                        control={<Radio />}
                        label={WOMAN_PRONOUNS}
                      />
                      <FormControlLabel
                        value={MAN_PRONOUNS}
                        control={<Radio />}
                        label={MAN_PRONOUNS}
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
            {languages && (
              <Controller
                control={control}
                defaultValue={user.languageAbilitiesList.map(
                  (ability) => languages[ability.code]
                )}
                name="fluentLanguages"
                render={({ onChange, value }) => (
                  <ProfileTagInput
                    onChange={(_, value) => onChange(value)}
                    value={value}
                    options={Object.values(languages)}
                    label={LANGUAGES_SPOKEN}
                    id="fluentLanguages"
                  />
                )}
              />
            )}
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
              defaultValue={user.aboutMe || DEFAULT_ABOUT_ME_HEADINGS}
              control={control}
              className={classes.field}
            />
            <ProfileMarkdownInput
              id="thingsILike"
              label={HOBBIES}
              name="thingsILike"
              defaultValue={user.thingsILike || DEFAULT_HOBBIES_HEADINGS}
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
            {regions ? (
              <>
                <Controller
                  control={control}
                  defaultValue={user.regionsVisitedList.map(
                    (region) => regions[region]
                  )}
                  name="regionsVisited"
                  render={({ onChange, value }) => (
                    <ProfileTagInput
                      onChange={(_, values) => onChange(values)}
                      value={value}
                      options={Object.values(regions)}
                      label={REGIONS_VISITED}
                      id="regions-visited"
                    />
                  )}
                />
                <Controller
                  control={control}
                  defaultValue={user.regionsLivedList.map(
                    (region) => regions[region]
                  )}
                  name="regionsLived"
                  render={({ onChange, value }) => (
                    <ProfileTagInput
                      onChange={(_, values) => onChange(values)}
                      value={value}
                      options={Object.values(regions)}
                      label={REGIONS_LIVED}
                      id="regions-lived"
                    />
                  )}
                />
              </>
            ) : null}

            <div className={classes.buttonContainer}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                loading={updateIsLoading}
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
