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
  ABOUT_HOME,
  ACCEPT_CAMPING,
  ACCEPT_DRINKING,
  ACCEPT_KIDS,
  ACCEPT_PETS,
  ACCEPT_SMOKING,
  ADDITIONAL,
  GENERAL,
  HOST_DRINKING,
  HOST_KIDS,
  HOST_PETS,
  HOST_SMOKING,
  HOSTING_PREFERENCES,
  HOUSE_RULES,
  HOUSEMATE_DETAILS,
  HOUSEMATES,
  KID_DETAILS,
  LAST_MINUTE,
  LOCAL_AREA,
  MAX_GUESTS,
  PARKING,
  PARKING_DETAILS,
  PET_DETAILS,
  SAVE,
  SLEEPING_ARRANGEMENT,
  SPACE,
  WHEELCHAIR,
} from "features/constants";
import {
  parkingDetailsLabels,
  sleepingArrangementLabels,
  smokingLocationLabels,
} from "features/profile/constants";
import useUpdateHostingPreferences from "features/profile/hooks/useUpdateHostingPreferences";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import ProfileTextInput from "features/profile/ProfileTextInput";
import useCurrentUser from "features/userQueries/useCurrentUser";
import {
  ParkingDetails,
  SleepingArrangement,
  SmokingLocation,
} from "proto/api_pb";
import { useState } from "react";
import { Controller, useForm, UseFormMethods } from "react-hook-form";
import { HostingPreferenceData } from "service";

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
  const classes = useStyles();

  const {
    updateHostingPreferences,
    reset: resetUpdate,
    isLoading: updateIsLoading,
    isError: updateError,
  } = useUpdateHostingPreferences();
  const { data: user } = useCurrentUser();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { control, errors, register, handleSubmit } =
    useForm<HostingPreferenceData>({
      mode: "onBlur",
      shouldFocusError: true,
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
          <Typography variant="h2">{HOSTING_PREFERENCES}</Typography>
          <div className={classes.checkboxContainer}>
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.lastMinute?.value}
              label={LAST_MINUTE}
              name="lastMinute"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.wheelchairAccessible?.value}
              label={WHEELCHAIR}
              name="wheelchairAccessible"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.campingOk?.value}
              label={ACCEPT_CAMPING}
              name="campingOk"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.acceptsKids?.value}
              label={ACCEPT_KIDS}
              name="acceptsKids"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.acceptsPets?.value}
              label={ACCEPT_PETS}
              name="acceptsPets"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.drinkingAllowed?.value}
              label={ACCEPT_DRINKING}
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
                    label={MAX_GUESTS}
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
                label={ACCEPT_SMOKING}
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
                optionLabelMap={smokingLocationLabels}
              />
            )}
          />
          <ProfileMarkdownInput
            id="aboutPlace"
            label={ABOUT_HOME}
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
                label={SPACE}
                className={classes.field}
                value={value}
                options={[
                  SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN,
                  SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE,
                  SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON,
                  SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_ROOM,
                  SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_SPACE,
                ]}
                optionLabelMap={sleepingArrangementLabels}
              />
            )}
          />
          <div className={classes.checkboxContainer}>
            <div>
              <HostingPreferenceCheckbox
                className={classes.formControl}
                defaultValue={!!user.hasHousemates?.value}
                label={HOUSEMATES}
                name="hasHousemates"
                register={register}
              />
              <ProfileTextInput
                id="housemateDetails"
                label={HOUSEMATE_DETAILS}
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
                label={HOST_KIDS}
                name="hasKids"
                register={register}
              />
              <ProfileTextInput
                id="kidDetails"
                label={KID_DETAILS}
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
                label={HOST_PETS}
                name="hasPets"
                register={register}
              />
              <ProfileTextInput
                id="petDetails"
                label={PET_DETAILS}
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
                label={PARKING}
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
                    label={PARKING_DETAILS}
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
                    optionLabelMap={parkingDetailsLabels}
                  />
                )}
              />
            </div>
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.drinksAtHome?.value}
              label={HOST_DRINKING}
              name="drinksAtHome"
              register={register}
            />
            <HostingPreferenceCheckbox
              className={classes.formControl}
              defaultValue={!!user.smokesAtHome?.value}
              label={HOST_SMOKING}
              name="smokesAtHome"
              register={register}
            />
          </div>
          <Typography variant="h2">{GENERAL}</Typography>
          <ProfileMarkdownInput
            id="area"
            label={LOCAL_AREA}
            name="area"
            defaultValue={user.area?.value ?? ""}
            control={control}
            className={classes.field}
          />
          <ProfileMarkdownInput
            id="sleepingDetails"
            label={SLEEPING_ARRANGEMENT}
            name="sleepingDetails"
            defaultValue={user.sleepingDetails?.value ?? ""}
            control={control}
            className={classes.field}
          />
          <ProfileMarkdownInput
            id="houseRules"
            label={HOUSE_RULES}
            name="houseRules"
            defaultValue={user.houseRules?.value ?? ""}
            control={control}
            className={classes.field}
          />
          <ProfileMarkdownInput
            id="otherHostInfo"
            label={ADDITIONAL}
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
              {SAVE}
            </Button>
          </div>
        </form>
      ) : (
        <CircularProgress />
      )}
    </>
  );
}
