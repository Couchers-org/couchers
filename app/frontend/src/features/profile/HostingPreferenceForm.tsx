import {
  Checkbox,
  FormControl,
  FormControlLabel,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import { SAVE } from "features/constants";
import { smokingLocationLabels } from "features/profile/constants";
import ProfileTextInput from "features/profile/ProfileTextInput";
import useUpdateHostingPreferences from "features/profile/useUpdateHostingPreferences";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { SmokingLocation } from "pb/api_pb";
import React, { useState } from "react";
import { Controller, useForm, UseFormMethods } from "react-hook-form";
import { HostingPreferenceData } from "service/index";

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

const useStyles = makeStyles((theme) => ({
  alert: {
    marginBottom: theme.spacing(3),
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    paddingTop: theme.spacing(1),
  },
  field: {
    [theme.breakpoints.up("md")]: {
      "& > .MuiInputBase-root": {
        width: 400,
      },
    },
    "& > .MuiInputBase-root": {
      width: "100%",
    },
  },
  form: {
    marginBottom: theme.spacing(2),
  },
  formControl: {
    display: "block",
  },
  preferenceSection: {
    paddingTop: theme.spacing(3),
  },
}));

export default function HostingPreferenceForm() {
  const classes = useStyles();
  const {
    updateHostingPreferences,
    status: updateStatus,
    reset: resetUpdate,
  } = useUpdateHostingPreferences();
  const { data: user } = useCurrentUser();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    control,
    errors,
    register,
    handleSubmit,
  } = useForm<HostingPreferenceData>({
    mode: "onBlur",
  });

  const onSubmit = handleSubmit((data) => {
    resetUpdate();
    updateHostingPreferences({
      preferenceData: data,
      setMutationError: setErrorMessage,
    });
  });

  return (
    <>
      {updateStatus === "success" ? (
        <Alert className={classes.alert} severity="success">
          Successfully updated hosting preference!
        </Alert>
      ) : updateStatus === "error" ? (
        <Alert className={classes.alert} severity="error">
          {errorMessage || "Unknown error"}
        </Alert>
      ) : null}
      {user ? (
        <form className={classes.form} onSubmit={onSubmit}>
          <Typography variant="h2">Hosting preferences</Typography>
          <HostingPreferenceCheckbox
            className={classes.formControl}
            defaultValue={!!user.acceptsKids?.value}
            label="Kids OK"
            name="acceptsKids"
            register={register}
          />
          <HostingPreferenceCheckbox
            className={classes.formControl}
            defaultValue={!!user.acceptsPets?.value}
            label="Pets OK"
            name="acceptsPets"
            register={register}
          />
          <HostingPreferenceCheckbox
            className={classes.formControl}
            defaultValue={!!user.lastMinute?.value}
            label="Last minute requests OK"
            name="lastMinute"
            register={register}
          />
          <HostingPreferenceCheckbox
            className={classes.formControl}
            defaultValue={!!user.wheelchairAccessible?.value}
            label="Wheelchair accessible"
            name="wheelchairAccessible"
            register={register}
          />
          <Controller
            control={control}
            defaultValue={user.maxGuests?.value ?? null}
            name="maxGuests"
            render={({ onChange }) => (
              <Autocomplete
                disableClearable={false}
                defaultValue={user.maxGuests?.value}
                forcePopupIcon
                freeSolo
                getOptionLabel={(option) => option.toString()}
                options={[0, 1, 2, 3, 4, 5]}
                onChange={(e, value) => onChange(value)}
                multiple={false}
                renderInput={(params) => (
                  <ProfileTextInput
                    {...params}
                    error={!!errors?.maxGuests?.message}
                    helperText={errors?.maxGuests?.message}
                    label="Max. number of guests"
                    name="maxGuests"
                    onChange={(e) => onChange(Number(e.target.value))}
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
          <ProfileTextInput
            label="Description of your place"
            name="area"
            defaultValue={user.area?.value ?? ""}
            inputRef={register}
            rowsMax={5}
            multiline
            className={classes.field}
          />
          <ProfileTextInput
            label="House rules"
            name="houseRules"
            defaultValue={user.houseRules?.value ?? ""}
            inputRef={register}
            rowsMax={5}
            multiline
            className={classes.field}
          />
          <Controller
            control={control}
            defaultValue={user.smokingAllowed}
            name="smokingAllowed"
            render={({ onChange }) => (
              <Autocomplete
                disableClearable={false}
                defaultValue={user.smokingAllowed}
                forcePopupIcon
                freeSolo={false}
                getOptionLabel={(option) => smokingLocationLabels[option]}
                multiple={false}
                options={[
                  SmokingLocation.SMOKING_LOCATION_YES,
                  SmokingLocation.SMOKING_LOCATION_WINDOW,
                  SmokingLocation.SMOKING_LOCATION_OUTSIDE,
                  SmokingLocation.SMOKING_LOCATION_NO,
                ]}
                onChange={(e, value) =>
                  onChange(value ?? SmokingLocation.SMOKING_LOCATION_UNKNOWN)
                }
                renderInput={(params) => (
                  <ProfileTextInput
                    {...params}
                    label="Smoking allowed?"
                    name="maxGuests"
                    className={classes.field}
                  />
                )}
              />
            )}
          />
          <div className={classes.buttonContainer}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
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
