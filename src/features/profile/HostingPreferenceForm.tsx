import { Button, makeStyles, TextField } from "@material-ui/core";
import { Alert, Autocomplete } from "@material-ui/lab";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ProfileFormData, updateUser } from "./index";
import { User } from "../../pb/api_pb";
import { useAppDispatch, useTypedSelector } from "../../store";

const useStyles = makeStyles({
  buttonContainer: {
    display: "flex",
  },
});

type UserFields = keyof User.AsObject;
type FormFieldName = keyof ProfileFormData;

interface FormFieldConfig {
  label: string;
  name: FormFieldName;
  type: "text" | "textarea" | "autocomplete";
}

const formFields: FormFieldConfig[] = [
  {
    label: "Name",
    name: "name",
    type: "text",
  },
  {
    label: "City",
    name: "city",
    type: "text",
  },
  {
    label: "Gender",
    name: "gender",
    type: "text",
  },
  {
    label: "Occupation",
    name: "occupation",
    type: "text",
  },
  {
    label: "Languages",
    name: "languages",
    type: "autocomplete",
  },
  {
    label: "About me",
    name: "aboutMe",
    type: "textarea",
  },
  {
    label: "About my place",
    name: "aboutPlace",
    type: "textarea",
  },
  {
    label: "Countries I visited",
    name: "countriesVisited",
    type: "autocomplete",
  },
  {
    label: "Countries I lived in",
    name: "countriesLived",
    type: "autocomplete",
  },
];

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
      <form onSubmit={onSubmit}>
        {formFields.map(({ label, name, type }) => {
          const defaultValue =
            user?.[name as UserFields] ??
            user?.[`${name}List` as UserFields] ??
            "";
          switch (type) {
            case "text":
              return (
                <TextField
                  key={name}
                  label={label}
                  name={name}
                  defaultValue={defaultValue}
                  inputRef={register}
                  variant="outlined"
                  margin="normal"
                  fullWidth
                />
              );
            case "textarea":
              return (
                <TextField
                  key={name}
                  label={label}
                  name={name}
                  defaultValue={defaultValue}
                  inputRef={register}
                  variant="outlined"
                  margin="normal"
                  rowsMax={5}
                  multiline
                  fullWidth
                />
              );
            case "autocomplete":
              return (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  render={({ onChange }) => (
                    <Autocomplete
                      defaultValue={defaultValue as string[]}
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
                          label={label}
                          margin="normal"
                          variant="outlined"
                        />
                      )}
                    />
                  )}
                />
              );
            default:
              return null;
          }
        })}
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
    </>
  );
}
