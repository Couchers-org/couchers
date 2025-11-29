import {
  Avatar,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  styled,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { EmailIcon, GlobeIcon, LinkedInIcon, PinIcon } from "components/Icons";
import IconText from "components/IconText";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import { volunteerInfoQueryKey } from "features/queryKeys";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { GetAccountInfoRes, GetMyVolunteerInfoRes } from "proto/account_pb";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { volunteerNotAVolunteerFormUrl } from "routes";
import { service } from "service";
import { theme } from "theme";

const LINK_TYPES = ["couchers", "email", "linkedin", "website"] as const;

function isValidLinkType(value: string): value is (typeof LINK_TYPES)[number] {
  return LINK_TYPES.includes(value as (typeof LINK_TYPES)[number]);
}

// Validation patterns
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/.+/;
const LINKEDIN_PATTERN = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;

const StyledForm = styled("form")(() => ({
  marginTop: theme.spacing(2),
  "& > * + *": {
    marginBlockStart: theme.spacing(2),
  },
}));

const VolunteerCardWrapper = styled("div")(() => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  maxWidth: "400px",
}));

const VolunteerCard = styled(Card)(() => ({
  height: "13rem",
  border: `1px solid ${theme.palette.grey[400]}`,
}));

const VolunteerCardContent = styled(CardContent)(() => ({
  display: "flex",
}));

const DetailDiv = styled("div")(() => ({
  display: "flex",
  flexFlow: "column nowrap",
  gap: theme.spacing(0.5),
  padding: theme.spacing(1, 2),
}));

const StyledAvatar = styled(Avatar)(() => ({
  width: theme.typography.pxToRem(96),
  height: theme.typography.pxToRem(96),
}));

const VolunteerStatus = styled("div")(() => ({
  marginTop: theme.spacing(1),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

const FormRow = styled("div")(() => ({
  display: "flex",
  gap: theme.spacing(2),
  flexWrap: "wrap",
  alignItems: "flex-start",
}));

type VolunteerManagementProps = {
  accountInfo: GetAccountInfoRes.AsObject;
  className?: string;
};

interface VolunteerFormData {
  overrideName: boolean;
  displayName: string;
  overrideLocation: boolean;
  displayLocation: string;
  showOnTeamPage: boolean;
  linkType: (typeof LINK_TYPES)[number];
  linkText: string;
  linkUrl: string;
}

export default function VolunteerManagement({
  className,
  accountInfo,
}: VolunteerManagementProps) {
  const { t } = useTranslation([AUTH]);
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  const {
    data: volunteerInfo,
    error: volunteerInfoError,
    isLoading: isVolunteerInfoLoading,
  } = useQuery<GetMyVolunteerInfoRes.AsObject, RpcError>({
    queryKey: [volunteerInfoQueryKey],
    queryFn: service.account.getMyVolunteerInfo,
    enabled: accountInfo.isVolunteer,
  });

  const {
    control,
    handleSubmit,
    register,
    watch,
    reset,
    formState: { isDirty, errors },
  } = useForm<VolunteerFormData>({
    defaultValues: {
      overrideName: false,
      displayName: "",
      overrideLocation: false,
      displayLocation: "",
      showOnTeamPage: true,
      linkType: "couchers",
      linkText: "",
      linkUrl: "",
    },
  });

  // Reset form when volunteer info loads
  const watchedLinkType = watch("linkType");
  const watchedOverrideName = watch("overrideName");
  const watchedOverrideLocation = watch("overrideLocation");

  const {
    error: updateError,
    isPending: isUpdateLoading,
    isSuccess: isUpdateSuccess,
    mutate: updateVolunteerInfo,
    reset: resetMutation,
  } = useMutation<GetMyVolunteerInfoRes.AsObject, RpcError, VolunteerFormData>({
    mutationFn: async (data) => {
      const result = await service.account.updateVolunteerInfo({
        displayName: data.overrideName ? data.displayName : "",
        displayLocation: data.overrideLocation ? data.displayLocation : "",
        showOnTeamPage: data.showOnTeamPage,
        linkType: data.linkType || undefined,
        linkText: data.linkText || undefined,
        linkUrl:
          data.linkType === "website" ? data.linkUrl || undefined : undefined,
      });
      return result.toObject();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [volunteerInfoQueryKey],
      });
      const linkType =
        data.linkType && isValidLinkType(data.linkType)
          ? data.linkType
          : "couchers";
      reset({
        overrideName: !!data.displayName,
        displayName: data.displayName || "",
        overrideLocation: !!data.displayLocation,
        displayLocation: data.displayLocation || "",
        showOnTeamPage: data.showOnTeamPage,
        linkType,
        linkText: data.linkText || "",
        linkUrl: data.linkUrl || "",
      });
    },
  });

  // Reset form when volunteer info is loaded
  useEffect(() => {
    if (volunteerInfo && !isDirty) {
      const linkType =
        volunteerInfo.linkType && isValidLinkType(volunteerInfo.linkType)
          ? volunteerInfo.linkType
          : "couchers";
      reset({
        overrideName: !!volunteerInfo.displayName,
        displayName: volunteerInfo.displayName || "",
        overrideLocation: !!volunteerInfo.displayLocation,
        displayLocation: volunteerInfo.displayLocation || "",
        showOnTeamPage: volunteerInfo.showOnTeamPage,
        linkType,
        linkText: volunteerInfo.linkText || "",
        linkUrl: volunteerInfo.linkUrl || "",
      });
    }
  }, [volunteerInfo, reset, isDirty]);

  const onSubmit = handleSubmit((data) => {
    resetMutation();
    updateVolunteerInfo(data);
  });

  const getLinkTypeIcon = (linkType: string) => {
    switch (linkType) {
      case "linkedin":
        return LinkedInIcon;
      case "email":
        return EmailIcon;
      default:
        return GlobeIcon;
    }
  };

  const getLinkTextPlaceholder = (linkType: string) => {
    switch (linkType) {
      case "linkedin":
        return t(
          "auth:volunteer_management.form.link_text_linkedin_placeholder",
        );
      case "email":
        return t("auth:volunteer_management.form.link_text_email_placeholder");
      case "website":
        return t(
          "auth:volunteer_management.form.link_text_website_placeholder",
        );
      default:
        return "";
    }
  };

  // Non-volunteer view
  if (!accountInfo.isVolunteer) {
    return (
      <div className={className} id="volunteer-management">
        <Typography variant="h2">
          {t("auth:volunteer_management.title")}
        </Typography>
        <Typography variant="body1" sx={{ marginTop: theme.spacing(1) }}>
          <Trans
            t={t}
            i18nKey="auth:volunteer_management.not_a_volunteer_message"
            components={{
              1: <StyledLink href={volunteerNotAVolunteerFormUrl} />,
            }}
          >
            According to our records you are not a current or past volunteer. If
            this is incorrect, please let us know by filling in{" "}
            <StyledLink href={volunteerNotAVolunteerFormUrl}>
              this form
            </StyledLink>
            .
          </Trans>
        </Typography>
      </div>
    );
  }

  // Volunteer view - loading state
  if (isVolunteerInfoLoading) {
    return (
      <div className={className} id="volunteer-management">
        <Typography variant="h2">
          {t("auth:volunteer_management.title")}
        </Typography>
        <CenteredSpinner />
      </div>
    );
  }

  // Volunteer view - error state
  if (volunteerInfoError) {
    return (
      <div className={className} id="volunteer-management">
        <Typography variant="h2">
          {t("auth:volunteer_management.title")}
        </Typography>
        <Alert severity="error">{volunteerInfoError.message}</Alert>
      </div>
    );
  }

  // Volunteer view - with data
  return (
    <div className={className} id="volunteer-management">
      <Typography variant="h2">
        {t("auth:volunteer_management.title")}
      </Typography>
      <Typography variant="body1" sx={{ marginTop: theme.spacing(1) }}>
        {t("auth:volunteer_management.description")}
      </Typography>

      {/* Current volunteer info card */}
      {volunteerInfo && (
        <VolunteerCardWrapper>
          <VolunteerCard variant="outlined">
            <VolunteerCardContent>
              <StyledAvatar
                alt={volunteerInfo.displayName || currentUser?.name}
                src={currentUser?.avatarUrl}
              />
              <DetailDiv>
                <Typography variant="h3" component="h3">
                  {volunteerInfo.displayName || currentUser?.name}
                </Typography>
                <Typography variant="body1">{volunteerInfo.role}</Typography>
                <div>
                  {(volunteerInfo.displayLocation || currentUser?.city) && (
                    <IconText
                      icon={PinIcon}
                      text={
                        volunteerInfo.displayLocation || currentUser?.city || ""
                      }
                    />
                  )}
                  {volunteerInfo.linkUrl && (
                    <IconText
                      icon={getLinkTypeIcon(volunteerInfo.linkType)}
                      text={
                        <Typography variant="body1">
                          <StyledLink href={volunteerInfo.linkUrl}>
                            {volunteerInfo.linkText}
                          </StyledLink>
                        </Typography>
                      }
                    />
                  )}
                </div>
              </DetailDiv>
            </VolunteerCardContent>
          </VolunteerCard>
          <VolunteerStatus>
            <Typography variant="body2" color="textSecondary">
              {volunteerInfo.stoppedVolunteering
                ? t("auth:volunteer_management.past_volunteer", {
                    startDate: volunteerInfo.startedVolunteering,
                    endDate: volunteerInfo.stoppedVolunteering,
                  })
                : t("auth:volunteer_management.current_volunteer", {
                    startDate: volunteerInfo.startedVolunteering,
                  })}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {volunteerInfo.showOnTeamPage
                ? t(
                    volunteerInfo.stoppedVolunteering
                      ? "auth:volunteer_management.shown_on_team_page_past"
                      : "auth:volunteer_management.shown_on_team_page_current",
                  )
                : t("auth:volunteer_management.not_shown_on_team_page")}
            </Typography>
          </VolunteerStatus>
        </VolunteerCardWrapper>
      )}

      {/* Update form */}
      {updateError && <Alert severity="error">{updateError.message}</Alert>}
      {isUpdateSuccess && (
        <Alert severity="success">
          {t("auth:volunteer_management.update_success")}
        </Alert>
      )}

      <StyledForm onSubmit={onSubmit}>
        <Typography variant="h3">
          {t("auth:volunteer_management.form.title")}
        </Typography>

        <div>
          <Controller
            control={control}
            name="overrideName"
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label={t("auth:volunteer_management.form.override_name_label", {
                  profileName: currentUser?.name || "",
                })}
              />
            )}
          />
          {watchedOverrideName && (
            <TextField
              id="displayName"
              label={t("auth:volunteer_management.form.display_name_label")}
              {...register("displayName")}
              fullWidth
            />
          )}
        </div>

        <div>
          <Controller
            control={control}
            name="overrideLocation"
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label={t(
                  "auth:volunteer_management.form.override_location_label",
                  {
                    profileLocation: currentUser?.city || "",
                  },
                )}
              />
            )}
          />
          {watchedOverrideLocation && (
            <TextField
              id="displayLocation"
              label={t("auth:volunteer_management.form.display_location_label")}
              {...register("displayLocation")}
              fullWidth
            />
          )}
        </div>

        <Controller
          control={control}
          name="showOnTeamPage"
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label={t(
                "auth:volunteer_management.form.show_on_team_page_label",
              )}
            />
          )}
        />

        <FormRow>
          <Controller
            control={control}
            name="linkType"
            render={({ field }) => (
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel id="link-type-label">
                  {t("auth:volunteer_management.form.link_type_label")}
                </InputLabel>
                <Select
                  labelId="link-type-label"
                  id="linkType"
                  label={t("auth:volunteer_management.form.link_type_label")}
                  {...field}
                >
                  {LINK_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {t(`auth:volunteer_management.form.link_type_${type}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          {watchedLinkType !== "couchers" && (
            <TextField
              id="linkText"
              label={t("auth:volunteer_management.form.link_text_label")}
              {...register("linkText", {
                validate: (value) => {
                  if (!value || value.trim() === "") {
                    return t(
                      "auth:volunteer_management.form.link_text_required",
                    );
                  }

                  if (
                    watchedLinkType === "email" &&
                    !EMAIL_PATTERN.test(value)
                  ) {
                    return t(
                      "auth:volunteer_management.form.link_text_email_invalid",
                    );
                  }

                  if (
                    watchedLinkType === "linkedin" &&
                    !LINKEDIN_PATTERN.test(value)
                  ) {
                    return t(
                      "auth:volunteer_management.form.link_text_linkedin_invalid",
                    );
                  }

                  return true;
                },
              })}
              error={!!errors?.linkText}
              placeholder={getLinkTextPlaceholder(watchedLinkType)}
              helperText={
                errors?.linkText?.message ||
                t(
                  `auth:volunteer_management.form.link_text_${watchedLinkType}_helper`,
                )
              }
              sx={{ flex: 1, minWidth: 200 }}
            />
          )}
        </FormRow>

        {watchedLinkType === "website" && (
          <TextField
            id="linkUrl"
            label={t("auth:volunteer_management.form.link_url_label")}
            {...register("linkUrl", {
              validate: (value) => {
                if (watchedLinkType !== "website") return true;

                if (!value || value.trim() === "") {
                  return t("auth:volunteer_management.form.link_url_required");
                }

                if (!URL_PATTERN.test(value)) {
                  return t("auth:volunteer_management.form.link_url_invalid");
                }

                return true;
              },
            })}
            error={!!errors?.linkUrl}
            placeholder={t(
              "auth:volunteer_management.form.link_url_placeholder",
            )}
            helperText={
              errors?.linkUrl?.message ||
              t("auth:volunteer_management.form.link_url_helper")
            }
            fullWidth
          />
        )}

        <Button type="submit" loading={isUpdateLoading}>
          {t("auth:volunteer_management.form.save_button")}
        </Button>
      </StyledForm>
    </div>
  );
}
