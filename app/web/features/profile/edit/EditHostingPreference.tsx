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
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Select from "components/Select";
import {
  parkingDetailsLabels,
  sleepingArrangementLabelsShort,
  smokingLocationLabels,
} from "features/profile/constants";
import useUpdateHostingPreferences from "features/profile/hooks/useUpdateHostingPreferences";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import ProfileTextInput from "features/profile/ProfileTextInput";
import useCurrentUser from "features/userQueries/useCurrentUser";
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
  defaultValue: boolean;
  name: string;
  label: string;
  register: UseFormReturn<HostingPreferenceData>["register"];
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

const SleepingArrangementKey = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.grey[200]}`,
}));

const KeyTitle = styled(Typography)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: 600,
  color: theme.palette.text.primary,
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
  backgroundColor: theme.palette.primary.main,
  marginTop: 6,
  marginRight: theme.spacing(1),
  flexShrink: 0,
}));

const KeyText = styled(Typography)(({ theme }) => ({
  fontSize: "0.875rem",
  color: theme.palette.text.secondary,
  lineHeight: 1.4,
}));

function HostingPreferenceCheckbox({
  className,
  defaultValue,
  label,
  name,
  register,
}: HostingPreferenceCheckboxProps) {
  return (
    <FormControl variant="standard" className={className} margin="dense">
      <FormControlLabel
        {...register(name as keyof HostingPreferenceData)}
        control={<Checkbox defaultChecked={defaultValue} />}
        label={label}
        name={name}
      />
    </FormControl>
  );
}

export default function HostingPreferenceForm() {
  const { t } = useTranslation([GLOBAL, PROFILE]);

  const {
    updateHostingPreferences,
    reset: resetUpdate,
    isLoading: updateIsLoading,
    isError: updateError,
  } = useUpdateHostingPreferences();
  const { data: user } = useCurrentUser();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { control, register, handleSubmit, reset, formState, watch } =
    useForm<HostingPreferenceData>({
      mode: "onBlur",
      shouldFocusError: true,
    });

  const hasHousemates = watch("hasHousemates");
  const hasKids = watch("hasKids");
  const hasPets = watch("hasPets");
  const hasParkingAvailable = watch("parking");

  // Reset form with user data when user is loaded, without marking as dirty
  useEffect(() => {
    if (user) {
      reset(
        {
          lastMinute: !!user.lastMinute?.value,
          wheelchairAccessible: !!user.wheelchairAccessible?.value,
          campingOk: !!user.campingOk?.value,
          acceptsKids: !!user.acceptsKids?.value,
          acceptsPets: !!user.acceptsPets?.value,
          drinkingAllowed: !!user.drinkingAllowed?.value,
          maxGuests: user.maxGuests?.value ?? 1,
          smokingAllowed:
            user.smokingAllowed || SmokingLocation.SMOKING_LOCATION_UNKNOWN,
          aboutPlace: user.aboutPlace || DEFAULT_ABOUT_HOME_HEADINGS,
          sleepingArrangement:
            user.sleepingArrangement ||
            SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN,
          hasHousemates: !!user.hasHousemates?.value,
          housemateDetails: user.housemateDetails?.value ?? "",
          hasKids: !!user.hasKids?.value,
          kidDetails: user.kidDetails?.value ?? "",
          hasPets: !!user.hasPets?.value,
          petDetails: user.petDetails?.value ?? "",
          parking: !!user.parking?.value,
          parkingDetails:
            user.parkingDetails || ParkingDetails.PARKING_DETAILS_UNKNOWN,
          drinksAtHome: !!user.drinksAtHome?.value,
          smokesAtHome: !!user.smokesAtHome?.value,
          area: user.area?.value ?? "",
          sleepingDetails: user.sleepingDetails?.value ?? "",
          houseRules: user.houseRules?.value ?? "",
          otherHostInfo: user.otherHostInfo?.value ?? "",
        },
        { keepDirty: false, keepErrors: false },
      );
    } else {
      // Initialize with safe defaults to prevent controlled/uncontrolled switching
      reset(
        {
          lastMinute: false,
          wheelchairAccessible: false,
          campingOk: false,
          acceptsKids: false,
          acceptsPets: false,
          drinkingAllowed: false,
          maxGuests: 1,
          smokingAllowed: SmokingLocation.SMOKING_LOCATION_UNKNOWN,
          aboutPlace: DEFAULT_ABOUT_HOME_HEADINGS,
          sleepingArrangement: SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN,
          hasHousemates: false,
          housemateDetails: "",
          hasKids: false,
          kidDetails: "",
          hasPets: false,
          petDetails: "",
          parking: false,
          parkingDetails: ParkingDetails.PARKING_DETAILS_UNKNOWN,
          drinksAtHome: false,
          smokesAtHome: false,
          area: "",
          sleepingDetails: "",
          houseRules: "",
          otherHostInfo: "",
        },
        { keepDirty: false, keepErrors: false },
      );
    }
  }, [user, reset]);

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
        // Scoll to top on submission error
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
      {user ? (
        <form onSubmit={onSubmit}>
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
                defaultValue={!!user.lastMinute?.value}
                label={t("profile:home_info_headings.last_minute")}
                name="lastMinute"
                register={register}
              />
              <StyledHostingPreferenceCheckbox
                defaultValue={!!user.acceptsKids?.value}
                label={t("profile:edit_home_questions.accept_kids")}
                name="acceptsKids"
                register={register}
              />
              <StyledHostingPreferenceCheckbox
                defaultValue={!!user.acceptsPets?.value}
                label={t("profile:edit_home_questions.accept_pets")}
                name="acceptsPets"
                register={register}
              />
              <StyledHostingPreferenceCheckbox
                defaultValue={!!user.drinkingAllowed?.value}
                label={t("profile:edit_home_questions.accept_drinking")}
                name="drinkingAllowed"
                register={register}
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
                inputProps={{ min: 1, max: 10 }}
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
            <SectionTitle>
              {t("profile:home_info_headings.my_home")}
            </SectionTitle>
            <SectionSubtitle>
              {t("profile:home_info_headings.about_home_subtitle")}
            </SectionSubtitle>

            <FieldGroup>
              <StyledProfileMarkdownInput
                id="aboutPlace"
                label={t("profile:home_info_headings.about_home")}
                name="aboutPlace"
                control={control}
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
                      <KeyTitle>What these options mean:</KeyTitle>
                      <KeyItem>
                        <KeyBullet />
                        <KeyText>
                          <strong>Private space:</strong>{" "}
                          {t("profile:sleeping_arrangement.private")}
                        </KeyText>
                      </KeyItem>
                      <KeyItem>
                        <KeyBullet />
                        <KeyText>
                          <strong>Common room:</strong>{" "}
                          {t("profile:sleeping_arrangement.common")}
                        </KeyText>
                      </KeyItem>
                      <KeyItem>
                        <KeyBullet />
                        <KeyText>
                          <strong>Shared room:</strong>{" "}
                          {t("profile:sleeping_arrangement.shared_room")}
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
                    defaultValue={!!user.hasHousemates?.value}
                    label={t("profile:home_info_headings.has_housemates")}
                    name="hasHousemates"
                    register={register}
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
                    defaultValue={!!user.hasKids?.value}
                    label={t("profile:home_info_headings.host_kids")}
                    name="hasKids"
                    register={register}
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
                    defaultValue={!!user.hasPets?.value}
                    label={t("profile:home_info_headings.host_pets")}
                    name="hasPets"
                    register={register}
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
                    defaultValue={!!user.wheelchairAccessible?.value}
                    label={t("profile:home_info_headings.wheelchair")}
                    name="wheelchairAccessible"
                    register={register}
                  />
                </CheckboxItem>
                <CheckboxItem>
                  <StyledHostingPreferenceCheckbox
                    defaultValue={!!user.campingOk?.value}
                    label={t("profile:edit_home_questions.accept_camping")}
                    name="campingOk"
                    register={register}
                  />
                </CheckboxItem>
                <CheckboxItem>
                  <StyledHostingPreferenceCheckbox
                    defaultValue={!!user.parking?.value}
                    label={t("profile:home_info_headings.parking")}
                    name="parking"
                    register={register}
                  />
                  {hasParkingAvailable && (
                    <Controller
                      control={control}
                      name="parkingDetails"
                      render={({ field }) => (
                        <StyledSelect
                          label={t(
                            "profile:home_info_headings.parking_details",
                          )}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
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
                  defaultValue={!!user.drinksAtHome?.value}
                  label={t("profile:home_info_headings.host_drinking")}
                  name="drinksAtHome"
                  register={register}
                />
                <StyledHostingPreferenceCheckbox
                  defaultValue={!!user.smokesAtHome?.value}
                  label={t("profile:home_info_headings.host_smoking")}
                  name="smokesAtHome"
                  register={register}
                />
              </CheckboxGrid>
            </FieldGroup>
          </ProfileSection>

          {/* Additional Information Section */}
          <ProfileSection>
            <SectionTitle>
              {t("profile:home_info_headings.general")}
            </SectionTitle>
            <SectionSubtitle>
              {t("profile:home_info_headings.general_subtitle")}
            </SectionSubtitle>

            <FieldGroup>
              <StyledProfileMarkdownInput
                id="area"
                label={t("profile:home_info_headings.local_area")}
                name="area"
                control={control}
              />
            </FieldGroup>

            <FieldGroup>
              <StyledProfileMarkdownInput
                id="sleepingDetails"
                label={t("profile:home_info_headings.sleeping_arrangement")}
                name="sleepingDetails"
                control={control}
              />
            </FieldGroup>

            <FieldGroup>
              <StyledProfileMarkdownInput
                id="houseRules"
                label={t("profile:home_info_headings.house_rules")}
                name="houseRules"
                control={control}
              />
            </FieldGroup>

            <FieldGroup>
              <StyledProfileMarkdownInput
                id="otherHostInfo"
                label={t("profile:home_info_headings.other_info")}
                name="otherHostInfo"
                control={control}
              />
            </FieldGroup>
          </ProfileSection>

          {/* Bottom spacer to prevent content from being hidden behind sticky bar */}
          <BottomSpacer />

          {/* Sticky Save Bar */}
          {user && formState.isDirty && (
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
      ) : (
        <CenteredSpinner />
      )}
    </>
  );
}
