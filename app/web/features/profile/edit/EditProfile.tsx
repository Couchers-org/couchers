import { Cancel, CheckCircle, Help, SearchOutlined } from "@mui/icons-material";
import {
  Box,
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
import StatusCardGroup from "./StatusCard";
import useStyles from "./styles";

const StyledAlert = styled(Alert)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const ProfileSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.common.white,
  border: `1px solid ${theme.palette.grey[200]}`,
  position: "relative",

  "&:hover": {
    borderColor: theme.palette.primary.light,
    boxShadow: `0 4px 20px rgba(0, 163, 152, 0.08)`,
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: "1.5rem",
  fontWeight: 700,
  marginBottom: theme.spacing(3),
  paddingBottom: theme.spacing(1),
  borderBottom: `2px solid ${theme.palette.primary.light}`,
}));

const SectionSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: "1rem",
  fontWeight: 500,
  marginBottom: theme.spacing(2),
}));

const FieldGroup = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const RadioGroupContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  "& .MuiFormControlLabel-root": {
    marginRight: theme.spacing(3),
    marginBottom: theme.spacing(1),
  },
}));

const HelpTextContainer = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const AvatarContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1),
}));

const StickySaveBar = styled(Box)(({ theme }) => ({
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: theme.palette.common.white,
  borderTop: `1px solid ${theme.palette.grey[200]}`,
  boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.1)",
  padding: theme.spacing(1.5, 3),
  zIndex: 1000,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const SaveButton = styled(Button)(({ theme }) => ({
  minWidth: 200,
  borderRadius: 22,
  fontSize: "1rem",
  fontWeight: 600,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  transition: "all 0.2s ease-in-out",

  "&:hover": {
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
    transform: "translateY(-1px)",
  },
}));

const BottomSpacer = styled(Box)(({ theme }) => ({
  height: 80,
  marginBottom: theme.spacing(2),
}));

const SearchIndicator = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  border: `1px solid ${theme.palette.grey[200]}`,
  borderRadius: theme.spacing(1),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const SearchIcon = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  color: theme.palette.primary.main,
  fontSize: "0.875rem",
}));

const SearchText = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  fontWeight: 500,
  color: theme.palette.grey[700],
  lineHeight: 1.3,
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
  // but added just enough to make 150 chars. Will fail if only default headigns though. Avoiding
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
          <HelpTextContainer>
            <Typography>
              <Trans i18nKey="profile:edit_profile_helper_text">
                Looking for some inspiration on where to start?{" "}
                <StyledLink variant="body1" href={howToMakeGreatProfileUrl}>
                  Check out our guide on creating an awesome profile
                </StyledLink>
                .
              </Trans>
            </Typography>
          </HelpTextContainer>

          <form onSubmit={handleSubmitButtonClick}>
            {/* Basic Information Section */}
            <ProfileSection>
              <SectionTitle>
                {t("profile:edit_profile_headings.basic_information")}
              </SectionTitle>
              <SectionSubtitle>
                {t("profile:edit_profile_headings.basic_information_subtitle")}
              </SectionSubtitle>

              <AvatarContainer>
                <ImageInput
                  className={classes.avatar}
                  control={control}
                  id="profile-picture"
                  name="avatarKey"
                  initialPreviewSrc={user.avatarUrl}
                  userName={user.name}
                  type="avatar"
                  onUploading={setIsUploading}
                  onSuccess={async (data) => {
                    await service.user.updateAvatar(data.key);
                    if (user)
                      queryClient.invalidateQueries(userKey(user.userId));
                  }}
                />
              </AvatarContainer>

              <FieldGroup>
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
              </FieldGroup>

              <FieldGroup>
                <SectionSubtitle>
                  {t("profile:edit_profile_headings.location_subtitle")}
                </SectionSubtitle>

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
              </FieldGroup>
            </ProfileSection>

            {/* Preferences Section */}
            <ProfileSection>
              <SectionTitle>
                {t("profile:edit_profile_headings.preferences")}
              </SectionTitle>
              <SectionSubtitle>
                {t("profile:edit_profile_headings.preferences_subtitle")}
              </SectionSubtitle>

              <FieldGroup>
                <Controller
                  control={control}
                  defaultValue={user.hostingStatus}
                  name="hostingStatus"
                  render={({ field }) => (
                    <StatusCardGroup
                      title={t("profile:edit_profile_headings.hosting_status")}
                      selectedValue={field.value}
                      onSelect={field.onChange}
                      options={[
                        {
                          value: HostingStatus.HOSTING_STATUS_CAN_HOST,
                          title: t("global:hosting_status.can_host"),
                          description: t(
                            "profile:hosting_status.can_host_description",
                          ),
                          icon: (
                            <CheckCircle
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value ===
                                  HostingStatus.HOSTING_STATUS_CAN_HOST
                                    ? "primary.main"
                                    : "grey.100",
                              }}
                            />
                          ),
                        },
                        {
                          value: HostingStatus.HOSTING_STATUS_MAYBE,
                          title: t("global:hosting_status.maybe"),
                          description: t(
                            "profile:hosting_status.maybe_host_description",
                          ),
                          icon: (
                            <Help
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value ===
                                  HostingStatus.HOSTING_STATUS_MAYBE
                                    ? "primary.main"
                                    : "grey.100",
                              }}
                            />
                          ),
                        },
                        {
                          value: HostingStatus.HOSTING_STATUS_CANT_HOST,
                          title: t("global:hosting_status.cant_host"),
                          description: t(
                            "profile:hosting_status.cannot_host_description",
                          ),
                          icon: (
                            <Cancel
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value ===
                                  HostingStatus.HOSTING_STATUS_CANT_HOST
                                    ? "primary.main"
                                    : "grey.100",
                              }}
                            />
                          ),
                        },
                      ]}
                    />
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  control={control}
                  defaultValue={user.meetupStatus}
                  name="meetupStatus"
                  render={({ field }) => (
                    <StatusCardGroup
                      title={t("profile:edit_profile_headings.meetup_status")}
                      selectedValue={field.value}
                      onSelect={field.onChange}
                      options={[
                        {
                          value: MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP,
                          title: t("global:meetup_status.wants_to_meetup"),
                          description: t(
                            "profile:meetup_status.wants_to_meetup_description",
                          ),
                          icon: (
                            <CheckCircle
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value ===
                                  MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP
                                    ? "primary.main"
                                    : "grey.100",
                              }}
                            />
                          ),
                        },
                        {
                          value: MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP,
                          title: t("global:meetup_status.open_to_meetup"),
                          description: t(
                            "profile:meetup_status.open_to_meetup_description",
                          ),
                          icon: (
                            <Help
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value ===
                                  MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP
                                    ? "primary.main"
                                    : "grey.100",
                              }}
                            />
                          ),
                        },
                        {
                          value:
                            MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP,
                          title: t(
                            "global:meetup_status.does_not_want_to_meetup",
                          ),
                          description: t(
                            "profile:meetup_status.does_not_want_to_meetup_description",
                          ),
                          icon: (
                            <Cancel
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value ===
                                  MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP
                                    ? "primary.main"
                                    : "grey.100",
                              }}
                            />
                          ),
                        },
                      ]}
                    />
                  )}
                />
              </FieldGroup>
            </ProfileSection>

            {/* Personal Information Section */}
            <ProfileSection>
              <SectionTitle>
                {t("profile:edit_profile_headings.personal_information")}
              </SectionTitle>
              <SectionSubtitle>
                {t(
                  "profile:edit_profile_headings.personal_information_subtitle",
                )}
              </SectionSubtitle>

              <FieldGroup>
                <Typography variant="h3" gutterBottom>
                  {t("profile:edit_profile_headings.pronouns")}
                </Typography>
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
                      <RadioGroupContainer>
                        <RadioGroup
                          {...field}
                          row
                          aria-label={t(
                            "profile:edit_profile_headings.pronouns",
                          )}
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
                      </RadioGroupContainer>
                    );
                  }}
                />
              </FieldGroup>

              {languages && (
                <FieldGroup>
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
                        label={t(
                          "profile:edit_profile_headings.languages_spoken",
                        )}
                        id="fluentLanguages"
                      />
                    )}
                  />
                </FieldGroup>
              )}

              <FieldGroup>
                <ProfileTextInput
                  id="hometown"
                  {...register("hometown")}
                  label={t("profile:edit_profile_headings.hometown")}
                  defaultValue={user.hometown}
                  className={classes.field}
                />
              </FieldGroup>

              <FieldGroup>
                <ProfileTextInput
                  id="occupation"
                  {...register("occupation")}
                  label={t("profile:edit_profile_headings.occupation")}
                  defaultValue={user.occupation}
                  className={classes.field}
                />
              </FieldGroup>

              <FieldGroup>
                <ProfileTextInput
                  id="education"
                  {...register("education")}
                  label={t("profile:edit_profile_headings.education")}
                  defaultValue={user.education}
                  className={classes.field}
                />
              </FieldGroup>
            </ProfileSection>

            {/* About Me Section */}
            <ProfileSection>
              <SectionTitle>{t("profile:heading.who_section")}</SectionTitle>
              <SectionSubtitle>
                <Trans i18nKey="profile:edit_profile_headings.about_me_subtitle">
                  Tell others about yourself. This is where trust begins. Help
                  others get a sense of who you really are. See{" "}
                  <StyledLink
                    variant="body1"
                    href="https://help.couchers.org/hc/couchersorg-help-center/articles/1725919197-how-do-i-create-a-great-profile"
                    sx={{ fontWeight: "bold" }}
                    target="_blank"
                  />
                  .
                </Trans>
              </SectionSubtitle>

              <FieldGroup>
                <ProfileMarkdownInput
                  id="aboutMe"
                  label={t("profile:heading.about_me")}
                  name="aboutMe"
                  defaultValue={user.aboutMe || DEFAULT_ABOUT_ME_HEADINGS}
                  control={control}
                  className={classes.field}
                  warning={aboutMeFieldLength < ABOUT_ME_MIN_LENGTH}
                  helperText={t("profile:helper_text.characters_remaining", {
                    count: ABOUT_ME_MIN_LENGTH - aboutMeFieldLength,
                  })}
                  description={
                    <SearchIndicator>
                      <SearchIcon>
                        <SearchOutlined />
                      </SearchIcon>
                      <SearchText>{t("profile:search_indicator")}</SearchText>
                    </SearchIndicator>
                  }
                />
              </FieldGroup>

              <FieldGroup>
                <ProfileMarkdownInput
                  id="thingsILike"
                  label={t("profile:heading.hobbies_section")}
                  name="thingsILike"
                  defaultValue={user.thingsILike || DEFAULT_HOBBIES_HEADINGS}
                  control={control}
                  className={classes.field}
                />
              </FieldGroup>

              <FieldGroup>
                <ProfileMarkdownInput
                  id="additionalInformation"
                  label={t("profile:heading.additional_information_section")}
                  name="additionalInformation"
                  defaultValue={user.additionalInformation}
                  control={control}
                  className={classes.field}
                />
              </FieldGroup>
            </ProfileSection>

            {/* Travel Experience Section */}
            {regions && (
              <ProfileSection>
                <SectionTitle>
                  {t("profile:edit_profile_headings.travel_experience")}
                </SectionTitle>
                <SectionSubtitle>
                  {t(
                    "profile:edit_profile_headings.travel_experience_subtitle",
                  )}
                </SectionSubtitle>

                <FieldGroup>
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
                        label={t(
                          "profile:edit_profile_headings.regions_visited",
                        )}
                        id="regions-visited"
                      />
                    )}
                  />
                </FieldGroup>

                <FieldGroup>
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
                </FieldGroup>
              </ProfileSection>
            )}

            {/* Bottom spacer to prevent content from being hidden behind sticky bar */}
            <BottomSpacer />
          </form>

          {/* Sticky Save Bar */}
          {user && (
            <StickySaveBar>
              <SaveButton
                type="submit"
                variant="contained"
                color="primary"
                loading={updateIsLoading || isUploading}
                disabled={!isDirty || updateIsLoading || isUploading}
                onClick={handleSubmitButtonClick}
              >
                {updateIsLoading || isUploading
                  ? t("global:saving")
                  : t("global:save")}
              </SaveButton>
            </StickySaveBar>
          )}

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
