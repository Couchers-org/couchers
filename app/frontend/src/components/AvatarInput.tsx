import Avatar from "@material-ui/core/Avatar";
import MuiIconButton from "@material-ui/core/IconButton";
import makeStyles from "@material-ui/core/styles/makeStyles";
import classNames from "classnames";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import IconButton from "components/IconButton";
import { CheckIcon, CrossIcon } from "components/Icons";
import React, { useRef, useState } from "react";
import { Control, useController } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import { ImageInputValues } from "service/api";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  avatar: {
    "& img": { objectFit: "cover" },
  },
  confirmationButtonContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    "& > * + *": {
      marginTop: theme.spacing(1),
    },
  },
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

interface AvatarInputProps {
  control: Control;
  id: string;
  className?: string;
  name: string;
  initialPreviewSrc?: string;
  userName?: string;
}

export function AvatarInput({
  control,
  id,
  name,
  initialPreviewSrc,
  userName,
  className,
}: AvatarInputProps) {
  const classes = useStyles();
  //this ref handles the case where the user uploads an image, selects another image,
  //but then cancels - it should go to the previous image rather than the original
  const confirmedUpload = useRef<ImageInputValues>();
  const [imageUrl, setImageUrl] = useState(initialPreviewSrc);
  const [file, setFile] = useState<File | null>(null);
  const mutation = useMutation<ImageInputValues, Error>(() =>
    file ? service.api.uploadFile(file) : Promise.reject("Invalid file.")
  );
  const isConfirming = !mutation.isLoading && file !== null;
  const { field } = useController({
    name,
    control,
    defaultValue: "",
    rules: {
      validate: () =>
        !isConfirming || "Confirm or cancel the profile picture upload.",
    },
  });

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader!.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
    setImageUrl(base64);
    setFile(file);
  };

  const handleConfirm = async () => {
    const response = await mutation.mutateAsync();
    //const randomInt = Math.floor(Math.random() * 100); // force reload onChange
    //setImageUrl(response.thumbnail_url + "?rand=" + randomInt);
    field.onChange(response.key);
    setImageUrl(response.thumbnail_url);
    confirmedUpload.current = response;
    setFile(null);
  };

  const handleCancel = () => {
    field.onChange(confirmedUpload.current?.key ?? "");
    setImageUrl(confirmedUpload.current?.thumbnail_url ?? initialPreviewSrc);
    setFile(null);
  };

  return (
    <>
      {mutation.isError && (
        <Alert severity="error">{mutation.error?.message || ""}</Alert>
      )}
      <div className={classes.root}>
        <input
          className={classes.input}
          accept="image/*"
          id={id}
          type="file"
          onChange={handleChange}
        />
        <label className={classes.label} htmlFor={id} ref={field.ref}>
          <MuiIconButton component="span" aria-label="Select an image">
            <Avatar
              className={classNames(classes.avatar, className)}
              src={imageUrl}
              alt={userName + " avatar"}
            >
              {userName?.split(/\s+/).map((name) => name[0])}
            </Avatar>
          </MuiIconButton>
          {mutation.isLoading && (
            <CircularProgress className={classes.loading} />
          )}
        </label>
        {isConfirming && (
          <div className={classes.confirmationButtonContainer}>
            <IconButton
              aria-label="Cancel upload"
              onClick={handleCancel}
              size="small"
            >
              <CrossIcon />
            </IconButton>
            <IconButton
              aria-label="Confirm upload"
              onClick={handleConfirm}
              size="small"
            >
              <CheckIcon />
            </IconButton>
          </div>
        )}
      </div>
    </>
  );
}

export default AvatarInput;
