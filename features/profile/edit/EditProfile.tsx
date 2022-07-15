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
import { useLanguages } from "features/profile/hooks/useLanguages";
import { useRegions } from "features/profile/hooks/useRegions";
import useUpdateUserProfile from "features/profile/hooks/useUpdateUserProfile";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import ProfileTagInput from "features/profile/ProfileTagInput";
import ProfileTextInput from "features/profile/ProfileTextInput";
import { userKey } from "features/queryKeys";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { HostingStatus, LanguageAbility, MeetupStatus } from "proto/api_pb";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { service, UpdateUserProfileData } from "service/index";
import {
  useIsMounted,
  useSafeState,
  useUnsavedChangesWarning,
} from "utils/hooks";

import {
  DEFAULT_ABOUT_ME_HEADINGS,
  DEFAULT_HOBBIES_HEADINGS,
} from "./constants";
import useStyles from "./styles";

type FormValues = Omit<UpdateUserProfileData, "languageAbilities"> & {
  fluentLanguages: string[];
};

export default function EditProfileForm() {
  const { t } = useTranslation([GLOBAL, PROFILE]);
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
  const { control, errors, register, handleSubmit, setValue, formState } =
    useForm<FormValues>({
      defaultValues: {
        city: user?.city,
        lat: user?.lat,
        lng: user?.lng,
        radius: user?.radius,
      },
      shouldFocusError: true,
    });

  const isDirty = formState.isDirty;
  const isSubmitted = formState.isSubmitted;
  useUnsavedChangesWarning({
    isDirty,
    isSubmitted,
    warningMessage: t("profile:unsaved_changes_warning"),
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
        <Alert severity="error">
          {errorMessage || t("global:error.unknown")}
        </Alert>
      )}
      {errors.avatarKey && (
        <Alert severity="error">
          {errors.avatarKey?.message || t("global:error.unknown")}
        </Alert>
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
              label={t("profile:edit_profile_headings.name")}
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
                    setValue("city", location.address, { shouldDirty: true });
                    setValue("lat", location.lat, { shouldDirty: true });
                    setValue("lng", location.lng, { shouldDirty: true });
                    setValue("radius", location.radius, { shouldDirty: true });
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
                  <Typography variant="h2">
                    {t("profile:edit_profile_headings.hosting_status")}
                  </Typography>
                  <RadioGroup
                    row
                    aria-label={t(
                      "profile:edit_profile_headings.hosting_status"
                    )}
                    name="hostingStatus"
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className={classes.radioButtons}
                  >
                    <FormControlLabel
                      value={HostingStatus.HOSTING_STATUS_CAN_HOST}
                      control={<Radio />}
                      label={t("global:hosting_status.can_host")}
                    />
                    <FormControlLabel
                      value={HostingStatus.HOSTING_STATUS_MAYBE}
                      control={<Radio />}
                      label={t("global:hosting_status.maybe")}
                    />
                    <FormControlLabel
                      value={HostingStatus.HOSTING_STATUS_CANT_HOST}
                      control={<Radio />}
                      label={t("global:hosting_status.cant_host")}
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
                  <Typography variant="h2">
                    {t("profile:edit_profile_headings.meetup_status")}
                  </Typography>
                  <RadioGroup
                    row
                    aria-label={t(
                      "profile:edit_profile_headings.meetup_status"
                    )}
                    name="meetupStatus"
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className={classes.radioButtons}
                  >
                    <FormControlLabel
                      value={MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP}
                      control={<Radio />}
                      label={t("global:meetup_status.wants_to_meetup")}
                    />
                    <FormControlLabel
                      value={MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP}
                      control={<Radio />}
                      label={t("global:meetup_status.open_to_meetup")}
                    />
                    <FormControlLabel
                      value={MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP}
                      control={<Radio />}
                      label={t("global:meetup_status.does_not_want_to_meetup")}
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
                  value === t("profile:pronouns.woman") ||
                  value === t("profile:pronouns.man")
                    ? ""
                    : value;
                return (
                  <>
                    <Typography variant="h2">
                      {t("profile:edit_profile_headings.pronouns")}
                    </Typography>
                    <RadioGroup
                      row
                      aria-label={t("profile:edit_profile_headings.pronouns")}
                      name="pronouns"
                      value={value}
                      onChange={(_, value) => onChange(value)}
                      className={classes.radioButtons}
                    >
                      <FormControlLabel
                        value={t("profile:pronouns.woman")}
                        control={<Radio />}
                        label={t("profile:pronouns.woman")}
                      />
                      <FormControlLabel
                        value={t("profile:pronouns.man")}
                        control={<Radio />}
                        label={t("profile:pronouns.man")}
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
                    label={t("profile:edit_profile_headings.languages_spoken")}
                    id="fluentLanguages"
                  />
                )}
              />
            )}
            <ProfileTextInput
              id="hometown"
              label={t("profile:edit_profile_headings.hometown")}
              name="hometown"
              defaultValue={user.hometown}
              inputRef={register}
              className={classes.field}
            />
            <ProfileTextInput
              id="occupation"
              label={t("profile:edit_profile_headings.occupation")}
              name="occupation"
              defaultValue={user.occupation}
              inputRef={register}
              className={classes.field}
            />
            <ProfileTextInput
              id="education"
              label={t("profile:edit_profile_headings.education")}
              name="education"
              defaultValue={user.education}
              inputRef={register}
              className={classes.field}
            />
            <ProfileMarkdownInput
              id="aboutMe"
              label={t("profile:heading.who_section")}
              name="aboutMe"
              defaultValue={user.aboutMe || DEFAULT_ABOUT_ME_HEADINGS}
              control={control}
              className={classes.field}
            />
            <ProfileMarkdownInput
              id="thingsILike"
              label={t("profile:heading.hobbies_section")}
              name="thingsILike"
              defaultValue={user.thingsILike || DEFAULT_HOBBIES_HEADINGS}
              control={control}
              className={classes.field}
            />
            <ProfileMarkdownInput
              id="additionalInformation"
              label={t("profile:heading.additional_information_section")}
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
                      label={t("profile:edit_profile_headings.regions_visited")}
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
                      label={t("profile:edit_profile_headings.regions_lived")}
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
                {t("global:save")}
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
