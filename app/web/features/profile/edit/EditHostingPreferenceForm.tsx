import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  styled,
  Typography,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import Select from "components/Select";
import Snackbar from "components/Snackbar";
import {
  parkingDetailsLabels,
  sleepingArrangementLabelsShort,
  smokingLocationLabels,
} from "features/profile/constants";
import useUpdateHostingPreferences from "features/profile/hooks/useUpdateHostingPreferences";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import ProfileTextInput from "features/profile/ProfileTextInput";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import {
  ParkingDetails,
  SleepingArrangement,
  SmokingLocation,
} from "proto/api_pb";
import React, { useEffect, useState } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { HostingPreferenceData } from "service";
import { theme } from "theme";
import { useUnsavedChangesWarning } from "utils/hooks";

import { DEFAULT_ABOUT_HOME_HEADINGS } from "./constants";

interface HostingPreferenceCheckboxProps {
  className?: string;
  name: string;
  label: string;
  register: UseFormReturn<HostingPreferenceData>["register"];
  checked: boolean;
}

const StyledAlert = styled(Alert)(() => ({
  marginBottom: theme.spacing(3),
}));

const StyledHostingPreferenceCheckbox = styled(HostingPreferenceCheckbox)(
  () => ({
    display: "block",
  }),
);

const styledField = <C extends React.ComponentType<React.ComponentProps<C>>>(
  component: C,
) => {
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
const StyledSelect = styledField(Select);
const StyledProfileMarkdownInput = styledField(ProfileMarkdownInput);

const ProfileSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(2),
  backgroundColor: "var(--mui-palette-background-paper)",
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

const CheckboxGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const CheckboxItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

const StickySaveBar = styled(Box)(({ theme }) => ({
  position: "fixed",
  bottom: 0,
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
    bottom: 56,
    padding: theme.spacing(1, 2, 2, 2),
    paddingBottom: `calc(${theme.spacing(2)} + env(safe-area-inset-bottom, 0px))`,
  },
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

  [theme.breakpoints.down("md")]: {
    minWidth: 160,
    fontSize: "0.9rem",
    padding: theme.spacing(1, 3),
  },
}));

const BottomSpacer = styled(Box)(({ theme }) => ({
  height: 80,
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    height: 140,
  },
}));

const SleepingArrangementKey = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: "var(--mui-palette-grey-50)",
  borderRadius: theme.spacing(1),
  border: `1px solid var(--mui-palette-grey-200)`,
}));

const KeyTitle = styled(Typography)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--mui-palette-text-primary)",
  marginBottom: theme.spacing(1),
}));

const KeyItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  marginBottom: theme.spacing(0.5),
  "&:last-child": {
    marginBottom: 0,
  },
}));

const KeyBullet = styled(Box)(({ theme }) => ({
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: "var(--mui-palette-primary-main)",
  marginTop: 6,
  marginRight: theme.spacing(1),
  flexShrink: 0,
}));

const KeyText = styled(Typography)(({ theme }) => ({
  fontSize: "0.875rem",
  color: "var(--mui-palette-text-secondary)",
  lineHeight: 1.4,
}));

function HostingPreferenceCheckbox({
  className,
  label,
  name,
  register,
  checked,
}: HostingPreferenceCheckboxProps) {
  return (
    <FormControl variant="standard" className={className} margin="dense">
      <FormControlLabel
        {...register(name as keyof HostingPreferenceData)}
        control={<Checkbox checked={checked} />}
        label={label}
        name={name}
      />
    </FormControl>
  );
}

export default function HostingPreferenceForm({
  user,
}: {
  user: HostingPreferenceData;
}) {
  const { t } = useTranslation([GLOBAL, PROFILE]);

  const {
    updateHostingPreferences,
    reset: resetUpdate,
    isPending: updateIsLoading,
    isError: updateError,
  } = useUpdateHostingPreferences();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState,
    watch,
    setValue,
    reset,
    getValues,
  } = useForm<HostingPreferenceData>({
    mode: "onBlur",
    shouldFocusError: true,
    defaultValues: user,
  });

  const lastMinute = watch("lastMinute");
  const acceptsKids = watch("acceptsKids");
  const acceptsPets = watch("acceptsPets");
  const drinkingAllowed = watch("drinkingAllowed");
  const hasHousemates = watch("hasHousemates");
  const hasKids = watch("hasKids");
  const hasPets = watch("hasPets");
  const wheelchairAccessible = watch("wheelchairAccessible");
  const campingOk = watch("campingOk");
  const hasParkingAvailable = watch("parking");
  const drinksAtHome = watch("drinksAtHome");
  const smokesAtHome = watch("smokesAtHome");

  useEffect(() => {
    if (!hasHousemates) {
      setValue("housemateDetails", "", { shouldDirty: true });
    }
  }, [hasHousemates, setValue]);

  useEffect(() => {
    if (!hasKids) {
      setValue("kidDetails", "", { shouldDirty: true });
    }
  }, [hasKids, setValue]);

  useEffect(() => {
    if (!hasPets) {
      setValue("petDetails", "", { shouldDirty: true });
    }
  }, [hasPets, setValue]);

  useEffect(() => {
    if (!hasParkingAvailable) {
      setValue("parkingDetails", ParkingDetails.PARKING_DETAILS_UNKNOWN, {
        shouldDirty: true,
      });
    }
  }, [hasParkingAvailable, setValue]);

  const { errors } = formState;
  const isDirty = formState.isDirty;
  const isSubmitted = formState.isSubmitted;

  useUnsavedChangesWarning({
    isDirty,
    isSubmitted,
    warningMessage: t("profile:unsaved_changes_warning"),
  });

  const onSubmit = handleSubmit((data) => {
    resetUpdate();
    updateHostingPreferences(
      {
        preferenceData: {
          ...data,
          aboutPlace: DEFAULT_ABOUT_HOME_HEADINGS.includes(data.aboutPlace)
            ? ""
            : data.aboutPlace,
        },
        setMutationError: setErrorMessage,
      },
      {
        onSuccess: () => {
          // Reset form dirty state to hide save bar
          const currentValues = getValues();
          reset(currentValues, { keepValues: true, keepDirty: false });
          setShowSuccessToast(true);
        },
        // Scroll to top on submission error
        onError: () => {
          window.scroll({ top: 0, behavior: "smooth" });
        },
      },
    );
  });

  return (
    <>
      {updateError && (
        <StyledAlert severity="error">
          {errorMessage || "Unknown error"}
        </StyledAlert>
      )}

      <form id="edit-hosting-form" onSubmit={onSubmit}>
        {/* Hosting Preferences Section */}
        <ProfileSection>
          <SectionTitle>
            {t("profile:home_info_headings.hosting_preferences")}
          </SectionTitle>
          <SectionSubtitle>
            {t("profile:home_info_headings.hosting_preferences_subtitle")}
          </SectionSubtitle>

          <CheckboxGrid>
            <StyledHostingPreferenceCheckbox
              label={t("profile:home_info_headings.last_minute")}
              name="lastMinute"
              register={register}
              checked={!!lastMinute}
            />
            <StyledHostingPreferenceCheckbox
              label={t("profile:edit_home_questions.accept_kids")}
              name="acceptsKids"
              register={register}
              checked={!!acceptsKids}
            />
            <StyledHostingPreferenceCheckbox
              label={t("profile:edit_home_questions.accept_pets")}
              name="acceptsPets"
              register={register}
              checked={!!acceptsPets}
            />
            <StyledHostingPreferenceCheckbox
              label={t("profile:edit_home_questions.accept_drinking")}
              name="drinkingAllowed"
              register={register}
              checked={!!drinkingAllowed}
            />
          </CheckboxGrid>

          <FieldGroup>
            <StyledProfileTextInput
              id="maxGuests"
              {...register("maxGuests", {
                valueAsNumber: true,
                min: { value: 1, message: "Minimum 1 guest" },
                max: { value: 10, message: "Maximum 10 guests" },
              })}
              label={t("profile:home_info_headings.max_guests")}
              type="number"
              slotProps={{ input: { inputProps: { min: 1, max: 10 } } }}
              error={!!errors?.maxGuests?.message}
              helperText={errors?.maxGuests?.message}
            />
          </FieldGroup>

          <FieldGroup>
            <Controller
              control={control}
              name="smokingAllowed"
              render={({ field }) => (
                <StyledSelect
                  {...field}
                  onChange={(event) => field.onChange(event.target.value)}
                  label={t("profile:edit_home_questions.accept_smoking")}
                  value={field.value}
                  id="smokingAllowed"
                  options={[
                    SmokingLocation.SMOKING_LOCATION_UNKNOWN,
                    SmokingLocation.SMOKING_LOCATION_NO,
                    SmokingLocation.SMOKING_LOCATION_OUTSIDE,
                    SmokingLocation.SMOKING_LOCATION_WINDOW,
                    SmokingLocation.SMOKING_LOCATION_YES,
                  ]}
                  optionLabelMap={smokingLocationLabels(t)}
                />
              )}
            />
          </FieldGroup>
        </ProfileSection>

        {/* About Your Home Section */}
        <ProfileSection>
          <SectionTitle>{t("profile:home_info_headings.my_home")}</SectionTitle>
          <SectionSubtitle>
            {t("profile:home_info_headings.about_home_subtitle")}
          </SectionSubtitle>

          <FieldGroup>
            <StyledProfileMarkdownInput
              id="aboutPlace"
              label={t("profile:home_info_headings.about_home")}
              name="aboutPlace"
              control={control}
              defaultValue={user.aboutPlace || DEFAULT_ABOUT_HOME_HEADINGS}
            />
          </FieldGroup>

          <FieldGroup>
            <Controller
              control={control}
              name="sleepingArrangement"
              render={({ field }) => (
                <>
                  <StyledSelect
                    onChange={(event) => field.onChange(event.target.value)}
                    id="sleepingArrangement"
                    label={t("profile:home_info_headings.space")}
                    value={field.value}
                    options={[
                      SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN,
                      SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE,
                      SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON,
                      SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_ROOM,
                    ]}
                    optionLabelMap={sleepingArrangementLabelsShort(t)}
                  />
                  <SleepingArrangementKey>
                    <KeyTitle>{t("profile:what_options_mean")}:</KeyTitle>
                    <KeyItem>
                      <KeyBullet />
                      <KeyText>
                        <strong>
                          {t("profile:sleeping_arrangement.private_short")}
                        </strong>{" "}
                        {`(${t("profile:sleeping_arrangement.private")})`}
                      </KeyText>
                    </KeyItem>
                    <KeyItem>
                      <KeyBullet />
                      <KeyText>
                        <strong>
                          {t("profile:sleeping_arrangement.common_short")}
                        </strong>{" "}
                        {`(${t("profile:sleeping_arrangement.common")})`}
                      </KeyText>
                    </KeyItem>
                    <KeyItem>
                      <KeyBullet />
                      <KeyText>
                        <strong>
                          {t("profile:sleeping_arrangement.shared_room_short")}:
                        </strong>{" "}
                        {`(${t("profile:sleeping_arrangement.shared_room")})`}
                      </KeyText>
                    </KeyItem>
                  </SleepingArrangementKey>
                </>
              )}
            />
          </FieldGroup>
        </ProfileSection>

        {/* Household Details Section */}
        <ProfileSection>
          <SectionTitle>
            {t("profile:home_info_headings.household_details")}
          </SectionTitle>
          <SectionSubtitle>
            {t("profile:home_info_headings.household_details_subtitle")}
          </SectionSubtitle>

          {/* Household Members */}
          <FieldGroup>
            <Typography variant="h3" gutterBottom>
              {t("profile:home_info_headings.household_members")}
            </Typography>
            <CheckboxGrid>
              <CheckboxItem>
                <StyledHostingPreferenceCheckbox
                  label={t("profile:home_info_headings.has_housemates")}
                  name="hasHousemates"
                  register={register}
                  checked={!!hasHousemates}
                />
                {hasHousemates && (
                  <StyledProfileTextInput
                    id="housemateDetails"
                    {...register("housemateDetails")}
                    label={t("profile:home_info_headings.housemate_details")}
                    name="housemateDetails"
                    maxRows={3}
                    multiline
                  />
                )}
              </CheckboxItem>

              <CheckboxItem>
                <StyledHostingPreferenceCheckbox
                  label={t("profile:home_info_headings.has_kids")}
                  name="hasKids"
                  register={register}
                  checked={!!hasKids}
                />
                {hasKids && (
                  <StyledProfileTextInput
                    id="kidDetails"
                    {...register("kidDetails")}
                    label={t("profile:home_info_headings.kid_details")}
                    name="kidDetails"
                    maxRows={3}
                    multiline
                  />
                )}
              </CheckboxItem>

              <CheckboxItem>
                <StyledHostingPreferenceCheckbox
                  label={t("profile:home_info_headings.has_pets")}
                  name="hasPets"
                  register={register}
                  checked={!!hasPets}
                />
                {hasPets && (
                  <StyledProfileTextInput
                    id="petDetails"
                    {...register("petDetails")}
                    label={t("profile:home_info_headings.pet_details")}
                    name="petDetails"
                    maxRows={3}
                    multiline
                  />
                )}
              </CheckboxItem>
            </CheckboxGrid>
          </FieldGroup>

          {/* Home Facilities */}
          <FieldGroup>
            <Typography variant="h3" gutterBottom>
              {t("profile:home_info_headings.home_facilities")}
            </Typography>
            <CheckboxGrid>
              <CheckboxItem>
                <StyledHostingPreferenceCheckbox
                  label={t("profile:home_info_headings.wheelchair")}
                  name="wheelchairAccessible"
                  register={register}
                  checked={!!wheelchairAccessible}
                />
              </CheckboxItem>
              <CheckboxItem>
                <StyledHostingPreferenceCheckbox
                  label={t("profile:edit_home_questions.accept_camping")}
                  name="campingOk"
                  register={register}
                  checked={!!campingOk}
                />
              </CheckboxItem>
              <CheckboxItem>
                <StyledHostingPreferenceCheckbox
                  label={t("profile:home_info_headings.parking")}
                  name="parking"
                  register={register}
                  checked={!!hasParkingAvailable}
                />
                {hasParkingAvailable && (
                  <Controller
                    control={control}
                    name="parkingDetails"
                    render={({ field }) => (
                      <StyledSelect
                        label={t("profile:home_info_headings.parking_details")}
                        onChange={(event) => field.onChange(event.target.value)}
                        value={field.value}
                        id="parkingDetails"
                        options={[
                          ParkingDetails.PARKING_DETAILS_UNKNOWN,
                          ParkingDetails.PARKING_DETAILS_FREE_ONSITE,
                          ParkingDetails.PARKING_DETAILS_FREE_OFFSITE,
                          ParkingDetails.PARKING_DETAILS_PAID_ONSITE,
                          ParkingDetails.PARKING_DETAILS_PAID_OFFSITE,
                        ]}
                        optionLabelMap={parkingDetailsLabels(t)}
                      />
                    )}
                  />
                )}
              </CheckboxItem>
            </CheckboxGrid>
          </FieldGroup>

          {/* Household Habits */}
          <FieldGroup>
            <Typography variant="h3" gutterBottom>
              {t("profile:home_info_headings.household_habits")}
            </Typography>
            <CheckboxGrid>
              <StyledHostingPreferenceCheckbox
                label={t("profile:home_info_headings.host_drinking")}
                name="drinksAtHome"
                register={register}
                checked={!!drinksAtHome}
              />
              <StyledHostingPreferenceCheckbox
                label={t("profile:home_info_headings.host_smoking")}
                name="smokesAtHome"
                register={register}
                checked={!!smokesAtHome}
              />
            </CheckboxGrid>
          </FieldGroup>
        </ProfileSection>

        {/* Additional Information Section */}
        <ProfileSection>
          <SectionTitle>{t("profile:home_info_headings.general")}</SectionTitle>
          <SectionSubtitle>
            {t("profile:home_info_headings.general_subtitle")}
          </SectionSubtitle>

          <FieldGroup>
            <StyledProfileMarkdownInput
              id="area"
              label={t("profile:home_info_headings.local_area")}
              name="area"
              control={control}
              defaultValue={user.area || ""}
            />
          </FieldGroup>

          <FieldGroup>
            <StyledProfileMarkdownInput
              id="sleepingDetails"
              label={t("profile:home_info_headings.sleeping_arrangement")}
              name="sleepingDetails"
              control={control}
              defaultValue={user.sleepingDetails || ""}
            />
          </FieldGroup>

          <FieldGroup>
            <StyledProfileMarkdownInput
              id="houseRules"
              label={t("profile:home_info_headings.house_rules")}
              name="houseRules"
              control={control}
              defaultValue={user.houseRules || ""}
            />
          </FieldGroup>

          <FieldGroup>
            <StyledProfileMarkdownInput
              id="otherHostInfo"
              label={t("profile:home_info_headings.other_info")}
              name="otherHostInfo"
              control={control}
              defaultValue={user.otherHostInfo || ""}
            />
          </FieldGroup>
        </ProfileSection>

        {showSuccessToast && (
          <Snackbar
            severity="success"
            onClose={() => setShowSuccessToast(false)}
          >
            {t("profile:hosting_preferences_success_message")}
          </Snackbar>
        )}

        {/* Bottom spacer to prevent content from being hidden behind sticky bar */}
        <BottomSpacer />

        {formState.isDirty && (
          <StickySaveBar>
            <SaveButton
              type="submit"
              variant="contained"
              color="primary"
              loading={updateIsLoading}
              disabled={!formState.isDirty || updateIsLoading}
              onClick={onSubmit}
            >
              {t("global:save_changes")}
            </SaveButton>
          </StickySaveBar>
        )}
      </form>
    </>
  );
}
