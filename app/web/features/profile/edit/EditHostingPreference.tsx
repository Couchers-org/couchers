import {
  Autocomplete,
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
import { useState } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { HostingPreferenceData } from "service";
import { theme } from "theme";
import { useUnsavedChangesWarning } from "utils/hooks";

import { DEFAULT_ABOUT_HOME_HEADINGS } from "./constants";

const StyledAlert = styled(Alert)(() => ({
  marginBottom: theme.spacing(3),
}));

const StyledForm = styled("form")(() => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(5),
}));

const StyledCheckboxContainer = styled("div")(() => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, auto))",
  columnGap: theme.spacing(2),
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

const StyledButtonContainer = styled("div")(() => ({
  position: "fixed",
  bottom: 0,
  left: 0,
  width: "100%",
  display: "flex",
  zIndex: 105,
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  justifyContent: "center",
  paddingBottom: theme.spacing(1),
  paddingTop: theme.spacing(1),
}));

interface HostingPreferenceCheckboxProps {
  className?: string;
  defaultValue: boolean;
  name: string;
  label: string;
  register: UseFormReturn<HostingPreferenceData>["register"];
}

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
  const { control, register, handleSubmit, formState } =
    useForm<HostingPreferenceData>({
      mode: "onBlur",
      shouldFocusError: true,
    });

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
        <StyledForm onSubmit={onSubmit}>
          <Typography variant="h2">
            {t("profile:home_info_headings.hosting_preferences")}
          </Typography>
          <StyledCheckboxContainer>
            <StyledHostingPreferenceCheckbox
              defaultValue={!!user.lastMinute?.value}
              label={t("profile:home_info_headings.last_minute")}
              name="lastMinute"
              register={register}
            />
            <StyledHostingPreferenceCheckbox
              defaultValue={!!user.wheelchairAccessible?.value}
              label={t("profile:home_info_headings.wheelchair")}
              name="wheelchairAccessible"
              register={register}
            />
            <StyledHostingPreferenceCheckbox
              defaultValue={!!user.campingOk?.value}
              label={t("profile:edit_home_questions.accept_camping")}
              name="campingOk"
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
          </StyledCheckboxContainer>
          <Controller
            control={control}
            defaultValue={user.maxGuests?.value ?? null}
            name="maxGuests"
            render={({ field }) => (
              <Autocomplete
                {...field}
                disableClearable={false}
                defaultValue={user.maxGuests?.value}
                forcePopupIcon
                freeSolo
                getOptionLabel={(option) => option.toString()}
                options={[1, 2, 3, 4, 5]}
                onChange={(e, value) => field.onChange(value)}
                multiple={false}
                renderInput={(params) => (
                  <StyledProfileTextInput
                    {...params}
                    error={!!errors?.maxGuests?.message}
                    helperText={errors?.maxGuests?.message}
                    label={t("profile:home_info_headings.max_guests")}
                    name="maxGuests"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    inputRef={field.ref}
                  />
                )}
              />
            )}
            rules={{
              validate: (value) =>
                value && isNaN(value) ? "Invalid number provided" : true,
            }}
          />
          <Controller
            control={control}
            defaultValue={
              user.smokingAllowed || SmokingLocation.SMOKING_LOCATION_UNKNOWN
            }
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
          <StyledProfileMarkdownInput
            id="aboutPlace"
            label={t("profile:home_info_headings.about_home")}
            name="aboutPlace"
            defaultValue={user.aboutPlace || DEFAULT_ABOUT_HOME_HEADINGS}
            control={control}
          />
          <Controller
            control={control}
            defaultValue={
              user.sleepingArrangement ||
              SleepingArrangement.SLEEPING_ARRANGEMENT_UNSPECIFIED
            }
            name="sleepingArrangement"
            render={({ field }) => (
              <>
                <StyledSelect
                  onChange={(event) => field.onChange(event.target.value)}
                  id="sleepingArrangement"
                  label={t("profile:home_info_headings.space")}
                  value={field.value}
                  options={[
                    SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE,
                    SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON,
                    SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_ROOM,
                  ]}
                  optionLabelMap={sleepingArrangementLabelsShort(t)}
                />
                <Typography
                  variant="caption"
                  component="div"
                  style={{ whiteSpace: "pre-line", marginTop: 8 }}
                >
                  {`${t("profile:sleeping_arrangement.private")}\n${t("profile:sleeping_arrangement.common")}\n${t("profile:sleeping_arrangement.shared_room")}`}
                </Typography>
              </>
            )}
          />
          <StyledCheckboxContainer>
            <div>
              <StyledHostingPreferenceCheckbox
                defaultValue={!!user.hasHousemates?.value}
                label={t("profile:home_info_headings.has_housemates")}
                name="hasHousemates"
                register={register}
              />
              <StyledProfileTextInput
                id="housemateDetails"
                {...register("housemateDetails")}
                label={t("profile:home_info_headings.housemate_details")}
                name="housemateDetails"
                defaultValue={user.housemateDetails?.value ?? ""}
                maxRows={5}
                multiline
              />
            </div>
            <div>
              <StyledHostingPreferenceCheckbox
                defaultValue={!!user.hasKids?.value}
                label={t("profile:home_info_headings.host_kids")}
                name="hasKids"
                register={register}
              />
              <StyledProfileTextInput
                id="kidDetails"
                {...register("kidDetails")}
                label={t("profile:home_info_headings.kid_details")}
                name="kidDetails"
                defaultValue={user.kidDetails?.value ?? ""}
                maxRows={5}
                multiline
              />
            </div>
            <div>
              <StyledHostingPreferenceCheckbox
                defaultValue={!!user.hasPets?.value}
                label={t("profile:home_info_headings.host_pets")}
                name="hasPets"
                register={register}
              />
              <StyledProfileTextInput
                id="petDetails"
                {...register("petDetails")}
                label={t("profile:home_info_headings.pet_details")}
                name="petDetails"
                defaultValue={user.petDetails?.value ?? ""}
                maxRows={5}
                multiline
              />
            </div>
            <div>
              <StyledHostingPreferenceCheckbox
                defaultValue={!!user.parking?.value}
                label={t("profile:home_info_headings.parking")}
                name="parking"
                register={register}
              />
              <Controller
                control={control}
                defaultValue={
                  user.parkingDetails || ParkingDetails.PARKING_DETAILS_UNKNOWN
                }
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
            </div>
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
          </StyledCheckboxContainer>
          <Typography variant="h2">
            {t("profile:home_info_headings.general")}
          </Typography>
          <StyledProfileMarkdownInput
            id="area"
            label={t("profile:home_info_headings.local_area")}
            name="area"
            defaultValue={user.area?.value ?? ""}
            control={control}
          />
          <StyledProfileMarkdownInput
            id="sleepingDetails"
            label={t("profile:home_info_headings.sleeping_arrangement")}
            name="sleepingDetails"
            defaultValue={user.sleepingDetails?.value ?? ""}
            control={control}
          />
          <StyledProfileMarkdownInput
            id="houseRules"
            label={t("profile:home_info_headings.house_rules")}
            name="houseRules"
            defaultValue={user.houseRules?.value ?? ""}
            control={control}
          />
          <StyledProfileMarkdownInput
            id="otherHostInfo"
            label={t("profile:home_info_headings.other_info")}
            name="otherHostInfo"
            defaultValue={user.otherHostInfo?.value ?? ""}
            control={control}
          />
          <StyledButtonContainer>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              loading={updateIsLoading}
              onClick={onSubmit}
            >
              {t("global:save")}
            </Button>
          </StyledButtonContainer>
        </StyledForm>
      ) : (
        <CenteredSpinner />
      )}
    </>
  );
}
