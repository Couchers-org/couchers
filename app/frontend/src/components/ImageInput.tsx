import { CircularProgress } from "@material-ui/core";
import makeStyles from "@material-ui/core/styles/makeStyles";
import React from "react";
import { useMutation } from "react-query";

import { service } from "../service";

const useStyles = makeStyles(() => ({
  root: {
    display: "none",
  },
  label: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  loading: {
    position: "absolute",
  },
}));

export interface ImageInputProps {
  id?: string;
  name?: string;
  onChange: (values: {
    file: File;
    key: string;
    thumbnailUrl: string;
    url: string;
  }) => void;
  children: React.ReactNode;
}

export function ImageInput({ id, name, children, onChange }: ImageInputProps) {
  const classes = useStyles();
  const inputId = id + "-file-input";
  const mutation = useMutation((file: File) => service.api.uploadFile(file));

  return (
    <>
      <input
        className={classes.root}
        accept="image/*"
        id={inputId}
        name={name}
        type="file"
        onChange={async (event) => {
          if (!event.target.files?.length) {
            console.log("No files selected");
            return;
          }
          const file = event.target.files[0];
          const response = await mutation.mutateAsync(file);
          onChange && onChange(response);
        }}
      />
      <label className={classes.label} htmlFor={inputId}>
        {children}
        {mutation.isLoading && <CircularProgress className={classes.loading} />}
      </label>
    </>
  );
}

export default ImageInput;
