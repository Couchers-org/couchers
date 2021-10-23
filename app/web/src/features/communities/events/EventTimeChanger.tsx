import Datepicker from "components/Datepicker";
import TextField from "components/TextField";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { Event } from "proto/events_pb";
import { useEffect, useMemo, useRef } from "react";
import { UseFormMethods, useWatch } from "react-hook-form";
import { isSameOrFutureDate, timestamp2Date } from "utils/date";
import dayjs, { Dayjs, TIME_FORMAT } from "utils/dayjs";
import { timePattern } from "utils/validation";

import {
  DATE_REQUIRED,
  END_DATE,
  END_TIME,
  END_TIME_ERROR,
  INVALID_TIME,
  PAST_DATE_ERROR,
  PAST_TIME_ERROR,
  START_DATE,
  START_TIME,
} from "./constants";
import { CreateEventData, useEventFormStyles } from "./EventForm";

function splitTimestampToDateAndTime(timestamp?: Timestamp.AsObject): {
  date?: Dayjs;
  time?: string;
} {
  if (timestamp) {
    const dayjsDate = dayjs(timestamp2Date(timestamp));
    return {
      date: dayjsDate.startOf("day"),
      time: dayjsDate.format(TIME_FORMAT),
    };
  }
  return {};
}

interface EventTimeChangerProps
  extends Pick<
    UseFormMethods<CreateEventData>,
    "control" | "errors" | "getValues" | "setValue" | "register"
  > {
  dirtyFields: UseFormMethods<CreateEventData>["formState"]["dirtyFields"];
  event?: Event.AsObject;
}

export default function EventTimeChanger({
  control,
  dirtyFields,
  errors,
  event,
  getValues,
  register,
  setValue,
}: EventTimeChangerProps) {
  const classes = useEventFormStyles();

  const { date: eventStartDate, time: eventStartTime } =
    splitTimestampToDateAndTime(event?.startTime);
  const { date: eventEndDate, time: eventEndTime } =
    splitTimestampToDateAndTime(event?.endTime);

  const now = dayjs();
  const defaultDate = now.get("hour") === 23 ? now.add(1, "day") : now;

  const dateDelta = useRef(0);
  const endDate = useWatch({
    control,
    name: "endDate",
    defaultValue: eventEndDate || defaultDate,
  });
  useEffect(() => {
    const startDate = getValues("startDate");
    const newDelta = endDate
      .startOf("day")
      .diff(startDate.startOf("day"), "days");
    if (!isNaN(newDelta)) {
      dateDelta.current = newDelta;
    }
  }, [getValues, endDate]);

  const timeDelta = useRef(60);
  const defaultEndTime = useMemo(
    () =>
      dayjs()
        .add(1, "hour")
        .add(timeDelta.current, "minutes")
        .format("HH:[00]"),
    []
  );
  const endTime = useWatch({
    control,
    name: "endTime",
    defaultValue: eventEndTime || defaultEndTime,
  });
  useEffect(() => {
    const startTime = getValues("startTime");
    const newDelta = dayjs(endTime, TIME_FORMAT).diff(
      dayjs(startTime, TIME_FORMAT),
      "minutes"
    );
    if (!isNaN(newDelta)) {
      timeDelta.current = newDelta;
    }
  }, [getValues, endTime]);

  return (
    <>
      <div className={classes.duoContainer}>
        <Datepicker
          control={control}
          defaultValue={eventStartDate ?? defaultDate}
          // @ts-expect-error - react-hook-form incorrect types the message property for input fields with object values
          error={!!errors.startDate?.message}
          // @ts-expect-error
          helperText={errors.startDate?.message || ""}
          id="startDate"
          label={START_DATE}
          name="startDate"
          onPostChange={(date) => {
            setValue("endDate", date.add(dateDelta.current, "days"), {
              shouldDirty: true,
            });
          }}
          rules={{
            required: DATE_REQUIRED,
            validate: (date) => {
              // Only disable validation temporarily if `event` exists/in the edit event context
              if (event && !dirtyFields.startDate) {
                return true;
              }
              return isSameOrFutureDate(date, dayjs()) || PAST_DATE_ERROR;
            },
          }}
          testId="startDate"
        />
        <TextField
          defaultValue={
            eventStartTime || dayjs().add(1, "hour").format("HH:[00]")
          }
          error={!!errors.startTime?.message}
          fullWidth
          helperText={errors.startTime?.message || ""}
          id="startTime"
          inputRef={register({
            pattern: {
              message: INVALID_TIME,
              value: timePattern,
            },
            validate: (time) => {
              if (event && !dirtyFields.startTime) {
                return true;
              }

              const startTime = dayjs(time, TIME_FORMAT);
              const startDate = getValues("startDate")
                .startOf("day")
                .add(startTime.get("hour"), "hour")
                .add(startTime.get("minute"), "minute");
              return startDate.isAfter(dayjs()) || PAST_TIME_ERROR;
            },
          })}
          InputLabelProps={{ shrink: true }}
          label={START_TIME}
          name="startTime"
          onChange={(e) => {
            const newStartTime = dayjs(e.target.value, TIME_FORMAT);
            if (newStartTime.isValid()) {
              setValue(
                "endTime",
                dayjs(e.target.value, TIME_FORMAT)
                  .add(timeDelta.current, "minutes")
                  .format(TIME_FORMAT),
                { shouldDirty: true }
              );
            }
          }}
          type="time"
          variant="standard"
        />
      </div>
      <div className={classes.duoContainer}>
        <Datepicker
          control={control}
          defaultValue={eventEndDate ?? defaultDate}
          // @ts-expect-error
          error={!!errors.endDate?.message}
          // @ts-expect-error
          helperText={errors.endDate?.message || ""}
          id="endDate"
          label={END_DATE}
          name="endDate"
          rules={{
            required: DATE_REQUIRED,
            validate: (date) => {
              if (event && !dirtyFields.endDate) {
                return true;
              }

              return isSameOrFutureDate(date, dayjs()) || PAST_DATE_ERROR;
            },
          }}
          testId="endDate"
        />
        <TextField
          defaultValue={eventEndTime || defaultEndTime}
          error={!!errors.endTime?.message}
          fullWidth
          helperText={errors.endTime?.message || ""}
          id="endTime"
          inputRef={register({
            pattern: {
              message: INVALID_TIME,
              value: timePattern,
            },
            validate: (time) => {
              if (event && !dirtyFields.endTime) {
                return true;
              }

              const startTime = dayjs(getValues("startTime"), TIME_FORMAT);
              const startDate = getValues("startDate")
                .startOf("day")
                .add(startTime.get("hour"), "hour")
                .add(startTime.get("minute"), "minute");
              const endTime = dayjs(time, TIME_FORMAT);
              const endDate = getValues("endDate")
                .startOf("day")
                .add(endTime.get("hour"), "hour")
                .add(endTime.get("minute"), "minute");

              if (!endDate.isAfter(startDate)) {
                return END_TIME_ERROR;
              }

              return endDate.isAfter(dayjs()) || PAST_TIME_ERROR;
            },
          })}
          InputLabelProps={{ shrink: true }}
          label={END_TIME}
          name="endTime"
          type="time"
          variant="standard"
        />
      </div>
    </>
  );
}
