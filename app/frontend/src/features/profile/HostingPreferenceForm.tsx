import {
  Checkbox,
  FormControl,
  FormControlLabel,
  makeStyles,
} from "@material-ui/core";
import { unwrapResult } from "@reduxjs/toolkit";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { updateHostingPreference } from "./index";
import Alert from "../../components/Alert";
import Autocomplete from "../../components/Autocomplete";
import Button from "../../components/Button";
import ProfileTextInput from "./ProfileTextInput";
import { ProfileFormData } from "../../service/user";
import { useAppDispatch, useTypedSelector } from "../../store";
import { theme } from "../../theme";
import { numberValidationPattern } from "../../utils/validation";
import { SmokingLocation } from "../../pb/api_pb";
import { smokingLocationLabels } from "../../constants";

const useStyles = makeStyles({
  alert: {
    marginBottom: theme.spacing(3),
  },
  form: {
    "& h2": {
      margin: 0,
    },
    marginBottom: theme.spacing(2),
  },
  formControl: {
    display: "block",
  },
  preferenceSection: {
    paddingTop: theme.spacing(3),
  },
});

export default function HostingPreferenceForm() {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const user = useTypedSelector((state) => state.auth.user);
  const [alertState, setShowAlertState] = useState<
    "success" | "error" | undefined
  >();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { control, register, handleSubmit } = useForm<ProfileFormData>();

  const onSubmit = handleSubmit(async (data) => {
    try {
      unwrapResult(await dispatch(updateHostingPreference(data)));
      setShowAlertState("success");
    } catch (error) {
      setShowAlertState("error");
      setErrorMessage(error.message);
    }
  });

  return (
    <>
      {alertState === "success" ? (
        <Alert className={classes.alert} severity={alertState}>
          Successfully updated hosting preference!
        </Alert>
      ) : alertState === "error" ? (
        <Alert className={classes.alert} severity={alertState}>
          {errorMessage}
        </Alert>
      ) : null}
      {user && (
        <form className={classes.form} onSubmit={onSubmit}>
          <Controller
            control={control}
            defaultValue={user.maxGuests?.value ?? null}
            name="maxGuests"
            render={({ onChange }) => (
              <Autocomplete
                disableClearable={false}
                defaultValue={user.maxGuests?.value}
                freeSolo
                getOptionLabel={(option) => option.toString()}
                inputVariant="outlined"
                label="Max. number of guests"
                options={[0, 1, 2, 3, 4, 5]}
                onChange={(e, value) => onChange(value)}
                multiple={false}
                forcePopupIcon
              />
            )}
            rules={{ pattern: numberValidationPattern }}
          />
          <ProfileTextInput
            label="Description of your place"
            name="area"
            defaultValue={user.area?.value ?? ""}
            inputRef={register}
            rowsMax={5}
            multiline
          />
          <ProfileTextInput
            label="House rules"
            name="houseRules"
            defaultValue={user.houseRules?.value ?? ""}
            inputRef={register}
            rowsMax={5}
            multiline
          />
          <div className={classes.preferenceSection}>
            <h2>Hosting preferences</h2>
            <FormControl className={classes.formControl}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    defaultChecked={!!user.multipleGroups?.value}
                  />
                }
                label="Multiple groups accepted"
                name="multipleGroups"
                inputRef={register}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    defaultChecked={!!user.acceptsKids?.value}
                  />
                }
                label="Kids OK"
                name="acceptsKids"
                inputRef={register}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    defaultChecked={!!user.acceptsPets?.value}
                  />
                }
                label="Pets OK"
                name="acceptsPets"
                inputRef={register}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    defaultChecked={!!user.lastMinute?.value}
                  />
                }
                label="Last minute requests OK"
                name="lastMinute"
                inputRef={register}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    defaultChecked={!!user.wheelchairAccessible?.value}
                  />
                }
                label="Wheelchair accessible"
                name="wheelchairAccessible"
                inputRef={register}
              />
            </FormControl>
            <Controller
              control={control}
              defaultValue={user.smokingAllowed}
              name="smokingAllowed"
              render={({ onChange }) => (
                <Autocomplete
                  disableClearable
                  defaultValue={user.smokingAllowed}
                  forcePopupIcon
                  freeSolo
                  getOptionLabel={(option) => smokingLocationLabels[option]}
                  inputVariant="outlined"
                  label="Smoking allowed?"
                  margin="normal"
                  options={[
                    SmokingLocation.SMOKING_LOCATION_YES,
                    SmokingLocation.SMOKING_LOCATION_WINDOW,
                    SmokingLocation.SMOKING_LOCATION_OUTSIDE,
                    SmokingLocation.SMOKING_LOCATION_NO,
                  ]}
                  onChange={(e, value) => onChange(value)}
                  multiple={false}
                />
              )}
            />
            <ProfileTextInput
              label="Sleeping arrangements"
              name="sleepingArrangement"
              defaultValue={user.sleepingArrangement?.value ?? ""}
              inputRef={register}
              rowsMax={5}
              multiline
            />
          </div>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            onClick={onSubmit}
          >
            Save
          </Button>
        </form>
      )}
    </>
  );
}
