import { Edit } from "@mui/icons-material";
import { styled, Tooltip } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import MuiIconButton from "@mui/material/IconButton";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import Sentry from "platform/sentry";
import React, { useCallback, useRef, useState } from "react";
import { Control, useController } from "react-hook-form";
import { service } from "service";
import { ImageInputValues } from "service/api";
import { IMAGE_TOO_LARGE } from "service/constants";
import { base64ToFile, useNativeImagePicker } from "utils/nativeLink";

import { DEFAULT_HEIGHT, DEFAULT_WIDTH, MAX_FILE_SIZE } from "./constants";

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

interface AvatarInputProps extends ImageInputProps {
  type: "avatar";
  userName: string;
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

const EditIconButton = styled(MuiIconButton)(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  boxShadow: theme.shadows[1],
  "&:hover": {
    backgroundColor: theme.palette.grey[200],
  },
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

function ImageInput(props: AvatarInputProps | RectImgInputProps) {
  const { className, control, id, initialPreviewSrc, name } = props;

  const { t } = useTranslation([GLOBAL, PROFILE]);
  const { isNative, pickImage } = useNativeImagePicker();

  const [imageUrl, setImageUrl] = useState(initialPreviewSrc);
  const [readerError, setReaderError] = useState("");
  const [fileSizeError, setFileSizeError] = useState("");

  const mutation = useMutation<ImageInputValues, Error, File>({
    mutationFn: (file) => service.api.uploadFile(file),
    onMutate: () => {
      props.onUploading?.(true); //notify form upload has started
    },
    onSuccess: async (data: ImageInputValues) => {
      field.onChange(data.key);
      setImageUrl(props.type === "avatar" ? data.thumbnail_url : data.full_url);
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
    setFileSizeError("");
    if (!event.target.files?.length) return;
    const file = event.target.files[0];

    // Check file size before uploading
    if (file.size > MAX_FILE_SIZE) {
      setFileSizeError(IMAGE_TOO_LARGE);
      return;
    }

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
      setReaderError(t("global:couldnt_read_file"));
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
    setFileSizeError("");
    try {
      const result = await pickImage();
      if (result.success) {
        const dataUrl = `data:${result.mimeType};base64,${result.imageBase64}`;
        const extension = result.mimeType.split("/")[1] || "jpg";
        const file = base64ToFile(
          result.imageBase64,
          result.mimeType,
          `image.${extension}`,
        );

        // Check file size before uploading
        if (file.size > MAX_FILE_SIZE) {
          setFileSizeError(IMAGE_TOO_LARGE);
          return;
        }

        setImageUrl(dataUrl);
        mutation.mutate(file);
      }
    } catch (e) {
      Sentry.captureException(e, {
        tags: { component: "ImageInput", native: true },
      });
      setReaderError(t("global:couldnt_read_file"));
    }
  }, [pickImage, mutation, t]);

  return (
    <StyledWrapper>
      {mutation.isError && (
        <Alert severity="error">{mutation.error?.message || ""}</Alert>
      )}
      {readerError && <Alert severity="error">{readerError}</Alert>}
      {fileSizeError && <Alert severity="error">{fileSizeError}</Alert>}
      <FlexWrapper>
        <StyledInput
          aria-label={t("global:select_an_image")}
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
          {props.type === "avatar" ? (
            <Tooltip title={t("global:click_replace_image")} placement="top">
              <MuiIconButton
                component="span"
                sx={{ position: "relative" }}
                onClick={(e) => {
                  e.preventDefault(); // prevent triggering label click again
                  if (isNative) {
                    handleNativeImagePick();
                  } else {
                    inputRef.current?.click();
                  }
                }}
              >
                <Avatar
                  className={className}
                  src={imageUrl}
                  alt={t("profile:names_profile_photo", {
                    name: props.userName ?? "",
                  })}
                  sx={{ "& img": { objectFit: "cover" } }}
                >
                  {props.userName?.split(/\s+/).map((name) => name[0])}
                </Avatar>

                <EditIconButton size="small">
                  <Edit fontSize="small" sx={{ color: "common.white" }} />
                </EditIconButton>
              </MuiIconButton>
            </Tooltip>
          ) : (
            <StyledImage
              className={className}
              src={imageUrl ?? "/img/imagePlaceholder.svg"}
              style={{ objectFit: !imageUrl ? "contain" : undefined }}
              alt={props.alt}
              width={props.width ?? DEFAULT_WIDTH}
              height={props.height ?? DEFAULT_HEIGHT}
              grow={props.grow}
            />
          )}
        </StyledLabel>
      </FlexWrapper>
    </StyledWrapper>
  );
}

export default ImageInput;
