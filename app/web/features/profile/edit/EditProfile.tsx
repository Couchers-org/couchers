import { Cancel, CheckCircle, Help, InfoOutlined } from "@mui/icons-material";
import { Box, DialogContent, List, ListItem, styled, Tooltip, Typography } from "@mui/material";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { Dialog, DialogActions, DialogTitle } from "components/Dialog";
import EditLocationMap from "components/EditLocationMap";
import GalleryEditor from "components/GalleryEditor/GalleryEditor";
import Snackbar from "components/Snackbar";
import StyledLink from "components/StyledLink";
import { useLanguages } from "features/profile/hooks/useLanguages";
import { useRegions } from "features/profile/hooks/useRegions";
import useUpdateUserProfile from "features/profile/hooks/useUpdateUserProfile";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import ProfileTagInput from "features/profile/ProfileTagInput";
import ProfileTextInput from "features/profile/ProfileTextInput";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { StatusCode } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { HostingStatus, LanguageAbility, MeetupStatus } from "proto/api_pb";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { howToMakeGreatProfileUrl, settingsRoute } from "routes";
import { UpdateUserProfileData } from "service/index";
import isGrpcError from "service/utils/isGrpcError";
import { theme } from "theme";
import { useIsMounted, useSafeState, useUnsavedChangesWarning } from "utils/hooks";
import { useIsNativeEmbed } from "utils/nativeLink";
import { nameMaxLength, nameMinLength, nameValidationPattern, profileAboutMeMinLength } from "utils/validation";

import StatusCardGroup from "./StatusCard";

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

const StyledAlert = styled(Alert)(() => ({
  marginTop: theme.spacing(2),
}));

const ProfileSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(2),
  border: `1px solid var(--mui-palette-primary-light)`,
  position: "relative",
  boxShadow: `0 4px 20px rgba(0, 163, 152, 0.08)`,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: "1.5rem",
  fontWeight: 700,
  marginBottom: theme.spacing(3),
  paddingBottom: theme.spacing(1),
  borderBottom: `2px solid var(--mui-palette-primary-light)`,
}));

const SectionSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: "1rem",
  fontWeight: 500,
  marginBottom: theme.spacing(2),
}));

const FieldGroup = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const HelpTextContainer = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const AvatarContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: "var(--mui-palette-grey-50)",
  borderRadius: theme.spacing(1),
  width: "100%",

  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    gap: theme.spacing(2),
  },
}));

const AvatarImageWrapper = styled(Box)(({ theme }) => ({
  flex: "0 0 33%",
  maxWidth: "33%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",

  [theme.breakpoints.down("sm")]: {
    maxWidth: "100%",
    width: "100%",
    marginBottom: theme.spacing(2),
  },
}));

const ClickableAvatarWrapper = styled(Box)(() => ({
  cursor: "pointer",
  transition: "transform 0.2s ease-in-out, opacity 0.2s ease-in-out",
  "&:hover": {
    transform: "scale(1.05)",
    opacity: 0.8,
  },
  "&:active": {
    transform: "scale(0.98)",
  },
}));

const AvatarTextWrapper = styled(Box)(({ theme }) => ({
  flex: "1 1 67%",
  maxWidth: "67%",
  display: "flex",
  alignItems: "flex-start",
  [theme.breakpoints.down("sm")]: {
    maxWidth: "100%",
    width: "100%",
  },
}));

const StickySaveBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isNativeEmbed",
})<{ $isNativeEmbed?: boolean }>(({ theme, $isNativeEmbed }) => {
  // Mobile web has bottom nav (55px), native embed doesn't
  const bottomNavHeight = $isNativeEmbed ? 0 : 55;
  // Native tabs handle safe area, mobile web needs extra padding
  const safePadding = $isNativeEmbed
    ? theme.spacing(1)
    : `calc(${theme.spacing(1)} + env(safe-area-inset-bottom, 0px))`;

  return {
    position: "fixed",
    bottom: "var(--cookie-banner-height, 0px)",
    left: 0,
    right: 0,
    backgroundColor: "var(--mui-palette-background-paper)",
    borderTop: `1px solid var(--mui-palette-grey-200)`,
    boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.1)",
    padding: theme.spacing(1.5, 3),
    zIndex: 1200,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing(2),

    [theme.breakpoints.down("md")]: {
      bottom: `calc(${bottomNavHeight}px + var(--cookie-banner-height, 0px))`,
      padding: theme.spacing(1),
      paddingBottom: safePadding,
    },
  };
});

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

  [theme.breakpoints.down("md")]: {
    minWidth: 150,
    fontSize: "0.9rem",
    padding: theme.spacing(1, 2),
  },
}));

const BottomSpacer = styled(Box)(({ theme }) => ({
  height: 80,
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    height: 140,
  },
}));

const styledField = <C extends React.ComponentType<React.ComponentProps<C>>>(component: C) => {
  return styled(component)(() => ({
    [theme.breakpoints.up("md")]: {
      "& > .MuiInputBase-root": {
        width: 400,
      },
    },
    "& > .MuiInputBase-root": {
      width: "100%",
    },
  }));
};
const StyledProfileTextInput = styledField(ProfileTextInput);

const StyledProfileMarkdownInput = styledField(ProfileMarkdownInput);

export default function EditProfileForm() {
  const { t } = useTranslation([GLOBAL, AUTH, PROFILE]);
  const router = useRouter();
  const isNativeEmbed = useIsNativeEmbed();
  const {
    updateUserProfile,
    reset: resetUpdate,
    isPending: updateIsLoading,
    isError: updateError,
    error: updateMutationError,
  } = useUpdateUserProfile();
  const { data: user } = useCurrentUser();
  const isMounted = useIsMounted();
  const [errorMessage, setErrorMessage] = useSafeState<string | null>(isMounted, null);
  const [showIncompleteProfileDialog, setShowIncompleteProfileDialog] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const galleryEditorRef = useRef<HTMLDivElement>(null);
  const { regions } = useRegions();
  const { languages } = useLanguages();

  const initialFormValues =
    user && languages && regions
      ? {
          name: user.name,
          pronouns: user.pronouns,
          hometown: user.hometown,
          occupation: user.occupation,
          education: user.education,
          hostingStatus: user.hostingStatus,
          meetupStatus: user.meetupStatus,
          fluentLanguages: user.languageAbilitiesList.map((ability) => ability.code).filter(Boolean),
          regionsVisited: user.regionsVisitedList,
          regionsLived: user.regionsLivedList,
          aboutMe: user.aboutMe,
          thingsILike: user.thingsILike,
          additionalInformation: user.additionalInformation,
          location: {
            city: user.city,
            lat: user.lat,
            lng: user.lng,
            radius: user.radius,
          },
        }
      : undefined;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitted },
    watch,
    getValues,
  } = useForm<EditProfileFormValues>({
    shouldFocusError: true,
    mode: "onBlur",
    values: initialFormValues,
    resetOptions: { keepDirty: true },
  });

  // Scroll to gallery editor if hash is #gallery (from ProfilePage avatar click)
  useEffect(() => {
    if (router.asPath.includes("#gallery") && galleryEditorRef.current) {
      // Longer delay for mobile WebViews to ensure page is fully rendered
      const timer = setTimeout(() => {
        if (galleryEditorRef.current) {
          // Try scrollIntoView first
          galleryEditorRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Fallback: Also try window.scrollTo as backup for WebViews
          setTimeout(() => {
            if (galleryEditorRef.current) {
              const rect = galleryEditorRef.current.getBoundingClientRect();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const targetPosition = rect.top + scrollTop - 100;
              window.scrollTo({
                top: targetPosition,
                behavior: "smooth",
              });
            }
          }, 50);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [router.asPath]);

  const aboutMeField = watch("aboutMe") ?? "";

  useUnsavedChangesWarning({
    isDirty: isDirty,
    isSubmitted: isSubmitted,
    warningMessage: t("profile:unsaved_changes_warning"),
  });

  const onSubmit = handleSubmit(({ regionsLived, regionsVisited, fluentLanguages, ...data }) => {
    resetUpdate();

    const { location, ...restData } = data;

    updateUserProfile(
      {
        profileData: {
          ...location,
          ...restData,
          regionsVisited,
          regionsLived,
          languageAbilities: {
            valueList: fluentLanguages.map((language) => ({
              code: language,
              fluency: LanguageAbility.Fluency.FLUENCY_FLUENT,
            })),
          },
        },
        setMutationError: setErrorMessage,
        onSuccess: () => {
          // Reset form dirty state to hide save bar
          const currentValues = getValues();
          reset(currentValues, { keepValues: true, keepDirty: false });
          setShowSuccessToast(true);
        },
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
  });

  const handleSubmitButtonClick = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (aboutMeField.length < profileAboutMeMinLength || !user?.avatarUrl) {
      setShowIncompleteProfileDialog(true);
    } else {
      onSubmit();
    }
  };

  const handleAvatarClick = () => {
    galleryEditorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <>
      {updateError && (
        <Alert severity="error">
          {errorMessage || t("global:error.unknown")}
          {isGrpcError(updateMutationError) && updateMutationError.code === StatusCode.FAILED_PRECONDITION && (
            <>
              {" "}
              <StyledLink href={`${settingsRoute}#do-not-email`}>{t("profile:do_not_email_error_link")}</StyledLink>
            </>
          )}
        </Alert>
      )}
      {!user?.avatarUrl && (
        <StyledAlert severity="warning">{t("profile:helper_text.missing_profile_photo")}</StyledAlert>
      )}
      {user && languages && regions ? (
        <>
          <HelpTextContainer>
            <Typography>
              <Trans
                i18nKey="profile:edit_profile_helper_text"
                components={{
                  guideLink: <StyledLink variant="body1" href={howToMakeGreatProfileUrl} />,
                }}
              />
            </Typography>
          </HelpTextContainer>

          <form onSubmit={handleSubmitButtonClick}>
            {/* Basic Information Section */}
            <ProfileSection>
              <SectionTitle>{t("profile:edit_profile_headings.basic_information")}</SectionTitle>
              <SectionSubtitle>{t("profile:edit_profile_headings.basic_information_subtitle")}</SectionSubtitle>

              <AvatarContainer>
                <AvatarImageWrapper>
                  {user.avatarUrl ? (
                    <Avatar user={user} isProfileLink={false} style={{ width: 120, height: 120 }} />
                  ) : (
                    <Tooltip title={t("profile:click_to_add_photo")} arrow placement="top">
                      <ClickableAvatarWrapper onClick={handleAvatarClick}>
                        <Avatar user={user} isProfileLink={false} style={{ width: 120, height: 120 }} />
                      </ClickableAvatarWrapper>
                    </Tooltip>
                  )}
                </AvatarImageWrapper>
                <AvatarTextWrapper>
                  <Typography>
                    <InfoOutlined
                      sx={{
                        color: "primary.main",
                        fontSize: 18,
                        verticalAlign: "text-bottom",
                        mr: 1,
                        display: "inline",
                      }}
                    />
                    {user.avatarUrl ? (
                      <Trans t={t} i18nKey="profile:avatar_photo_info" components={{ bold: <strong /> }} />
                    ) : (
                      <Trans t={t} i18nKey="profile:avatar_placeholder_info" components={{ bold: <strong /> }} />
                    )}
                  </Typography>
                </AvatarTextWrapper>
              </AvatarContainer>

              <FieldGroup ref={galleryEditorRef}>
                <GalleryEditor
                  galleryId={user.profileGalleryId}
                  userId={user.userId}
                  title={t("profile:gallery.profile_photos_title")}
                  description={t("profile:gallery.profile_photos_description")}
                  hasStrongVerification={user.hasStrongVerification}
                />
              </FieldGroup>

              <FieldGroup>
                <StyledProfileTextInput
                  id="name"
                  {...register("name", {
                    required: t("auth:basic_form.name.required_error"),
                    minLength: {
                      value: nameMinLength,
                      message: t("auth:basic_form.name.min_length_error"),
                    },
                    maxLength: {
                      value: nameMaxLength,
                      message: t("auth:basic_form.name.max_length_error"),
                    },
                    pattern: {
                      value: nameValidationPattern,
                      message: t("auth:basic_form.name.invalid_characters_error"),
                    },
                  })}
                  label={t("profile:edit_profile_headings.name")}
                  defaultValue={user.name}
                  error={!!errors?.name?.message}
                  helperText={errors?.name?.message ?? " "}
                />
              </FieldGroup>

              <FieldGroup>
                <StyledProfileTextInput
                  id="pronouns"
                  {...register("pronouns")}
                  label={t("profile:edit_profile_headings.pronouns")}
                  defaultValue={user.pronouns}
                  placeholder={t("profile:edit_profile_pronouns_placeholder")}
                />
              </FieldGroup>

              <FieldGroup>
                <SectionSubtitle>{t("profile:edit_profile_headings.location_subtitle")}</SectionSubtitle>

                <Controller
                  defaultValue={{
                    city: user.city,
                    lat: user.lat,
                    lng: user.lng,
                    radius: user.radius,
                  }}
                  name="location"
                  control={control}
                  render={({ fieldState: { error } }) => (
                    <EditLocationMap
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
            <ProfileSection id="preferences">
              <SectionTitle>{t("profile:edit_profile_headings.preferences")}</SectionTitle>
              <SectionSubtitle>{t("profile:edit_profile_headings.preferences_subtitle")}</SectionSubtitle>

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
                          description: t("profile:hosting_status.can_host_description"),
                          icon: (
                            <CheckCircle
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value === HostingStatus.HOSTING_STATUS_CAN_HOST
                                    ? "var(--mui-palette-primary-main)"
                                    : "var(--mui-palette-grey-100)",
                              }}
                            />
                          ),
                        },
                        {
                          value: HostingStatus.HOSTING_STATUS_MAYBE,
                          title: t("global:hosting_status.maybe"),
                          description: t("profile:hosting_status.maybe_host_description"),
                          icon: (
                            <Help
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value === HostingStatus.HOSTING_STATUS_MAYBE
                                    ? "var(--mui-palette-primary-main)"
                                    : "var(--mui-palette-grey-100)",
                              }}
                            />
                          ),
                        },
                        {
                          value: HostingStatus.HOSTING_STATUS_CANT_HOST,
                          title: t("global:hosting_status.cant_host"),
                          description: t("profile:hosting_status.cannot_host_description"),
                          icon: (
                            <Cancel
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value === HostingStatus.HOSTING_STATUS_CANT_HOST
                                    ? "var(--mui-palette-primary-main)"
                                    : "var(--mui-palette-grey-100)",
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
                          description: t("profile:meetup_status.wants_to_meetup_description"),
                          icon: (
                            <CheckCircle
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value === MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP
                                    ? "var(--mui-palette-primary-main)"
                                    : "var(--mui-palette-grey-100)",
                              }}
                            />
                          ),
                        },
                        {
                          value: MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP,
                          title: t("global:meetup_status.open_to_meetup"),
                          description: t("profile:meetup_status.open_to_meetup_description"),
                          icon: (
                            <Help
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value === MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP
                                    ? "var(--mui-palette-primary-main)"
                                    : "var(--mui-palette-grey-100)",
                              }}
                            />
                          ),
                        },
                        {
                          value: MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP,
                          title: t("global:meetup_status.does_not_want_to_meetup"),
                          description: t("profile:meetup_status.does_not_want_to_meetup_description"),
                          icon: (
                            <Cancel
                              sx={{
                                fontSize: 32,
                                color:
                                  field.value === MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP
                                    ? "var(--mui-palette-primary-main)"
                                    : "var(--mui-palette-grey-100)",
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
              <SectionTitle>{t("profile:edit_profile_headings.personal_information")}</SectionTitle>
              <SectionSubtitle>{t("profile:edit_profile_headings.personal_information_subtitle")}</SectionSubtitle>

              {languages && (
                <FieldGroup>
                  <Controller
                    control={control}
                    defaultValue={user.languageAbilitiesList.map((ability) => ability.code)}
                    name="fluentLanguages"
                    render={({ field }) => (
                      <ProfileTagInput
                        inputFieldProps={field}
                        onChange={(_, value) => field.onChange(value)}
                        value={field.value}
                        options={languages}
                        label={t("profile:edit_profile_headings.languages_spoken")}
                        id="fluentLanguages"
                      />
                    )}
                  />
                </FieldGroup>
              )}

              <FieldGroup>
                <StyledProfileTextInput
                  id="hometown"
                  {...register("hometown")}
                  label={t("profile:edit_profile_headings.hometown")}
                  defaultValue={user.hometown}
                />
              </FieldGroup>

              <FieldGroup>
                <StyledProfileTextInput
                  id="occupation"
                  {...register("occupation")}
                  label={t("profile:edit_profile_headings.occupation")}
                  defaultValue={user.occupation}
                />
              </FieldGroup>

              <FieldGroup>
                <StyledProfileTextInput
                  id="education"
                  {...register("education")}
                  label={t("profile:edit_profile_headings.education")}
                  defaultValue={user.education}
                />
              </FieldGroup>
            </ProfileSection>

            {/* About Me Section */}
            <ProfileSection>
              <SectionTitle>{t("profile:heading.who_section")}</SectionTitle>
              <SectionSubtitle>
                <Trans
                  i18nKey="profile:edit_profile_headings.about_me_subtitle"
                  components={{
                    guideLink: (
                      <StyledLink
                        variant="body1"
                        href="https://help.couchers.org/hc/couchersorg-help-center/articles/1725919197-how-do-i-create-a-great-profile"
                        sx={{ fontWeight: "bold" }}
                        target="_blank"
                      />
                    ),
                  }}
                />
              </SectionSubtitle>

              <FieldGroup>
                <StyledProfileMarkdownInput
                  id="aboutMe"
                  label={t("profile:heading.about_me")}
                  name="aboutMe"
                  placeholder={t("profile:about_me_textbox_placeholder")}
                  defaultValue={user.aboutMe}
                  control={control}
                  warning={aboutMeField.length < profileAboutMeMinLength}
                  helperText={
                    <Trans
                      i18nKey="profile:helper_text.characters_remaining"
                      values={{
                        count: profileAboutMeMinLength - aboutMeField.length,
                      }}
                      components={{ bold: <strong /> }}
                    />
                  }
                  description={
                    <Typography
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        backgroundColor: "var(--mui-palette-grey-50)",
                        padding: 1.5,
                        borderRadius: theme.spacing(1),
                        marginTop: 1,
                        marginBottom: 1,
                        fontSize: "0.875rem",
                      }}
                    >
                      <InfoOutlined sx={{ color: "var(--mui-palette-primary-main)" }} />
                      {t("profile:search_indicator")}
                    </Typography>
                  }
                />
              </FieldGroup>

              <FieldGroup>
                <StyledProfileMarkdownInput
                  id="thingsILike"
                  label={t("profile:heading.hobbies_section")}
                  name="thingsILike"
                  defaultValue={user.thingsILike}
                  placeholder={t("profile:hobbies_textbox_placeholder")}
                  control={control}
                />
              </FieldGroup>

              <FieldGroup>
                <StyledProfileMarkdownInput
                  id="additionalInformation"
                  label={t("profile:heading.additional_information_section")}
                  name="additionalInformation"
                  defaultValue={user.additionalInformation}
                  control={control}
                />
              </FieldGroup>
            </ProfileSection>

            {/* Travel Experience Section */}
            {regions && (
              <ProfileSection>
                <SectionTitle>{t("profile:edit_profile_headings.travel_experience")}</SectionTitle>
                <SectionSubtitle>{t("profile:edit_profile_headings.travel_experience_subtitle")}</SectionSubtitle>

                <FieldGroup>
                  <Controller
                    control={control}
                    defaultValue={user.regionsVisitedList}
                    name="regionsVisited"
                    render={({ field }) => (
                      <ProfileTagInput
                        inputFieldProps={field}
                        onChange={(_, values) => field.onChange(values)}
                        value={field.value}
                        options={regions}
                        label={t("profile:edit_profile_headings.regions_visited")}
                        id="regions-visited"
                      />
                    )}
                  />
                </FieldGroup>

                <FieldGroup>
                  <Controller
                    control={control}
                    defaultValue={user.regionsLivedList}
                    name="regionsLived"
                    render={({ field }) => (
                      <ProfileTagInput
                        inputFieldProps={field}
                        onChange={(_, values) => field.onChange(values)}
                        value={field.value}
                        options={regions}
                        label={t("profile:edit_profile_headings.regions_lived")}
                        id="regions-lived"
                      />
                    )}
                  />
                </FieldGroup>
              </ProfileSection>
            )}

            {showSuccessToast && (
              <Snackbar severity="success" onClose={() => setShowSuccessToast(false)}>
                {t("profile:profile_changes_saved_message")}
              </Snackbar>
            )}

            {/* Bottom spacer to prevent content from being hidden behind sticky bar */}
            <BottomSpacer />
          </form>

          {/* Sticky Save Bar */}
          {user && isDirty && (
            <StickySaveBar $isNativeEmbed={isNativeEmbed}>
              <SaveButton
                type="submit"
                variant="contained"
                color="primary"
                loading={updateIsLoading}
                disabled={!isDirty || updateIsLoading}
                onClick={handleSubmitButtonClick}
              >
                {t("global:save_changes")}
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
                <Typography
                  sx={{
                    marginBottom: "16px",
                  }}
                >
                  {t("profile:incomplete_dialog.description")}
                </Typography>
                {aboutMeField.length < profileAboutMeMinLength && (
                  <ListItem key={1} style={{ display: "list-item" }}>
                    {`• ${t("profile:incomplete_dialog.about_me_message")}`}
                  </ListItem>
                )}
                {!user.avatarUrl && (
                  <ListItem key={2} style={{ display: "list-item" }}>
                    {`• ${t("profile:incomplete_dialog.missing_photo_message")}`}
                  </ListItem>
                )}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowIncompleteProfileDialog(false)}>
                {t("profile:incomplete_dialog.continue_editing")}
              </Button>
              <Button onClick={onSubmit}>{t("profile:incomplete_dialog.save_anyway")}</Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <CenteredSpinner />
      )}
    </>
  );
}
