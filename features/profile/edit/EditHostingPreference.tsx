import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Typography,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import Select from "components/Select";
import {
  parkingDetailsLabels,
  sleepingArrangementLabels,
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
import { Controller, useForm, UseFormMethods } from "react-hook-form";
import { HostingPreferenceData } from "service";
import { useUnsavedChangesWarning } from "utils/hooks";

import { DEFAULT_ABOUT_HOME_HEADINGS } from "./constants";
import useStyles from "./styles";

interface HostingPreferenceCheckboxProps {
  className: string;
  defaultValue: boolean;
  name: string;
  label: string;
  register: UseFormMethods<HostingPreferenceData>["register"];
}

function HostingPreferenceCheckbox({
  className,
  defaultValue,
  label,
  name,
  register,
}: HostingPreferenceCheckboxProps) {
  return (
    <FormControl className={className} margin="dense">
      <FormControlLabel
        control={<Checkbox color="primary" defaultChecked={defaultValue} />}
        label={label}
        name={name}
        inputRef={register}
      />
    </FormControl>
  );
}

export default function HostingPreferenceForm() {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const classes = useStyles();

  const {
    updateHostingPreferences,
    reset: resetUpdate,
    isLoading: updateIsLoading,
    isError: updateError,
  } = useUpdateHostingPreferences();
  const { data: user } = useCurrentUser();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { control, errors, register, handleSubmit, formState } =
    useForm<HostingPreferenceData>({
      mode: "onBlur",
      shouldFocusError: true,
    });

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
      }
    );
  });

  return (
    <>
      {updateError && (
        <Alert className={classes.alert} severity="error">
          {errorMessage || "Unknown error"}
        </Alert>
      )}
      {user ? (
        <form className={classes.form} onSubmit={onSubmit}>
          <Typography variant="h2">
            {t("profile:home_info_headings.hosting_preferences")}
          </Typography>
          <div className={classes.checkboxContainer}>
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.lastMinute?.value}
              label={t("profile:home_info_headings.last_minute")}
              name="lastMinute"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.wheelchairAccessible?.value}
              label={t("profile:home_info_headings.wheelchair")}
              name="wheelchairAccessible"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.campingOk?.value}
              label={t("profile:edit_home_questions.accept_camping")}
              name="campingOk"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.acceptsKids?.value}
              label={t("profile:edit_home_questions.accept_kids")}
              name="acceptsKids"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.acceptsPets?.value}
              label={t("profile:edit_home_questions.accept_pets")}
              name="acceptsPets"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.drinkingAllowed?.value}
              label={t("profile:edit_home_questions.accept_drinking")}
              name="drinkingAllowed"
              register={register}
            />
          </div>
          <Controller
            control={control}
            defaultValue={user.maxGuests?.value ?? null}
            name="maxGuests"
            render={({ onChange, ref }) => (
              <Autocomplete
                disableClearable={false}
                defaultValue={user.maxGuests?.value}
                forcePopupIcon
                freeSolo
                getOptionLabel={(option) => option.toString()}
                options={[1, 2, 3, 4, 5]}
                onChange={(e, value) => onChange(value)}
                multiple={false}
                renderInput={(params) => (
                  <ProfileTextInput
                    {...params}
                    error={!!errors?.maxGuests?.message}
                    helperText={errors?.maxGuests?.message}
                    label={t("profile:home_info_headings.max_guests")}
                    name="maxGuests"
                    onChange={(e) => onChange(Number(e.target.value))}
                    inputRef={ref}
                    className={classes.field}
                  />
                )}
              />
            )}
            rules={{
              validate: (value) =>
                isNaN(value) ? "Invalid number provided" : true,
            }}
          />
          <Controller
            control={control}
            defaultValue={
              user.smokingAllowed || SmokingLocation.SMOKING_LOCATION_UNKNOWN
            }
            name="smokingAllowed"
            render={({ onChange, value }) => (
              <Select
                onChange={(event) => onChange(event.target.value)}
                label={t("profile:edit_home_questions.accept_smoking")}
                className={classes.field}
                value={value}
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
          <ProfileMarkdownInput
            id="aboutPlace"
            label={t("profile:home_info_headings.about_home")}
            name="aboutPlace"
            defaultValue={user.aboutPlace || DEFAULT_ABOUT_HOME_HEADINGS}
            control={control}
            className={classes.field}
          />
          <Controller
            control={control}
            defaultValue={
              user.sleepingArrangement ||
              SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN
            }
            name="sleepingArrangement"
            render={({ onChange, value }) => (
              <Select
                onChange={(event) => onChange(event.target.value)}
                id="sleepingArrangement"
                label={t("profile:home_info_headings.space")}
                className={classes.field}
                value={value}
                options={[
                  SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN,
                  SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE,
                  SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON,
                  SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_ROOM,
                  SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_SPACE,
                ]}
                optionLabelMap={sleepingArrangementLabels(t)}
              />
            )}
          />
          <div className={classes.checkboxContainer}>
            <div>
              <HostingPreferenceCheckbox
                className={classes.formControl}
                defaultValue={!!user.hasHousemates?.value}
                label={t("profile:home_info_headings.has_housemates")}
                name="hasHousemates"
                register={register}
              />
              <ProfileTextInput
                id="housemateDetails"
                label={t("profile:home_info_headings.housemate_details")}
                name="housemateDetails"
                defaultValue={user.housemateDetails?.value ?? ""}
                inputRef={register}
                maxRows={5}
                multiline
                className={classes.field}
              />
            </div>
            <div>
              <HostingPreferenceCheckbox
                className={classes.formControl}
                defaultValue={!!user.hasKids?.value}
                label={t("profile:home_info_headings.host_kids")}
                name="hasKids"
                register={register}
              />
              <ProfileTextInput
                id="kidDetails"
                label={t("profile:home_info_headings.kid_details")}
                name="kidDetails"
                defaultValue={user.kidDetails?.value ?? ""}
                inputRef={register}
                maxRows={5}
                multiline
                className={classes.field}
              />
            </div>
            <div>
              <HostingPreferenceCheckbox
                className={classes.formControl}
                defaultValue={!!user.hasPets?.value}
                label={t("profile:home_info_headings.host_pets")}
                name="hasPets"
                register={register}
              />
              <ProfileTextInput
                id="petDetails"
                label={t("profile:home_info_headings.pet_details")}
                name="petDetails"
                defaultValue={user.petDetails?.value ?? ""}
                inputRef={register}
                maxRows={5}
                multiline
                className={classes.field}
              />
            </div>
            <div>
              <HostingPreferenceCheckbox
                className={classes.formControl}
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
                render={({ onChange, value }) => (
                  <Select
                    label={t("profile:home_info_headings.parking_details")}
                    onChange={(event) => onChange(event.target.value)}
                    className={classes.field}
                    value={value}
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
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.drinksAtHome?.value}
              label={t("profile:home_info_headings.host_drinking")}
              name="drinksAtHome"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.smokesAtHome?.value}
              label={t("profile:home_info_headings.host_smoking")}
              name="smokesAtHome"
              register={register}
            />
          </div>
          <Typography variant="h2">
            {t("profile:home_info_headings.general")}
          </Typography>
          <ProfileMarkdownInput
            id="area"
            label={t("profile:home_info_headings.local_area")}
            name="area"
            defaultValue={user.area?.value ?? ""}
            control={control}
            className={classes.field}
          />
          <ProfileMarkdownInput
            id="sleepingDetails"
            label={t("profile:home_info_headings.sleeping_arrangement")}
            name="sleepingDetails"
            defaultValue={user.sleepingDetails?.value ?? ""}
            control={control}
            className={classes.field}
          />
          <ProfileMarkdownInput
            id="houseRules"
            label={t("profile:home_info_headings.house_rules")}
            name="houseRules"
            defaultValue={user.houseRules?.value ?? ""}
            control={control}
            className={classes.field}
          />
          <ProfileMarkdownInput
            id="otherHostInfo"
            label={t("profile:home_info_headings.other_info")}
            name="otherHostInfo"
            defaultValue={user.otherHostInfo?.value ?? ""}
            control={control}
            className={classes.field}
          />
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
      ) : (
        <CircularProgress />
      )}
    </>
  );
}
