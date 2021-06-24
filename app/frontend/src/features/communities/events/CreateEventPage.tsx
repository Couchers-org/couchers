import { Checkbox, FormControlLabel, Typography } from "@material-ui/core";
import classNames from "classnames";
import Button from "components/Button";
import Datepicker from "components/Datepicker";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import TextField from "components/TextField";
import Timepicker from "components/Timepicker";
import { Dayjs } from "dayjs";
import { CREATE, LOCATION } from "features/constants";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import { useForm } from "react-hook-form";
import { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import {
  CREATE_EVENT,
  END_DATE,
  END_TIME,
  EVENT_DETAILS,
  START_DATE,
  START_TIME,
  TITLE,
  VIRTUAL_EVENT,
  VIRTUAL_EVENT_LINK,
} from "../constants";

const useStyles = makeStyles((theme) => ({
  form: {
    display: "grid",
    rowGap: theme.spacing(3),
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

interface CreateEventData {
  content: string;
  title: string;
  startDate: Dayjs;
  endDate: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  isOnline: boolean;
  location?: GeocodeResult;
  link?: string;
}

export default function CreateEventPage() {
  const classes = useStyles();
  const { control, errors, handleSubmit, register, watch } =
    useForm<CreateEventData>();

  const isOnline = watch("isOnline", false);

  const onSubmit = handleSubmit((data) => {
    // create event mutation
    console.log(data);
  });

  return (
    <>
      <PageTitle>{CREATE_EVENT}</PageTitle>
      <form className={classes.form} onSubmit={onSubmit}>
        <TextField
          fullWidth
          id="title"
          inputRef={register({ required: true })}
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
            inputRef={register}
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
            inputRef={register}
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
          {!isOnline ? (
            <LocationAutocomplete
              control={control}
              fullWidth
              label={LOCATION}
              onChange={() => {}}
            />
          ) : (
            <TextField
              fullWidth
              id="link"
              name="link"
              inputRef={register}
              label={VIRTUAL_EVENT_LINK}
              variant="standard"
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
        <Button className={classes.createEventButton} type="submit">
          {CREATE}
        </Button>
      </form>
    </>
  );
}
