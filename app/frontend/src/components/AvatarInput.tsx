import Avatar from "@material-ui/core/Avatar";
import MuiIconButton from "@material-ui/core/IconButton";
import makeStyles from "@material-ui/core/styles/makeStyles";
import classNames from "classnames";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  CANCEL_UPLOAD,
  CONFIRM_UPLOAD,
  getAvatarLabel,
  INVALID_FILE,
  SELECT_AN_IMAGE,
  UPLOAD_PENDING_ERROR,
} from "components/constants";
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
  className?: string;
  control: Control;
  id: string;
  initialPreviewSrc?: string;
  name: string;
  userName?: string;
}

export function AvatarInput({
  className,
  control,
  id,
  initialPreviewSrc,
  name,
  userName,
}: AvatarInputProps) {
  const classes = useStyles();
  //this ref handles the case where the user uploads an image, selects another image,
  //but then cancels - it should go to the previous image rather than the original
  const confirmedUpload = useRef<ImageInputValues>();
  const [imageUrl, setImageUrl] = useState(initialPreviewSrc);
  const [file, setFile] = useState<File | null>(null);
  const [readerError, setReaderError] = useState("");
  const mutation = useMutation<ImageInputValues, Error>(() =>
    file ? service.api.uploadFile(file) : Promise.reject(INVALID_FILE)
  );
  const isConfirming = !mutation.isLoading && file !== null;
  const { field } = useController({
    name,
    control,
    defaultValue: "",
    rules: {
      validate: () => !isConfirming || UPLOAD_PENDING_ERROR,
    },
  });

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setReaderError("");
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
      setImageUrl(base64);
      setFile(file);
    } catch {
      setReaderError(INVALID_FILE);
    }
  };

  const handleConfirm = async () => {
    const response = await mutation.mutateAsync();
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
      {readerError && <Alert severity="error">{readerError}</Alert>}
      <div className={classes.root}>
        <input
          aria-label={SELECT_AN_IMAGE}
          className={classes.input}
          accept="image/*"
          id={id}
          type="file"
          onChange={handleChange}
        />
        <label className={classes.label} htmlFor={id} ref={field.ref}>
          <MuiIconButton component="span">
            <Avatar
              className={classNames(classes.avatar, className)}
              src={imageUrl}
              alt={getAvatarLabel(userName ?? "")}
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
              aria-label={CANCEL_UPLOAD}
              onClick={handleCancel}
              size="small"
            >
              <CrossIcon />
            </IconButton>
            <IconButton
              aria-label={CONFIRM_UPLOAD}
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
