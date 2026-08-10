import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  styled,
  Typography,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { GetMyVolunteerInfoRes } from "proto/account_pb";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { theme } from "theme";

import { useUpdateVolunteerInfo } from "./useUpdateVolunteerInfo";
import {
  EMAIL_PATTERN,
  getFormDefaultValues,
  LINK_TYPES,
  LINKEDIN_USERNAME_PATTERN,
  URL_PATTERN,
  VolunteerFormData,
} from "./utils";

interface VolunteerFormProps {
  volunteerInfo: GetMyVolunteerInfoRes.AsObject;
}
const StyledForm = styled("form")(() => ({
  marginTop: theme.spacing(2),
  "& > * + *": {
    marginBlockStart: theme.spacing(2),
  },
}));

const FormRow = styled("div")(() => ({
  display: "flex",
  gap: theme.spacing(2),
  flexWrap: "wrap",
  alignItems: "flex-start",
}));

export default function VolunteerForm({ volunteerInfo }: VolunteerFormProps) {
  const { t } = useTranslation([AUTH]);
  const { data: currentUser } = useCurrentUser();

  const formValues = useMemo(() => getFormDefaultValues(volunteerInfo), [volunteerInfo]);

  const {
    control,
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VolunteerFormData>({
    defaultValues: getFormDefaultValues(),
    // values prop syncs form with server data automatically
    values: formValues,
    // Keep user's dirty values when server data updates (prevents losing unsaved changes)
    resetOptions: { keepDirtyValues: true },
    mode: "onBlur",
  });

  const watchedLinkType = watch("linkType");
  const watchedOverrideName = watch("overrideName");
  const watchedOverrideLocation = watch("overrideLocation");

  const {
    error: updateError,
    isPending: isUpdateLoading,
    isSuccess: isUpdateSuccess,
    mutate: updateVolunteerInfo,
    reset: resetMutation,
  } = useUpdateVolunteerInfo();

  const onSubmit = handleSubmit((data) => {
    resetMutation();
    updateVolunteerInfo(data);
  });

  const getLinkTextPlaceholder = (linkType: string) => {
    switch (linkType) {
      case "linkedin":
        return t("auth:volunteer_management.form.link_text_linkedin_placeholder");
      case "email":
        return t("auth:volunteer_management.form.link_text_email_placeholder");
      case "website":
        return t("auth:volunteer_management.form.link_text_website_placeholder");
      default:
        return "";
    }
  };

  return (
    <>
      {updateError && <Alert severity="error">{updateError.message}</Alert>}
      {isUpdateSuccess && <Alert severity="success">{t("auth:volunteer_management.update_success")}</Alert>}

      <StyledForm onSubmit={onSubmit}>
        <Typography variant="h3">{t("auth:volunteer_management.form.title")}</Typography>

        <div>
          <Controller
            control={control}
            name="overrideName"
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label={t("auth:volunteer_management.form.override_name_label", {
                  profileName: volunteerInfo.displayName || currentUser?.name || "",
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
                control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label={t("auth:volunteer_management.form.override_location_label", {
                  profileLocation: volunteerInfo.displayLocation || currentUser?.city || "",
                })}
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

        {/* Show on Team Page */}
        <Controller
          control={control}
          name="showOnTeamPage"
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
              label={t("auth:volunteer_management.form.show_on_team_page_label")}
            />
          )}
        />
        <FormRow>
          <Controller
            control={control}
            name="linkType"
            render={({ field }) => (
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel id="link-type-label">{t("auth:volunteer_management.form.link_type_label")}</InputLabel>
                <Select
                  labelId="link-type-label"
                  id="linkType"
                  label={t("auth:volunteer_management.form.link_type_label")}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    setValue("linkText", "");
                    setValue("linkUrl", "");
                  }}
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

          {watchedLinkType !== "couchers" && watchedLinkType !== "website" && (
            <TextField
              id="linkText"
              label={t("auth:volunteer_management.form.link_text_label")}
              {...register("linkText", {
                validate: (value) => {
                  if (!value || value.trim() === "") {
                    return t("auth:volunteer_management.form.link_text_required");
                  }

                  if (watchedLinkType === "email" && !EMAIL_PATTERN.test(value)) {
                    return t("auth:volunteer_management.form.link_text_email_invalid");
                  }

                  if (watchedLinkType === "linkedin" && !LINKEDIN_USERNAME_PATTERN.test(value)) {
                    return t("auth:volunteer_management.form.link_text_linkedin_invalid");
                  }

                  return true;
                },
              })}
              error={!!errors?.linkText}
              placeholder={getLinkTextPlaceholder(watchedLinkType)}
              helperText={
                errors?.linkText?.message || t(`auth:volunteer_management.form.link_text_${watchedLinkType}_helper`)
              }
              sx={{ flex: 1, minWidth: 200 }}
            />
          )}
        </FormRow>

        {watchedLinkType === "website" && (
          <Box sx={{ width: 400 }}>
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
              placeholder={t("auth:volunteer_management.form.link_url_placeholder")}
              helperText={errors?.linkUrl?.message || t("auth:volunteer_management.form.link_url_helper")}
              fullWidth
            />
          </Box>
        )}

        <Button type="submit" loading={isUpdateLoading}>
          {t("auth:volunteer_management.form.save_button")}
        </Button>
      </StyledForm>
    </>
  );
}
