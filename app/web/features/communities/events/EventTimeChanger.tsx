import Datepicker from "components/Datepicker";
import TextField from "components/TextField";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Event } from "proto/events_pb";
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

  const { startDate, startTime, endDate, endTime } = getValues();

  return (
    <>
      <div className={classes.duoContainer}>
        <Datepicker
          control={control}
          defaultValue={startDate}
          error={!!errors.startDate?.message}
          helperText={errors.startDate?.message || ""}
          id="startDate"
          label={t("communities:start_date")}
          name="startDate"
          onPostChange={(date: Dayjs) => {
            const newEndDate = date.add(1, "hour");

            setValue("endDate", newEndDate, {
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
          defaultValue={startTime}
          error={!!errors.startTime?.message}
          fullWidth
          helperText={errors.startTime?.message || ""}
          id="startTime"
          InputLabelProps={{ shrink: true }}
          label={t("communities:start_time")}
          onChange={(e) => {
            const newStartTime = dayjs(e.target.value, TIME_FORMAT);

            if (newStartTime.isValid()) {
              setValue("startTime", newStartTime.format(TIME_FORMAT), {
                shouldDirty: true,
              });
              setValue(
                "endTime",
                dayjs(e.target.value, TIME_FORMAT)
                  .add(60, "minutes")
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
          defaultValue={endDate}
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
          defaultValue={endTime}
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
