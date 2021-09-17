import { Button } from "@material-ui/core";
import MuiIconButton from "@material-ui/core/IconButton";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { PhotoCamera } from "@material-ui/icons";
import classNames from "classnames";
import CircularProgress from "components/CircularProgress";
import {
  CANCEL_UPLOAD,
  CONFIRM_UPLOAD,
  COULDNT_READ_FILE,
  NO_VALID_FILE,
  SELECT_AN_IMAGE,
} from "components/constants";
import { CheckIcon, CrossIcon } from "components/Icons";
import Snackbar from "components/Snackbar";
import PageHeaderImage from "features/communities/PageHeaderImage";
import useImageReader from "features/useImageReader";
import React, { useEffect, useRef, useState } from "react";
import { useMutation } from "react-query";
import { service } from "service";
import { ImageInputValues } from "service/api";

import { CANCEL, UPLOAD } from "./constants";
import imagePlaceholder from "./imagePlaceholder.svg";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    position: "relative",
  },
  inputRoot: {
    display: "flex",
    position: "absolute",
    bottom: theme.spacing(2),
    right: 0,
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
  button: {
    marginRight: theme.spacing(1),
  },
  iconButton: {
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(1),
    background: theme.palette.background.default,
  },
}));

interface ImageInputProps {
  className?: string;
  initialPreviewSrc?: string;
  onSuccess?(data: ImageInputValues): void;
}

export function EditPageHeaderImage({
  className,
  initialPreviewSrc,
  onSuccess,
}: ImageInputProps) {
  const classes = useStyles();
  //this ref handles the case where the user uploads an image, selects another image,
  //but then cancels - it should go to the previous image rather than the original
  const confirmedUpload = useRef<ImageInputValues>();
  const [imageUrl, setImageUrl] = useState(initialPreviewSrc);
  const { base64, file, readerError, resetReader, ...inputHandlers } =
    useImageReader({
      COULDNT_READ_FILE,
    });
  const mutation = useMutation<ImageInputValues, Error>(
    () =>
      file
        ? service.api.uploadFile(file)
        : Promise.reject(new Error(NO_VALID_FILE)),
    {
      onSuccess: (data: ImageInputValues) => {
        setImageUrl(data.full_url);
        confirmedUpload.current = data;
        resetReader();
        onSuccess?.(data);
      },
    }
  );
  const isConfirming = !mutation.isLoading && file !== null;

  useEffect(() => {
    if (base64) {
      setImageUrl(base64);
    }
  }, [base64]);

  const handleCancel = () => {
    resetReader();
    setImageUrl(confirmedUpload.current?.full_url ?? initialPreviewSrc);
  };

  return (
    <div className={classNames(classes.root, className)}>
      {mutation.isError && (
        <Snackbar severity="error">{mutation.error?.message || ""}</Snackbar>
      )}
      {readerError && <Snackbar severity="error">{readerError}</Snackbar>}
      <PageHeaderImage imageUrl={imageUrl ?? imagePlaceholder} />
      <div className={classes.inputRoot}>
        {isConfirming ? (
          <>
            <Button
              className={classes.button}
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<CrossIcon />}
              aria-label={CANCEL_UPLOAD}
              onClick={handleCancel}
            >
              {CANCEL}
            </Button>
            <Button
              className={classes.button}
              variant="contained"
              color="primary"
              size="small"
              startIcon={<CheckIcon />}
              aria-label={CONFIRM_UPLOAD}
              onClick={() => mutation.mutate()}
            >
              {UPLOAD}
            </Button>
          </>
        ) : (
          <>
            <input
              aria-label={SELECT_AN_IMAGE}
              className={classes.input}
              accept="image/jpeg,image/png,image/gif"
              id={"page-header-image"}
              type="file"
              {...inputHandlers}
            />
            <label className={classes.label} htmlFor="page-header-image">
              <MuiIconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                className={classes.iconButton}
              >
                <PhotoCamera />
              </MuiIconButton>
              {mutation.isLoading && (
                <CircularProgress className={classes.loading} />
              )}
            </label>
          </>
        )}
      </div>
    </div>
  );
}

export default EditPageHeaderImage;
