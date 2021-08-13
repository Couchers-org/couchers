import { Checkbox, FormControlLabel, Typography } from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import Button from "components/Button";
import Datepicker from "components/Datepicker";
import ImageInput from "components/ImageInput";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import TextField from "components/TextField";
import { CREATE, TITLE } from "features/constants";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import { Error as GrpcError } from "grpc-web";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { UseMutateFunction } from "react-query";
import dayjs, { Dayjs, TIME_FORMAT } from "utils/dayjs";
import type { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";
import { timePattern } from "utils/validation";

import {
  END_DATE,
  END_TIME,
  EVENT_DETAILS,
  EVENT_IMAGE_INPUT_ALT,
  INVALID_TIME,
  LINK_REQUIRED,
  LOCATION,
  LOCATION_REQUIRED,
  START_DATE,
  START_TIME,
  TITLE_REQUIRED,
  VIRTUAL_EVENT,
  VIRTUAL_EVENT_LINK,
  VIRTUAL_EVENTS_SUBTEXT,
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
  const classes = useStyles();
  const { control, errors, handleSubmit, getValues, register, watch } =
    useForm<CreateEventData>();

  // These are used to figure out how to adjust the endDate/endTime if startDate/time changes
  // TODO: actually shifting the time when the start* bit change
  const dateDelta = useRef(0);
  const startDate = watch("startDate");
  useEffect(() => {
    const endDate = getValues("endDate");
    dateDelta.current = endDate.diff(startDate, "days");
  }, [getValues, startDate]);

  const timeDelta = useRef(60);
  const startTime = watch("startTime");
  useEffect(() => {
    const endTime = getValues("endTime");
    timeDelta.current = dayjs(endTime, TIME_FORMAT).diff(
      dayjs(startTime, TIME_FORMAT),
      "minutes"
    );
  }, [getValues, startTime]);

  const isOnline = watch("isOnline", false);

  const onSubmit = handleSubmit(
    (data) => {
      mutate(data);
    },
    (errors) => {
      if (errors.eventImage) {
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
      {(error || errors.eventImage || errors.location) && (
        <Alert severity="error">
          {error?.message ||
            errors.eventImage?.message ||
            // @ts-expect-error
            errors.location?.message ||
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
        <div className={classes.duoContainer}>
          <Datepicker
            control={control}
            // @ts-expect-error - react-hook-form incorrect types the message property for input fields with object values
            error={!!errors.startDate?.message}
            // @ts-expect-error
            helperText={errors.startDate?.message || ""}
            id="startDate"
            label={START_DATE}
            name="startDate"
          />
          <TextField
            defaultValue={dayjs().add(1, "hour").format("HH:[00]")}
            error={!!errors.startTime?.message}
            fullWidth
            helperText={errors.startTime?.message || ""}
            id="startTime"
            inputRef={register({
              pattern: {
                message: INVALID_TIME,
                value: timePattern,
              },
            })}
            label={START_TIME}
            name="startTime"
            type="time"
            variant="standard"
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
          <TextField
            defaultValue={dayjs()
              .add(1, "hour")
              .add(timeDelta.current, "minutes")
              .format("HH:[00]")}
            error={!!errors.endTime?.message}
            fullWidth
            helperText={errors.endTime?.message || ""}
            id="endTime"
            inputRef={register({
              pattern: {
                message: INVALID_TIME,
                value: timePattern,
              },
            })}
            label={END_TIME}
            name="endTime"
            type="time"
            variant="standard"
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
