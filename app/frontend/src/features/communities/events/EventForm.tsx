import { Checkbox, FormControlLabel, Typography } from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import Button from "components/Button";
import ImageInput from "components/ImageInput";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import TextField from "components/TextField";
import { CREATE, TITLE } from "features/constants";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import { Error as GrpcError } from "grpc-web";
import { useForm } from "react-hook-form";
import { UseMutateFunction } from "react-query";
import { Dayjs } from "utils/dayjs";
import type { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import {
  EVENT_DETAILS,
  EVENT_DETAILS_REQUIRED,
  EVENT_IMAGE_INPUT_ALT,
  LINK_REQUIRED,
  LOCATION,
  LOCATION_REQUIRED,
  TITLE_REQUIRED,
  VIRTUAL_EVENT,
  VIRTUAL_EVENT_LINK,
  VIRTUAL_EVENTS_SUBTEXT,
} from "./constants";
import EventTimeChanger from "./EventTimeChanger";

export const useEventFormStyles = makeStyles((theme) => ({
  imageInput: {
    marginBlockStart: theme.spacing(3),
  },
  form: {
    display: "grid",
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
    rowGap: theme.spacing(1),
  },
  createEventButton: {
    justifySelf: "end",
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

interface EventFormProps {
  error: GrpcError | null;
  mutate: UseMutateFunction<unknown, GrpcError, CreateEventData, unknown>;
  isMutationLoading: boolean;
  title: string;
}

export default function EventForm({
  error,
  mutate,
  isMutationLoading,
  title,
}: EventFormProps) {
  const classes = useEventFormStyles();

  const {
    control,
    errors,
    handleSubmit,
    getValues,
    register,
    setValue,
    watch,
  } = useForm<CreateEventData>({
    mode: "onBlur",
  });

  const isOnline = watch("isOnline", false);

  const onSubmit = handleSubmit(
    (data) => {
      mutate(data);
    },
    (errors) => {
      if (errors.eventImage || errors.location || errors.content) {
        window.scroll({ top: 0, behavior: "smooth" });
      }
    }
  );

  return (
    <>
      <ImageInput
        alt={EVENT_IMAGE_INPUT_ALT}
        className={classes.imageInput}
        control={control}
        id="event-image-input"
        name="eventImage"
        type="rect"
      />
      <PageTitle>{title}</PageTitle>
      {(error || errors.eventImage || errors.location || errors.content) && (
        <Alert severity="error">
          {error?.message ||
            errors.eventImage?.message ||
            // @ts-expect-error
            errors.location?.message ||
            errors.content?.message ||
            ""}
        </Alert>
      )}
      <form className={classes.form} onSubmit={onSubmit}>
        <TextField
          fullWidth
          id="title"
          inputRef={register({ required: TITLE_REQUIRED })}
          name="title"
          label={TITLE}
          variant="standard"
        />
        <EventTimeChanger
          control={control}
          errors={errors}
          getValues={getValues}
          register={register}
          setValue={setValue}
        />
        <div
          className={classNames(
            classes.duoContainer,
            classes.locationContainer
          )}
        >
          {isOnline ? (
            <TextField
              error={!!errors.link?.message}
              helperText={errors.link?.message || ""}
              fullWidth
              id="link"
              name="link"
              inputRef={register({ required: LINK_REQUIRED })}
              label={VIRTUAL_EVENT_LINK}
              variant="standard"
            />
          ) : (
            <LocationAutocomplete
              control={control}
              fullWidth
              label={LOCATION}
              required={LOCATION_REQUIRED}
            />
          )}
          <div className={classes.isOnlineCheckbox}>
            <FormControlLabel
              control={<Checkbox name="isOnline" inputRef={register} />}
              label={VIRTUAL_EVENT}
            />
            <Typography variant="body2">{VIRTUAL_EVENTS_SUBTEXT}</Typography>
          </div>
        </div>
        <div className={classes.eventDetailsContainer}>
          <Typography id="content-label" variant="h3" component="p">
            {EVENT_DETAILS}
          </Typography>
          <MarkdownInput
            control={control}
            id="content"
            name="content"
            labelId="content-label"
            required={EVENT_DETAILS_REQUIRED}
          />
        </div>
        <Button
          className={classes.createEventButton}
          loading={isMutationLoading}
          type="submit"
        >
          {CREATE}
        </Button>
      </form>
    </>
  );
}
