import { Checkbox, FormControlLabel, Typography } from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import ImageInput from "components/ImageInput";
import LocationAutocomplete from "components/LocationAutocomplete";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import TextField from "components/TextField";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { LngLat } from "maplibre-gl";
import { Event } from "proto/events_pb";
import { useRef } from "react";
import { DeepMap, useForm } from "react-hook-form";
import { UseMutateFunction } from "react-query";
import { Dayjs } from "utils/dayjs";
import type { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import EventTimeChanger from "./EventTimeChanger";

export const useEventFormStyles = makeStyles((theme) => ({
  root: {
    marginBlockStart: theme.spacing(4),
  },
  imageUploadhelperText: {
    textAlign: "center",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    rowGap: theme.spacing(3),
    marginBlockEnd: theme.spacing(3),
  },
  duoContainer: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.spacing(3, 2),
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "1fr 1fr",
    },
  },
  locationContainer: {
    minHeight: theme.typography.pxToRem(66),
  },
  endDateTimeButton: {
    justifySelf: "start",
  },
  isOnlineCheckbox: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  eventDetailsContainer: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    rowGap: theme.spacing(1),
  },
  submitButton: {
    justifySelf: "start",
  },
}));

interface BaseEventData {
  content: string;
  title: string;
  startDate: Dayjs;
  endDate: Dayjs;
  startTime: string;
  endTime: string;
  isOnline: boolean;
  eventImage?: string;
  parentCommunityId?: number;
  link?: string;
  location?: GeocodeResult;
}
interface OfflineEventData extends BaseEventData {
  isOnline: false;
  location: GeocodeResult;
}

interface OnlineEventData extends BaseEventData {
  isOnline: true;
  link: string;
  parentCommunityId: number;
}

export type CreateEventData = OfflineEventData | OnlineEventData;

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
}

export default function EventForm({
  children,
  event,
  error,
  mutate,
  isMutationLoading,
  title,
}: EventFormProps) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const classes = useEventFormStyles();

  const {
    control,
    errors,
    handleSubmit,
    getValues,
    register,
    setValue,
    watch,
    formState: { dirtyFields },
  } = useForm<CreateEventData>();

  const isOnline = watch("isOnline", false);
  const locationDefaultValue = useRef(
    event?.offlineInformation
      ? {
          name: event.offlineInformation.address,
          simplifiedName: event.offlineInformation.address,
          location: new LngLat(
            event.offlineInformation.lng,
            event.offlineInformation.lat
          ),
        }
      : ("" as const)
  ).current;

  const onSubmit = handleSubmit(
    (data) => {
      mutate({
        ...data,
        dirtyFields,
      });
    },
    (errors) => {
      if (errors.eventImage) {
        window.scroll({ top: 0, behavior: "smooth" });
      }
    }
  );

  return (
    <div className={classes.root}>
      <ImageInput
        alt={t("communities:event_image_input_alt")}
        control={control}
        id="event-image-input"
        initialPreviewSrc={event?.photoUrl || undefined}
        name="eventImage"
        type="rect"
      />
      <Typography className={classes.imageUploadhelperText} variant="body1">
        {t("communities:upload_helper_text")}
      </Typography>
      <PageTitle>{title}</PageTitle>
      {(error || errors.eventImage) && (
        <Alert severity="error">
          {error?.message || errors.eventImage?.message || ""}
        </Alert>
      )}
      <form className={classes.form} onSubmit={onSubmit}>
        <TextField
          defaultValue={event?.title}
          error={!!errors.title}
          fullWidth
          helperText={errors.title?.message || ""}
          id="title"
          inputRef={register({ required: t("communities:title_required") })}
          name="title"
          label={t("global:title")}
          variant="standard"
        />
        <EventTimeChanger
          control={control}
          errors={errors}
          event={event}
          getValues={getValues}
          register={register}
          setValue={setValue}
          dirtyFields={dirtyFields}
        />
        <div
          className={classNames(
            classes.duoContainer,
            classes.locationContainer
          )}
        >
          {isOnline ? (
            <TextField
              defaultValue={event?.onlineInformation?.link}
              error={!!errors.link?.message}
              helperText={errors.link?.message || ""}
              fullWidth
              id="link"
              name="link"
              inputRef={register({ required: t("communities:link_required") })}
              label={t("communities:virtual_event_link")}
              variant="standard"
            />
          ) : (
            <LocationAutocomplete
              control={control}
              name="location"
              defaultValue={locationDefaultValue}
              // @ts-expect-error
              fieldError={errors.location?.message}
              fullWidth
              label={t("communities:location")}
              required={t("communities:location_required")}
              showFullDisplayName
            />
          )}
          <div className={classes.isOnlineCheckbox}>
            <FormControlLabel
              control={
                <Checkbox
                  defaultChecked={!!event?.onlineInformation}
                  name="isOnline"
                  inputRef={register}
                />
              }
              label={t("communities:virtual_event")}
            />
            <Typography variant="body2">
              {t("communities:virtual_events_subtext")}
            </Typography>
          </div>
        </div>
        <div className={classes.eventDetailsContainer}>
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
          {errors.content && (
            <Typography color="error" variant="body2">
              {errors.content.message}
            </Typography>
          )}
        </div>
        {children({ isMutationLoading })}
      </form>
    </div>
  );
}
