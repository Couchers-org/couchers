import { styled } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import Sentry from "platform/sentry";
import React, { useCallback, useRef, useState } from "react";
import { Control, useController } from "react-hook-form";
import { service } from "service";
import { ImageInputValues } from "service/api";
import { base64ToFile, useNativeImagePicker } from "utils/nativeLink";

import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "./constants";

interface ImageInputProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  id: string;
  initialPreviewSrc?: string;
  name: string;
  onSuccess?(data: ImageInputValues): Promise<void>;
  onUploading?: (isUploading: boolean) => void; //new prop
}

interface RectImgInputProps extends ImageInputProps {
  type: "rect";
  alt: string;
  grow?: boolean;
  height?: string;
  width?: string;
}

const StyledWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

const FlexWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  width: "100%",
}));

const StyledImage = styled("img", {
  shouldForwardProp: (prop) => prop !== "grow",
})<{ grow: boolean | undefined }>(({ theme, grow }) => ({
  height: 100,
  [theme.breakpoints.up("md")]: {
    height: 200,
  },
  width: "100%",
  objectFit: "cover",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  ...(grow && { maxWidth: "100%", height: "auto" }),
}));

const StyledLabel = styled("label")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  justifyContent: "center",
  width: "100%",
}));

const StyledInput = styled("input")(({ theme }) => ({
  display: "none",
}));

function ImageInput(props: RectImgInputProps) {
  const { className, control, id, initialPreviewSrc, name } = props;

  const { t } = useTranslation([PROFILE]);
  const { isNative, pickImage } = useNativeImagePicker();

  const [imageUrl, setImageUrl] = useState(initialPreviewSrc);
  const [readerError, setReaderError] = useState("");

  const mutation = useMutation<ImageInputValues, Error, File>({
    mutationFn: (file) => service.api.uploadFile(file),
    onMutate: () => {
      props.onUploading?.(true); //notify form upload has started
    },
    onSuccess: async (data: ImageInputValues) => {
      field.onChange(data.key);
      setImageUrl(data.full_url);
      await props.onSuccess?.(data);
      props.onUploading?.(false); //notify form upload has finished
    },
    onError: () => {
      props.onUploading?.(false); //notify form upload has failed
    },
  });

  const { field } = useController({
    name,
    control,
    defaultValue: "",
    rules: {
      validate: () => !mutation.isPending,
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
      mutation.mutate(file);
    } catch (e) {
      Sentry.captureException(
        new Error((e as ProgressEvent<FileReader>).toString()),
        {
          tags: {
            component: "component/ImageInput",
          },
        },
      );
      setReaderError(t("profile:couldnt_read_file"));
    }
  };

  //without this, onChange is not fired when the same file is selected after cancelling
  const inputRef = useRef<HTMLInputElement>(null);
  const handleClick = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  // Native app WebView file input is unreliable on iOS - use native image picker instead
  const handleNativeImagePick = useCallback(async () => {
    setReaderError("");
    try {
      const result = await pickImage();
      if (result.success) {
        const dataUrl = `data:${result.mimeType};base64,${result.imageBase64}`;
        setImageUrl(dataUrl);
        const extension = result.mimeType.split("/")[1] || "jpg";
        const file = base64ToFile(
          result.imageBase64,
          result.mimeType,
          `image.${extension}`,
        );
        mutation.mutate(file);
      }
    } catch (e) {
      Sentry.captureException(e, {
        tags: { component: "ImageInput", native: true },
      });
      setReaderError(t("profile:couldnt_read_file"));
    }
  }, [pickImage, mutation, t]);

  return (
    <StyledWrapper>
      {mutation.isError && (
        <Alert severity="error">{mutation.error?.message || ""}</Alert>
      )}
      {readerError && <Alert severity="error">{readerError}</Alert>}
      <FlexWrapper>
        <StyledInput
          aria-label={t("profile:select_an_image")}
          accept="image/jpeg,image/png,image/gif"
          id={id}
          type="file"
          onChange={handleChange}
          onClick={handleClick}
          ref={inputRef}
        />
        <StyledLabel
          htmlFor={id}
          ref={field.ref}
          onClick={
            isNative
              ? (e) => {
                  e.preventDefault();
                  handleNativeImagePick();
                }
              : undefined
          }
        >
          <StyledImage
            className={className}
            src={imageUrl ?? "/img/imagePlaceholder.svg"}
            style={{ objectFit: !imageUrl ? "contain" : undefined }}
            alt={props.alt}
            width={props.width ?? DEFAULT_WIDTH}
            height={props.height ?? DEFAULT_HEIGHT}
            grow={props.grow}
          />
        </StyledLabel>
      </FlexWrapper>
    </StyledWrapper>
  );
}

export default ImageInput;
