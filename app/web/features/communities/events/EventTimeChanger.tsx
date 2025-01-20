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

  const { date: eventStartDate, time: eventStartTime } =
    splitTimestampToDateAndTime(event?.startTime);
  const { date: eventEndDate, time: eventEndTime } =
    splitTimestampToDateAndTime(event?.endTime);

  const handleStartTimeChange = (e: {
    target: { value: string | number | dayjs.Dayjs | Date | null | undefined };
  }) => {
    if (!e.target.value) {
      setValue("startTime", "", { shouldDirty: true, shouldValidate: true });
      return;
    }
    const newStartTime = dayjs(e.target.value, TIME_FORMAT);

    setValue("startTime", newStartTime.format(TIME_FORMAT), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleStartDateChange = (newStartDate: Dayjs) => {
    setValue("startDate", newStartDate, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleEndTimeChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    if (!event.target.value) {
      setValue("endTime", "", { shouldDirty: true, shouldValidate: true });
      return;
    }

    const newEndTime = dayjs(event.target.value, TIME_FORMAT);

    setValue("endTime", newEndTime.format(TIME_FORMAT), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleEndDateChange = (newEndDate: Dayjs) => {
    setValue("endDate", newEndDate, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <>
      <div className={classes.duoContainer}>
        <Datepicker
          control={control}
          defaultValue={eventStartDate ?? null}
          error={!!errors.startDate?.message}
          helperText={errors.startDate?.message}
          id="startDate"
          label={t("communities:start_date")}
          name="startDate"
          onPostChange={handleStartDateChange}
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
          id="startTime"
          {...register("startTime", {
            required: t("communities:time_required"),
            pattern: {
              message: t("communities:invalid_time"),
              value: timePattern,
            },
            validate: (time: string) => {
              if (event && !dirtyFields.startTime) {
                return true;
              }

              const startTime = dayjs(time, TIME_FORMAT);
              const startDate = getValues("startDate");

              if (!startDate) {
                return false;
              }

              const newStartDate = startDate
                .startOf("day")
                .add(startTime.get("hour"), "hour")
                .add(startTime.get("minute"), "minute");
              return (
                newStartDate.isAfter(dayjs()) ||
                t("communities:past_time_error")
              );
            },
          })}
          defaultValue={eventStartTime || null}
          error={!!errors.startTime?.message}
          fullWidth
          helperText={errors.startTime?.message}
          InputLabelProps={{ shrink: true }}
          label={t("communities:start_time")}
          onChange={handleStartTimeChange}
          type="time"
          variant="standard"
        />
      </div>
      <div className={classes.duoContainer}>
        <Datepicker
          control={control}
          defaultValue={eventEndDate ?? null}
          error={!!errors.endDate?.message}
          helperText={errors.endDate?.message}
          id="endDate"
          label={t("communities:end_date")}
          name="endDate"
          rules={{
            required: t("communities:date_required"),
            validate: (date) => {
              if (event && !dirtyFields.endDate) {
                return true;
              }

              const startDate = getValues("startDate");

              if (date.isBefore(startDate)) {
                return t("communities:end_date_error");
              }

              return (
                isSameOrFutureDate(date, dayjs()) ||
                t("communities:past_date_error")
              );
            },
          }}
          testId="endDate"
          onPostChange={handleEndDateChange}
        />
        <TextField
          defaultValue={eventEndTime || null}
          error={!!errors.endTime?.message}
          fullWidth
          helperText={errors.endTime?.message || ""}
          id="endTime"
          {...register("endTime", {
            required: t("communities:time_required"),
            pattern: {
              message: t("communities:invalid_time"),
              value: timePattern,
            },
            validate: (time) => {
              if (event && !dirtyFields.endTime) {
                return true;
              }

              const startTime = dayjs(getValues("startTime"), TIME_FORMAT);
              const startDate = getValues("startDate");

              if (!startDate) {
                return false;
              }

              const newStartDate = startDate
                .startOf("day")
                .add(startTime.get("hour"), "hour")
                .add(startTime.get("minute"), "minute");
              const endTime = dayjs(time, TIME_FORMAT);
              const endDate = getValues("endDate")
                .startOf("day")
                .add(endTime.get("hour"), "hour")
                .add(endTime.get("minute"), "minute");

              if (!endDate.isAfter(newStartDate)) {
                return t("communities:end_time_error");
              }

              // if the endTime is in the past return past_time_error
              const endDateTime = endDate.format("YYYY-MM-DD HH:mm");
              const nowDateTime = dayjs().format("YYYY-MM-DD HH:mm");

              if (endDateTime < nowDateTime) {
                return t("communities:past_time_error");
              }

              return (
                endDate.isAfter(dayjs()) || t("communities:past_time_error")
              );
            },
          })}
          InputLabelProps={{ shrink: true }}
          label={t("communities:end_time")}
          type="time"
          variant="standard"
          onChange={handleEndTimeChange}
        />
      </div>
    </>
  );
}
