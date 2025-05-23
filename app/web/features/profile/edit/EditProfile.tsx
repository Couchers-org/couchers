import {
  DialogContent,
  FormControlLabel,
  List,
  ListItem,
  Radio,
  RadioGroup,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { Dialog, DialogActions, DialogTitle } from "components/Dialog";
import EditLocationMap from "components/EditLocationMap";
import ImageInput from "components/ImageInput";
import StyledLink from "components/StyledLink";
import { useLanguages } from "features/profile/hooks/useLanguages";
import { useRegions } from "features/profile/hooks/useRegions";
import useUpdateUserProfile from "features/profile/hooks/useUpdateUserProfile";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import ProfileTagInput from "features/profile/ProfileTagInput";
import ProfileTextInput from "features/profile/ProfileTextInput";
import { userKey } from "features/queryKeys";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL, PROFILE } from "i18n/namespaces";
import { HostingStatus, LanguageAbility, MeetupStatus } from "proto/api_pb";
import React, { FormEvent, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "react-query";
import { howToMakeGreatProfileUrl } from "routes";
import { service, UpdateUserProfileData } from "service/index";
import {
  useIsMounted,
  useSafeState,
  useUnsavedChangesWarning,
} from "utils/hooks";

import {
  ABOUT_ME_MIN_LENGTH,
  DEFAULT_ABOUT_ME_HEADINGS,
  DEFAULT_HOBBIES_HEADINGS,
} from "./constants";
import useStyles from "./styles";

const StyledAlert = styled(Alert)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export type EditProfileFormValues = Omit<
  UpdateUserProfileData,
  "languageAbilities" | "city" | "lat" | "lng" | "radius"
> & {
  fluentLanguages: string[];
  location: {
    city: string;
    lat: number;
    lng: number;
    radius: number;
  };
};

export default function EditProfileForm() {
  const { t } = useTranslation([GLOBAL, AUTH, PROFILE]);
  const classes = useStyles();
  const {
    updateUserProfile,
    reset: resetUpdate,
    isLoading: updateIsLoading,
    isError: updateError,
  } = useUpdateUserProfile();
  const { data: user } = useCurrentUser();
  const isMounted = useIsMounted();
  const [errorMessage, setErrorMessage] = useSafeState<string | null>(
    isMounted,
    null,
  );
  const [showIncompleteProfileDialog, setShowIncompleteProfileDialog] =
    useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitted },
  } = useForm<EditProfileFormValues>({
    defaultValues: {
      location: {
        city: user?.city,
        lat: user?.lat,
        lng: user?.lng,
        radius: user?.radius,
      },
      aboutMe: user?.aboutMe || DEFAULT_ABOUT_ME_HEADINGS,
    },
    shouldFocusError: true,
  });

  const aboutMeField = useWatch({
    control,
    name: "aboutMe",
  });

  // @TODO(NA) This is not entirely perfect, it will pass if they have the default headings
  // but added just enough to make 150 chars. Will fail if only default headers though. Avoiding
  // doing a complicated parsing function to count everything expect the default headigns since it'll be mixed in.
  const aboutMeFieldLength =
    aboutMeField === DEFAULT_ABOUT_ME_HEADINGS ? 0 : aboutMeField.length;

  useUnsavedChangesWarning({
    isDirty: isDirty || isUploading,
    isSubmitted: isSubmitted,
    warningMessage: isUploading
      ? t("profile:image_uploading_warning")
      : t("profile:unsaved_changes_warning"),
  });

  const { regions, regionsLookup } = useRegions();
  const { languages, languagesLookup } = useLanguages();

  const onSubmit = handleSubmit(
    ({ regionsLived, regionsVisited, fluentLanguages, ...data }) => {
      resetUpdate();

      const { location, ...restData } = data;

      updateUserProfile(
        {
          profileData: {
            ...location,
            ...restData,
            regionsVisited: regionsVisited.map(
              (region) => (regionsLookup || {})[region],
            ),
            regionsLived: regionsLived.map(
              (region) => (regionsLookup || {})[region],
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
        },
      );

      if (showIncompleteProfileDialog) {
        setShowIncompleteProfileDialog(false);
      }
    },
    // All field validation errors should scroll to their respective field
    // Except the avatar, so this scrolls to top on avatar validation error
    (errors) =>
      errors.avatarKey && window.scroll({ top: 0, behavior: "smooth" }),
  );

  const handleSubmitButtonClick = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (aboutMeFieldLength < ABOUT_ME_MIN_LENGTH || !user?.avatarUrl) {
      setShowIncompleteProfileDialog(true);
    } else {
      onSubmit();
    }
  };

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
      {!user?.avatarUrl && (
        <StyledAlert severity="warning">
          {t("profile:helper_text.missing_profile_photo")}
        </StyledAlert>
      )}
      {user ? (
        <>
          <div className={classes.helpTextContainer}>
            <Typography variant="body1">
              <Trans i18nKey="profile:edit_profile_helper_text">
                Looking for some inspiration on where to start?{" "}
                <StyledLink variant="body1" href={howToMakeGreatProfileUrl}>
                  Check out our guide on creating an awesome profile
                </StyledLink>
                .
              </Trans>
            </Typography>
          </div>
          <form onSubmit={onSubmit} className={classes.topFormContainer}>
            <ImageInput
              className={classes.avatar}
              control={control}
              id="profile-picture"
              name="avatarKey"
              initialPreviewSrc={user.avatarUrl}
              userName={user.name}
              type="avatar"
              onUploading={setIsUploading} //track upload state
              onSuccess={async (data) => {
                await service.user.updateAvatar(data.key);
                if (user) queryClient.invalidateQueries(userKey(user.userId));
              }}
            />
            <ProfileTextInput
              id="name"
              {...register("name", { required: true })}
              label={t("profile:edit_profile_headings.name")}
              defaultValue={user.name}
              error={!!errors.name}
              className={classes.field}
              helperText={
                errors.name ? t("profile:edit_profile_name_required") : ""
              }
            />
          </form>
          <Controller
            defaultValue={{
              city: user.city,
              lat: user.lat,
              lng: user.lng,
              radius: user.radius,
            }}
            name="location"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <EditLocationMap
                inputFieldProps={field}
                inputFieldError={error}
                showRadiusSlider
                initialLocation={{
                  address: user.city,
                  lat: user.lat,
                  lng: user.lng,
                  radius: user.radius,
                }}
                updateLocation={(location) => {
                  if (location) {
                    setValue("location.city", location.address, {
                      shouldDirty: true,
                    });
                    setValue("location.lat", location.lat, {
                      shouldDirty: true,
                    });
                    setValue("location.lng", location.lng, {
                      shouldDirty: true,
                    });
                    setValue("location.radius", location.radius, {
                      shouldDirty: true,
                    });
                  }
                }}
              />
            )}
          />
          <form
            onSubmit={handleSubmitButtonClick}
            className={classes.bottomFormContainer}
          >
            <Controller
              control={control}
              defaultValue={user.hostingStatus}
              name="hostingStatus"
              render={({ field }) => (
                <>
                  <Typography variant="h2">
                    {t("profile:edit_profile_headings.hosting_status")}
                  </Typography>
                  <RadioGroup
                    {...field}
                    row
                    aria-label={t(
                      "profile:edit_profile_headings.hosting_status",
                    )}
                    name="hostingStatus"
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
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
              render={({ field }) => (
                <>
                  <Typography variant="h2">
                    {t("profile:edit_profile_headings.meetup_status")}
                  </Typography>
                  <RadioGroup
                    {...field}
                    row
                    aria-label={t(
                      "profile:edit_profile_headings.meetup_status",
                    )}
                    name="meetupStatus"
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
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
              render={({ field }) => {
                const other =
                  field.value === t("profile:pronouns.woman") ||
                  field.value === t("profile:pronouns.man")
                    ? ""
                    : field.value;
                return (
                  <>
                    <Typography variant="h2">
                      {t("profile:edit_profile_headings.pronouns")}
                    </Typography>
                    <RadioGroup
                      {...field}
                      row
                      aria-label={t("profile:edit_profile_headings.pronouns")}
                      name="pronouns"
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
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
                            variant="standard"
                            onChange={(event) =>
                              field.onChange(event.target.value)
                            }
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
                  (ability) => languages[ability.code],
                )}
                name="fluentLanguages"
                render={({ field }) => (
                  <ProfileTagInput
                    inputFieldProps={field}
                    onChange={(_, value) => field.onChange(value)}
                    value={field.value}
                    options={Object.values(languages)}
                    label={t("profile:edit_profile_headings.languages_spoken")}
                    id="fluentLanguages"
                  />
                )}
              />
            )}
            <ProfileTextInput
              id="hometown"
              {...register("hometown")}
              label={t("profile:edit_profile_headings.hometown")}
              defaultValue={user.hometown}
              className={classes.field}
            />
            <ProfileTextInput
              id="occupation"
              {...register("occupation")}
              label={t("profile:edit_profile_headings.occupation")}
              defaultValue={user.occupation}
              className={classes.field}
            />
            <ProfileTextInput
              id="education"
              {...register("education")}
              label={t("profile:edit_profile_headings.education")}
              defaultValue={user.education}
              className={classes.field}
            />
            <ProfileMarkdownInput
              id="aboutMe"
              label={t("profile:heading.who_section")}
              name="aboutMe"
              defaultValue={user.aboutMe || DEFAULT_ABOUT_ME_HEADINGS}
              control={control}
              className={classes.field}
              warning={aboutMeFieldLength < ABOUT_ME_MIN_LENGTH}
              helperText={t("profile:helper_text.characters_remaining", {
                count: ABOUT_ME_MIN_LENGTH - aboutMeFieldLength,
              })}
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
                    (region) => regions[region],
                  )}
                  name="regionsVisited"
                  render={({ field }) => (
                    <ProfileTagInput
                      inputFieldProps={field}
                      onChange={(_, values) => field.onChange(values)}
                      value={field.value}
                      options={Object.values(regions)}
                      label={t("profile:edit_profile_headings.regions_visited")}
                      id="regions-visited"
                    />
                  )}
                />
                <Controller
                  control={control}
                  defaultValue={user.regionsLivedList.map(
                    (region) => regions[region],
                  )}
                  name="regionsLived"
                  render={({ field }) => (
                    <ProfileTagInput
                      inputFieldProps={field}
                      onChange={(_, values) => field.onChange(values)}
                      value={field.value}
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
                loading={updateIsLoading || isUploading}
                disabled={updateIsLoading || isUploading}
              >
                {t("global:save")}
              </Button>
            </div>
          </form>
          <Dialog
            aria-labelledby={t("profile:incomplete_dialog.title")}
            maxWidth="xs"
            open={showIncompleteProfileDialog}
            data-testid="incomplete-profile-dialog"
          >
            <DialogTitle>{t("profile:incomplete_dialog.title")}</DialogTitle>
            <DialogContent>
              <Typography></Typography>
              <List>
                <Typography paragraph>
                  {t("profile:incomplete_dialog.description")}
                </Typography>
                {aboutMeFieldLength < ABOUT_ME_MIN_LENGTH && (
                  <ListItem key={1} style={{ display: "list-item" }}>
                    {`• ${t("profile:incomplete_dialog.about_me_message")}`}
                  </ListItem>
                )}
                {!user.avatarUrl && (
                  <ListItem key={2} style={{ display: "list-item" }}>
                    {`• ${t(
                      "profile:incomplete_dialog.missing_photo_message",
                    )}`}
                  </ListItem>
                )}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowIncompleteProfileDialog(false)}>
                {t("profile:incomplete_dialog.continue_editing")}
              </Button>
              <Button onClick={onSubmit}>
                {t("profile:incomplete_dialog.save_anyway")}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <CenteredSpinner />
      )}
    </>
  );
}
