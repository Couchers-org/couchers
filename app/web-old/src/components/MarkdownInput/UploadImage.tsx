import { Emitter } from "@toast-ui/editor";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import ImageInput from "components/ImageInput";
import TextField from "components/TextField";
import { CANCEL } from "features/constants";
import React, { useRef } from "react";
import { useForm } from "react-hook-form";
import { ImageInputValues } from "service/api";

import {
  IMAGE_DESCRIPTION,
  IMAGE_UPLOAD_INPUT_ALT,
  UPLOAD_IMAGE,
} from "./constants";

interface UploadImageProps {
  emitter?: Emitter;
  open: boolean;
  onClose: () => void;
}

export default function UploadImage({
  emitter,
  open,
  onClose,
}: UploadImageProps) {
  const alt = useRef("");
  const { control } = useForm();
  const handleSuccess = async (data: ImageInputValues) => {
    emitter?.emit("command", "addImage", {
      imageUrl: data.full_url,
      altText: alt.current,
    });
    onClose();
  };
  return (
    <Dialog aria-labelledby="upload-dialog-title" open={open} onClose={onClose}>
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
        <TextField
          id="alt-textfield"
          label={IMAGE_DESCRIPTION}
          onChange={(e) => (alt.current = e.target.value)}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          {CANCEL}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
