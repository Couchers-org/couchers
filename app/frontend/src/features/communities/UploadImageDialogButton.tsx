import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import ImageInput from "components/ImageInput";
import {
  FINISHED,
  IMAGE_DESCRIPTION_PLACEHOLDER,
  IMAGE_UPLOAD_INPUT_ALT,
  UPLOAD_IMAGE,
  UPLOAD_IMAGE_INSTRUCTIONS,
} from "features/communities/constants";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { ImageInputValues } from "service/api";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  code: { fontFamily: "monospace", overflowX: "auto" },
}));

export default function UploadImageDialogButton({
  className,
}: {
  className?: string;
}) {
  const classes = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const { control } = useForm();
  const handleSuccess = async (data: ImageInputValues) => {
    setUrl(data.full_url);
  };
  return (
    <>
      <Button
        className={className}
        variant="outlined"
        onClick={() => setIsOpen(true)}
      >
        {UPLOAD_IMAGE}
      </Button>
      <Dialog
        aria-labelledby="upload-dialog-title"
        open={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <DialogTitle id="upload-dialog-title">{UPLOAD_IMAGE}</DialogTitle>
        <DialogContent>
          <ImageInput
            type="rect"
            id="image-upload-imput"
            alt={IMAGE_UPLOAD_INPUT_ALT}
            control={control}
            name="image"
            onSuccess={handleSuccess}
          />
          {url && (
            <>
              <DialogContentText>{UPLOAD_IMAGE_INSTRUCTIONS}</DialogContentText>
              <DialogContentText
                className={classes.code}
              >{`![${IMAGE_DESCRIPTION_PLACEHOLDER}](${url})`}</DialogContentText>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>{FINISHED}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
