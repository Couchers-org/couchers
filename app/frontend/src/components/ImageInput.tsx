import { CircularProgress } from "@material-ui/core";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Alert from "components/Alert";
import React from "react";
import { useMutation } from "react-query";

import { service } from "../service";

const useStyles = makeStyles(() => ({
  input: {
    display: "none",
  },
  label: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    width: "fit-content",
  },
  loading: {
    position: "absolute",
  },
}));

export interface ImageInputValues {
  file: File;
  filename: string;
  key: string;
  thumbnail_url: string;
  full_url: string;
}

export interface ImageInputProps {
  id?: string;
  name?: string;
  onChange: (values: ImageInputValues) => void;
  children: React.ReactNode;
}

export function ImageInput({ id, name, children, onChange }: ImageInputProps) {
  const classes = useStyles();
  const inputId = `${id}-file-input`;
  const mutation = useMutation<ImageInputValues, Error, File>((file: File) =>
    service.api.uploadFile(file)
  );

  return (
    <>
      <input
        className={classes.input}
        accept="image/*"
        id={inputId}
        name={name}
        type="file"
        onChange={async (event) => {
          if (!event.target.files?.length) return;
          const file = event.target.files[0];
          const response = await mutation.mutateAsync(file);
          onChange(response);
        }}
      />
      {mutation.isError && (
        <Alert severity="error">{mutation.error?.message || ""}</Alert>
      )}
      <label className={classes.label} htmlFor={inputId}>
        {children}
        {mutation.isLoading && <CircularProgress className={classes.loading} />}
      </label>
    </>
  );
}

export default ImageInput;
