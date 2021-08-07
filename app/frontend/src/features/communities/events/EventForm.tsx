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
import { useForm } from "react-hook-form";
import { UseMutateFunction } from "react-query";
import { Dayjs } from "utils/dayjs";
import type { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import {
  END_DATE,
  END_TIME,
  EVENT_DETAILS,
  EVENT_IMAGE_INPUT_ALT,
  LINK_REQUIRED,
  LOCATION,
  LOCATION_REQUIRED,
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

export type CreateEventData = OfflineEventData | OnlineEventData;

interface EventFormProps {
  error: GrpcError | null;
  mutate: UseMutateFunction<unknown, GrpcError, CreateEventData, unknown>;
  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  successMessage: string;
  title: string;
}

export default function EventForm({
  error,
  mutate,
  isMutationLoading,
  isMutationSuccess,
  successMessage,
  title,
}: EventFormProps) {
  const classes = useStyles();
  const { control, errors, handleSubmit, register, watch } =
    useForm<CreateEventData>();

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
      {error || errors.eventImage || errors.location ? (
        <Alert severity="error">
          {error?.message ||
            errors.eventImage?.message ||
            // @ts-expect-error
            errors.location?.message ||
            ""}
        </Alert>
      ) : (
        isMutationSuccess && <Alert severity="success">{successMessage}</Alert>
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
              required={LOCATION_REQUIRED}
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
          loading={isMutationLoading}
          type="submit"
        >
          {CREATE}
        </Button>
      </form>
    </>
  );
}
