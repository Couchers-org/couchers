import { Checkbox, FormControlLabel, Typography } from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import Button from "components/Button";
import Datepicker from "components/Datepicker";
import ImageInput from "components/ImageInput";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import TextField from "components/TextField";
import Timepicker from "components/Timepicker";
import { CREATE, TITLE } from "features/constants";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import { Error as GrpcError } from "grpc-web";
import { Event } from "proto/events_pb";
import { communityEventsBaseKey } from "queryKeys";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";
import type { CreateEventInput } from "service/events";
import { Dayjs } from "utils/dayjs";
import { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import {
  CREATE_EVENT,
  CREATE_EVENT_SUCCESS,
  END_DATE,
  END_TIME,
  EVENT_DETAILS,
  EVENT_IMAGE_INPUT_ALT,
  LINK_REQUIRED,
  LOCATION,
  START_DATE,
  START_TIME,
  TITLE_REQUIRED,
  VIRTUAL_EVENT,
  VIRTUAL_EVENT_LINK,
} from "./constants";

const useStyles = makeStyles((theme) => ({
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
    width: "50%",
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
  startTime: Dayjs;
  endTime: Dayjs;
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

type CreateEventData = OfflineEventData | OnlineEventData;

export default function CreateEventPage() {
  const classes = useStyles();
  const { control, errors, handleSubmit, register, watch } =
    useForm<CreateEventData>();

  const isOnline = watch("isOnline", false);

  const queryClient = useQueryClient();
  const {
    mutate: createEvent,
    error,
    isLoading,
    isSuccess,
  } = useMutation<Event.AsObject, GrpcError, CreateEventData>(
    (data) => {
      let createEventInput: CreateEventInput;
      // TODO: UTC normalise these and use the user profile's timezone?
      const finalStartDate = data.startDate
        .startOf("day")
        .add(data.startTime.get("hour"), "hour")
        .add(data.startTime.get("minute"), "minute")
        .toDate();
      const finalEndDate = data.endDate
        .startOf("day")
        .add(data.endTime.get("hour"), "hour")
        .add(data.endTime.get("minute"), "minute")
        .toDate();
      if (data.isOnline) {
        createEventInput = {
          isOnline: data.isOnline,
          title: data.title,
          content: data.content,
          startTime: finalStartDate,
          endTime: finalEndDate,
          // TODO: not hardcode this and allow user to specify communinity ID
          parentCommunityId: 1,
          link: data.link,
        };
      } else {
        createEventInput = {
          isOnline: data.isOnline,
          title: data.title,
          content: data.content,
          startTime: finalStartDate,
          endTime: finalEndDate,
          address: data.location?.simplifiedName!,
          lat: data.location.location.lat,
          lng: data.location.location.lng,
        };
      }
      return service.events.createEvent(createEventInput);
    },
    {
      onSuccess() {
        queryClient.invalidateQueries(communityEventsBaseKey);
      },
    }
  );

  const onSubmit = handleSubmit((data) => {
    createEvent(data);
  });

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
      <PageTitle>{CREATE_EVENT}</PageTitle>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isSuccess && <Alert severity="success">{CREATE_EVENT_SUCCESS}</Alert>}
      <form className={classes.form} onSubmit={onSubmit}>
        <TextField
          fullWidth
          id="title"
          inputRef={register({ required: TITLE_REQUIRED })}
          name="title"
          label={TITLE}
          variant="standard"
        />
        <div className={classes.duoContainer}>
          <Datepicker
            control={control}
            // @ts-expect-error
            error={!!errors.startDate?.message}
            // @ts-expect-error
            helperText={errors.startDate?.message || ""}
            id="startDate"
            label={START_DATE}
            name="startDate"
          />
          <Timepicker
            control={control}
            id="startTime"
            label={START_TIME}
            name="startTime"
            // @ts-expect-error
            error={!!errors.startTime?.message}
            // @ts-expect-error
            errorText={errors.startTime?.message || ""}
          />
        </div>
        <div className={classes.duoContainer}>
          <Datepicker
            control={control}
            // @ts-expect-error
            error={!!errors.endDate?.message}
            // @ts-expect-error
            helperText={errors.endDate?.message || ""}
            id="endDate"
            label={END_DATE}
            name="endDate"
          />
          <Timepicker
            control={control}
            id="endTime"
            label={END_TIME}
            name="endTime"
            // @ts-expect-error
            error={!!errors.endTime?.message}
            // @ts-expect-error
            errorText={errors.endTime?.message || ""}
          />
        </div>
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
            />
          )}
          <FormControlLabel
            className={classes.isOnlineCheckbox}
            control={<Checkbox name="isOnline" inputRef={register} />}
            label={VIRTUAL_EVENT}
          />
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
          />
        </div>
        <Button
          className={classes.createEventButton}
          loading={isLoading}
          type="submit"
        >
          {CREATE}
        </Button>
      </form>
    </>
  );
}
