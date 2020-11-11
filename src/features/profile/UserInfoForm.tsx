import { Button, makeStyles, TextField } from "@material-ui/core";
import { Alert, Autocomplete } from "@material-ui/lab";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ProfileFormData, updateUser } from "./index";
import { useAppDispatch, useTypedSelector } from "../../store";

const useStyles = makeStyles({
  buttonContainer: {
    display: "flex",
  },
});

export default function HostingPreferenceForm() {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const user = useTypedSelector((state) => state.auth.user);
  const [showAlert, setShowAlert] = useState(false);
  const { control, register, handleSubmit } = useForm<ProfileFormData>();

  const onSubmit = handleSubmit((data: ProfileFormData) => {
    dispatch(updateUser(data)).then(() => {
      setShowAlert(true);
    });
  });

  return (
    <>
      {showAlert && (
        <Alert severity="success">Successfully updated profile!</Alert>
      )}
      {user && (
        <form onSubmit={onSubmit}>
          <TextField
            label="Name"
            name="name"
            defaultValue={user.name}
            inputRef={register}
            variant="outlined"
            margin="normal"
            fullWidth
          />
          <TextField
            label="City"
            name="city"
            defaultValue={user.city}
            inputRef={register}
            variant="outlined"
            margin="normal"
            fullWidth
          />
          <TextField
            label="Gender"
            name="gender"
            defaultValue={user.gender}
            inputRef={register}
            variant="outlined"
            margin="normal"
            fullWidth
          />
          <TextField
            label="Occupation"
            name="occupation"
            defaultValue={user.occupation}
            inputRef={register}
            variant="outlined"
            margin="normal"
            fullWidth
          />
          <Controller
            control={control}
            defaultValue={user.languagesList}
            name="languages"
            render={({ onChange }) => (
              <Autocomplete
                defaultValue={user.languagesList}
                disableClearable={false}
                freeSolo
                multiple
                onChange={(_, value) => onChange(value)}
                open={false}
                options={[""]}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    helperText="Press 'Enter' to add"
                    label="Languages"
                    margin="normal"
                    variant="outlined"
                  />
                )}
              />
            )}
          />
          <TextField
            label="About me"
            name="aboutMe"
            defaultValue={user.aboutMe}
            inputRef={register}
            variant="outlined"
            margin="normal"
            rowsMax={5}
            multiline
            fullWidth
          />
          <TextField
            label="About my place"
            name="aboutPlace"
            defaultValue={user.aboutPlace}
            inputRef={register}
            variant="outlined"
            margin="normal"
            rowsMax={5}
            multiline
            fullWidth
          />
          <Controller
            control={control}
            defaultValue={user.countriesVisitedList}
            name="countriesVisited"
            render={({ onChange }) => (
              <Autocomplete
                defaultValue={user.countriesVisitedList}
                disableClearable={false}
                freeSolo
                multiple
                onChange={(_, value) => onChange(value)}
                open={false}
                options={[""]}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    helperText="Press 'Enter' to add"
                    label="Countries I visited"
                    margin="normal"
                    variant="outlined"
                  />
                )}
              />
            )}
          />
          <Controller
            control={control}
            defaultValue={user.countriesLivedList}
            name="countriesLived"
            render={({ onChange }) => (
              <Autocomplete
                defaultValue={user.countriesLivedList}
                disableClearable={false}
                freeSolo
                multiple
                onChange={(_, value) => onChange(value)}
                open={false}
                options={[""]}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    helperText="Press 'Enter' to add"
                    label="Countries I lived in"
                    margin="normal"
                    variant="outlined"
                  />
                )}
              />
            )}
          />
          <div className={styles.buttonContainer}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={onSubmit}
            >
              Save
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
