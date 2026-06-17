import { Checkbox, FormControlLabel, styled, Typography } from "@mui/material";
import { UseMutateFunction } from "@tanstack/react-query";
import Alert from "components/Alert";
import ImageInput from "components/ImageInput";
import LocationAutocomplete from "components/LocationAutocomplete";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import TextField from "components/TextField";
import { Coordinates } from "features/search/utils/constants";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL, PROFILE } from "i18n/namespaces";
import { LngLat } from "maplibre-gl";
import { Event } from "proto/events_pb";
import { useRef } from "react";
import { DeepMap, useForm } from "react-hook-form";
import { theme } from "theme";
import { Dayjs } from "utils/dayjs";
import type { GeocodeResult } from "utils/hooks";

import EventTimeChanger from "./EventTimeChanger";

const StyledWrapper = styled("div")(() => ({
  marginBlockStart: theme.spacing(4),
}));

const StyledImageUploadHelperText = styled(Typography)(() => ({
  textAlign: "center",
}));

const StyledForm = styled("form")(() => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  rowGap: theme.spacing(3),
  marginBlockEnd: theme.spacing(3),
}));

const StyledLocationContainer = styled("div")(() => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(3, 2),
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "1fr 1fr",
  },
  minHeight: theme.typography.pxToRem(66),
}));

const StyledEventDetailsContainer = styled("div")(() => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  rowGap: theme.spacing(1),
}));

interface OfflineEventData {
  content: string;
  title: string;
  startDate: Dayjs;
  endDate: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  isOnline: boolean;
  shouldNotify: boolean;
  eventImage?: string;
  parentCommunityId?: number;
  link?: string;
  location: GeocodeResult;
}

// Creating new online events is deprecated
export type CreateEventData = OfflineEventData;

export type CreateEventVariables = CreateEventData & {
  dirtyFields: DeepMap<CreateEventData, true>;
};

interface EventFormProps {
  children(data: { isMutationLoading: boolean }): React.ReactNode;
  event?: Event.AsObject;
  error: RpcError | null;
  mutate: UseMutateFunction<
    Event.AsObject,
    RpcError,
    CreateEventVariables,
    unknown
  >;
  isMutationLoading: boolean;
  title: string;
  isEdit: boolean;
  // If true, and no event is passed, will default to editing an online event.
  defaultOnline: boolean;
}

export default function EventForm({
  children,
  event,
  error,
  mutate,
  isMutationLoading,
  title,
  isEdit,
  defaultOnline = false,
}: EventFormProps) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES, PROFILE]);

  // Online events are deprecated. They cannot be created anymore,
  // can the type of an existing event be changed between online and offline.
  const isOnline = !!event?.onlineInformation || defaultOnline;

  const {
    control,
    handleSubmit,
    getValues,
    register,
    setValue,
    formState: { dirtyFields, errors },
  } = useForm<CreateEventData>({
    mode: "onBlur",
    defaultValues: {
      isOnline: isOnline,
    },
  });

  const locationDefaultValue = useRef(
    event?.offlineInformation
      ? {
          name: event.offlineInformation.address,
          simplifiedName: event.offlineInformation.address,
          location: new LngLat(
            event.offlineInformation.lng,
            event.offlineInformation.lat,
          ),
          bbox: [0, 0, 0, 0] as Coordinates,
        }
      : ("" as const),
  ).current;

  const onSubmit = handleSubmit(
    (data) => {
      const eventVariables = {
        ...data,
        dirtyFields,
      } as CreateEventVariables;

      mutate(eventVariables);
    },
    (errors) => {
      if (errors.eventImage) {
        window.scroll({ top: 0, behavior: "smooth" });
      }
    },
  );

  return (
    <StyledWrapper>
      <ImageInput
        alt={t("communities:event_image_input_alt")}
        control={control}
        id="event-image-input"
        initialPreviewSrc={event?.photoUrl || undefined}
        name="eventImage"
        type="rect"
        height={"200px"}
        width={"100%"}
      />
      <StyledImageUploadHelperText variant="body1">
        {t("communities:upload_helper_text")}
      </StyledImageUploadHelperText>
      <PageTitle>{title}</PageTitle>
      {(error || errors.eventImage) && (
        <Alert severity="error">
          {error?.message || errors.eventImage?.message || ""}
        </Alert>
      )}
      <StyledForm onSubmit={onSubmit}>
        <TextField
          id="title"
          {...register("title", { required: t("communities:title_required") })}
          defaultValue={event?.title}
          error={!!errors.title}
          fullWidth
          helperText={errors.title?.message || ""}
          label={t("communities:event_title_label")}
          variant="standard"
        />
        <EventTimeChanger
          control={control}
          errors={errors}
          event={isEdit ? event : undefined}
          getValues={getValues}
          register={register}
          setValue={setValue}
          dirtyFields={dirtyFields}
        />
        <StyledLocationContainer>
          {isOnline ? (
            <>
              <TextField
                id="link"
                {...register("link", {
                  required: t("communities:link_required"),
                })}
                defaultValue={event?.onlineInformation?.link}
                error={!!errors.link?.message}
                helperText={errors.link?.message || ""}
                fullWidth
                label={t("communities:virtual_event_link")}
                variant="standard"
              />
              <Alert severity="warning">
                {t("communities.virtual_event_deprecated_warning")}
              </Alert>
            </>
          ) : (
            <LocationAutocomplete
              control={control}
              name="location"
              defaultValue={locationDefaultValue}
              fieldError={errors.location?.message}
              fullWidth
              label={t("communities:location")}
              required={t("communities:location_required")}
              showFullDisplayName
              autocompleteContext="create-event-form"
            />
          )}

          {isEdit && (
            <FormControlLabel
              control={
                <Checkbox
                  {...register("shouldNotify")}
                  defaultChecked={false}
                  name="shouldNotify"
                />
              }
              label={t("communities:notify_attendees")}
            />
          )}
        </StyledLocationContainer>
        <StyledEventDetailsContainer>
          <Typography id="content-label" variant="h3" component="p">
            {t("communities:event_details")}
          </Typography>
          <MarkdownInput
            control={control}
            defaultValue={event?.content}
            id="content"
            name="content"
            labelId="content-label"
            required={t("communities:event_details_required")}
          />
        </StyledEventDetailsContainer>

        {children({ isMutationLoading })}
      </StyledForm>
    </StyledWrapper>
  );
}
