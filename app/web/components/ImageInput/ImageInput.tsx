import { Edit } from "@mui/icons-material";
import { styled, Tooltip } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import MuiIconButton from "@mui/material/IconButton";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  COULDNT_READ_FILE,
  getAvatarLabel,
  SELECT_AN_IMAGE,
} from "components/constants";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import Sentry from "platform/sentry";
import React, { useRef, useState } from "react";
import { Control, useController } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import { ImageInputValues } from "service/api";

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
  backgroundColor: theme.palette.background.paper,
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

const StyledCircularProgress = styled(CircularProgress)(({ theme }) => ({
  position: "absolute",
}));

const StyledInput = styled("input")(({ theme }) => ({
  display: "none",
}));

export function ImageInput(props: AvatarInputProps | RectImgInputProps) {
  const { className, control, id, initialPreviewSrc, name } = props;

  const { t } = useTranslation([PROFILE]);

  const [imageUrl, setImageUrl] = useState(initialPreviewSrc);
  const [readerError, setReaderError] = useState("");

  const mutation = useMutation<ImageInputValues, Error, File>(
    (file) => service.api.uploadFile(file),
    {
      onMutate: () => {
        props.onUploading?.(true); //notify form upload has started
      },
      onSuccess: async (data: ImageInputValues) => {
        field.onChange(data.key);
        setImageUrl(
          props.type === "avatar" ? data.thumbnail_url : data.full_url,
        );
        await props.onSuccess?.(data);
        props.onUploading?.(false); //notify form upload has finished
      },
      onError: () => {
        props.onUploading?.(false); //notify form upload has failed
      },
    },
  );

  const { field } = useController({
    name,
    control,
    defaultValue: "",
    rules: {
      validate: () => !mutation.isLoading,
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
      setReaderError(COULDNT_READ_FILE);
    }
  };

  //without this, onChange is not fired when the same file is selected after cancelling
  const inputRef = useRef<HTMLInputElement>(null);
  const handleClick = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <StyledWrapper>
      {mutation.isError && (
        <Alert severity="error">{mutation.error?.message || ""}</Alert>
      )}
      {readerError && <Alert severity="error">{readerError}</Alert>}
      <FlexWrapper>
        <StyledInput
          aria-label={SELECT_AN_IMAGE}
          accept="image/jpeg,image/png,image/gif"
          id={id}
          type="file"
          onChange={handleChange}
          onClick={handleClick}
          ref={inputRef}
        />
        <StyledLabel htmlFor={id} ref={field.ref}>
          {props.type === "avatar" ? (
            <Tooltip title={t("profile:click_replace_image")} placement="top">
              <MuiIconButton component="span" sx={{ position: "relative" }}>
                <Avatar
                  className={className}
                  src={imageUrl}
                  alt={getAvatarLabel(props.userName ?? "")}
                  sx={{ "& img": { objectFit: "cover" } }}
                >
                  {props.userName?.split(/\s+/).map((name) => name[0])}
                </Avatar>

                <EditIconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault(); // prevent triggering label click again
                    inputRef.current?.click();
                  }}
                >
                  <Edit fontSize="small" />
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
          {mutation.isLoading && <StyledCircularProgress />}
        </StyledLabel>
      </FlexWrapper>
    </StyledWrapper>
  );
}

export default ImageInput;
