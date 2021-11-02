import Avatar from "@material-ui/core/Avatar";
import MuiIconButton from "@material-ui/core/IconButton";
import makeStyles from "@material-ui/core/styles/makeStyles";
import * as Sentry from "@sentry/nextjs";
import classNames from "classnames";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  CANCEL_UPLOAD,
  CONFIRM_UPLOAD,
  COULDNT_READ_FILE,
  getAvatarLabel,
  NO_VALID_FILE,
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

import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "./constants";
import imagePlaceholder from "./imagePlaceholder.svg";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  inputRoot: {
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
  image: {
    objectFit: "cover",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  imageGrow: {
    maxWidth: "100%",
    height: "auto",
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

interface ImageInputProps {
  className?: string;
  control: Control;
  id: string;
  initialPreviewSrc?: string;
  name: string;
  onSuccess?(data: ImageInputValues): Promise<void>;
}

interface AvatarInputProps extends ImageInputProps {
  type: "avatar";
  userName: string;
}

interface RectImgInputProps extends ImageInputProps {
  type: "rect";
  alt: string;
  grow?: boolean;
  height?: number;
  width?: number;
}

export function ImageInput(props: AvatarInputProps | RectImgInputProps) {
  const { className, control, id, initialPreviewSrc, name } = props;
  const classes = useStyles();
  //this ref handles the case where the user uploads an image, selects another image,
  //but then cancels - it should go to the previous image rather than the original
  const confirmedUpload = useRef<ImageInputValues>();
  const [imageUrl, setImageUrl] = useState(initialPreviewSrc);
  const [file, setFile] = useState<File | null>(null);
  const [readerError, setReaderError] = useState("");
  const mutation = useMutation<ImageInputValues, Error>(
    () =>
      file
        ? service.api.uploadFile(file)
        : Promise.reject(new Error(NO_VALID_FILE)),
    {
      onSuccess: async (data: ImageInputValues) => {
        field.onChange(data.key);
        setImageUrl(data.thumbnail_url);
        confirmedUpload.current = data;
        setFile(null);
        await props.onSuccess?.(data);
      },
    }
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
    } catch (e) {
      Sentry.captureException(
        new Error((e as ProgressEvent<FileReader>).toString()),
        {
          tags: {
            component: "component/ImageInput",
          },
        }
      );
      setReaderError(COULDNT_READ_FILE);
    }
  };

  //without this, onChange is not fired when the same file is selected after cancelling
  const inputRef = useRef<HTMLInputElement>(null);
  const handleClick = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCancel = () => {
    field.onChange(confirmedUpload.current?.key ?? "");
    setImageUrl(confirmedUpload.current?.thumbnail_url ?? initialPreviewSrc);
    setFile(null);
  };

  return (
    <div className={classes.root}>
      {mutation.isError && (
        <Alert severity="error">{mutation.error?.message || ""}</Alert>
      )}
      {readerError && <Alert severity="error">{readerError}</Alert>}
      <div className={classes.inputRoot}>
        <input
          aria-label={SELECT_AN_IMAGE}
          className={classes.input}
          accept="image/jpeg,image/png,image/gif"
          id={id}
          type="file"
          onChange={handleChange}
          onClick={handleClick}
          ref={inputRef}
        />
        <label className={classes.label} htmlFor={id} ref={field.ref}>
          {props.type === "avatar" ? (
            <MuiIconButton component="span">
              <Avatar
                className={classNames(classes.avatar, className)}
                src={imageUrl}
                alt={getAvatarLabel(props.userName ?? "")}
              >
                {props.userName?.split(/\s+/).map((name) => name[0])}
              </Avatar>
            </MuiIconButton>
          ) : (
            <img
              className={classNames(classes.image, className, {
                [classes.imageGrow]: props.grow,
              })}
              src={imageUrl ?? imagePlaceholder}
              style={{ objectFit: !imageUrl ? "contain" : undefined }}
              alt={props.alt}
              width={props.width ?? DEFAULT_WIDTH}
              height={props.height ?? DEFAULT_HEIGHT}
            />
          )}
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
              onClick={() => mutation.mutate()}
              size="small"
            >
              <CheckIcon />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageInput;
