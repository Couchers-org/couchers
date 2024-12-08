import Datepicker from "components/Datepicker";
import TextField from "components/TextField";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Event } from "proto/events_pb";
import { useMemo, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { isSameOrFutureDate, timestamp2Date } from "utils/date";
import dayjs, { Dayjs, TIME_FORMAT } from "utils/dayjs";
import { timePattern } from "utils/validation";

import { CreateEventData, useEventFormStyles } from "./EventForm";

export function splitTimestampToDateAndTime(timestamp?: Timestamp.AsObject): {
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
    UseFormReturn<CreateEventData>,
    "control" | "getValues" | "setValue" | "register"
  > {
  dirtyFields: UseFormReturn<CreateEventData>["formState"]["dirtyFields"];
  event?: Event.AsObject;
  errors: UseFormReturn<CreateEventData>["formState"]["errors"];
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
  const { t } = useTranslation([COMMUNITIES]);
  const classes = useEventFormStyles();

  const now = dayjs();
  const defaultDate = now.get("hour") === 23 ? now.add(1, "day") : now;

  const { date: eventStartDate, time: eventStartTime } =
    splitTimestampToDateAndTime(event?.startTime);
  const { date: eventEndDate, time: eventEndTime } =
    splitTimestampToDateAndTime(event?.endTime);

  const dateDelta = useRef(0);
  const timeDelta = useRef(60);
  const defaultEndTime = useMemo(
    () =>
      dayjs()
        .add(1, "hour")
        .add(timeDelta.current, "minutes")
        .format("HH:[00]"),
    []
  );

  return (
    <>
      <div className={classes.duoContainer}>
        <Datepicker
          control={control}
          defaultValue={eventStartDate ?? defaultDate}
          error={!!errors.startDate?.message}
          helperText={errors.startDate?.message || ""}
          id="startDate"
          label={t("communities:start_date")}
          name="startDate"
          onPostChange={(date: Dayjs) => {
            setValue("endDate", date.add(dateDelta.current, "days"), {
              shouldDirty: true,
            });
          }}
          rules={{
            required: t("communities:date_required"),
            validate: (date: Dayjs) => {
              // Only disable validation temporarily if `event` exists/in the edit event context
              if (event && !dirtyFields.startDate) {
                return true;
              }
              return (
                isSameOrFutureDate(date, dayjs()) ||
                t("communities:past_date_error")
              );
            },
          }}
          testId="startDate"
        />
        <TextField
          {...register("startTime", {
            pattern: {
              message: t("communities:invalid_time"),
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
              return (
                startDate.isAfter(dayjs()) || t("communities:past_time_error")
              );
            },
          })}
          defaultValue={
            eventStartTime || dayjs().add(1, "hour").format("HH:[00]")
          }
          error={!!errors.startTime?.message}
          fullWidth
          helperText={errors.startTime?.message || ""}
          id="startTime"
          InputLabelProps={{ shrink: true }}
          label={t("communities:start_time")}
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
          error={!!errors.endDate?.message}
          helperText={errors.endDate?.message || ""}
          id="endDate"
          label={t("communities:end_date")}
          name="endDate"
          rules={{
            required: t("communities:date_required"),
            validate: (date: Dayjs) => {
              if (event && !dirtyFields.endDate) {
                return true;
              }

              return (
                isSameOrFutureDate(date, dayjs()) ||
                t("communities:past_date_error")
              );
            },
          }}
          testId="endDate"
        />
        <TextField
          {...register("endTime", {
            pattern: {
              message: t("communities:invalid_time"),
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
                return t("communities:end_time_error");
              }

              return (
                endDate.isAfter(dayjs()) || t("communities:past_time_error")
              );
            },
          })}
          defaultValue={eventEndTime || defaultEndTime}
          error={!!errors.endTime?.message}
          fullWidth
          helperText={errors.endTime?.message || ""}
          id="endTime"
          InputLabelProps={{ shrink: true }}
          label={t("communities:end_time")}
          type="time"
          variant="standard"
        />
      </div>
    </>
  );
}
