import Datepicker from "components/Datepicker";
import Timepicker from "components/Timepicker";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Event } from "proto/events_pb";
import { UseFormReturn } from "react-hook-form";
import { isSameOrFutureDate, timestamp2Date } from "utils/date";
import dayjs, { Dayjs } from "utils/dayjs";
import { timePattern } from "utils/validation";

import { CreateEventData, useEventFormStyles } from "./EventForm";

function splitTimestampToDateAndTime(timestamp?: Timestamp.AsObject): {
  date?: Dayjs;
  time?: Dayjs;
} {
  if (timestamp) {
    const dayjsDate = dayjs(timestamp2Date(timestamp));
    return {
      date: dayjsDate.startOf("day"),
      time: dayjsDate,
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
  setValue,
}: EventTimeChangerProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const classes = useEventFormStyles();

  const { date: eventStartDate, time: eventStartTime } =
    splitTimestampToDateAndTime(event?.startTime);
  const { date: eventEndDate, time: eventEndTime } =
    splitTimestampToDateAndTime(event?.endTime);

  const handleStartDateChange = (newStartDate: Dayjs) => {
    setValue("startDate", newStartDate, {
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

  const handleStartTimeChange = (newStartTime: Dayjs) => {
    setValue("startTime", newStartTime, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleEndTimeChange = (newEndTime: Dayjs) => {
    setValue("endTime", newEndTime, {
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

        <Timepicker
          control={control}
          name="startTime"
          onPostChange={handleStartTimeChange}
          defaultValue={eventStartTime || null}
          rules={{
            required: t("communities:time_required"),
            pattern: {
              message: t("communities:invalid_time"),
              value: timePattern,
            },
            validate: (time: Dayjs) => {
              if (event && !dirtyFields.startTime) {
                return true;
              }

              const startDate = getValues("startDate");

              if (!startDate) {
                return t("communities:date_required");
              }

              if (!time) {
                return t("communities:time_required");
              }

              const startDateTime = startDate
                .hour(time.hour())
                .minute(time.minute());

              return (
                startDateTime.isAfter(dayjs()) ||
                t("communities:past_time_error")
              );
            },
          }}
          id="startTime"
          label={t("communities:start_time")}
          error={!!errors.startTime?.message}
          helperText={errors.startTime?.message || ""}
          testId="startTime"
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

        <Timepicker
          control={control}
          name="endTime"
          onPostChange={handleEndTimeChange}
          defaultValue={eventEndTime || null}
          rules={{
            required: t("communities:time_required"),
            pattern: {
              message: t("communities:invalid_time"),
              value: timePattern,
            },
            validate: (time: Dayjs) => {
              if (event && !dirtyFields.endTime) {
                return true;
              }

              const startTime = getValues("startTime");
              const startDate = getValues("startDate");
              const endDate = getValues("endDate");

              if (!startTime || !time) {
                return t("communities:time_required");
              }

              if (!startDate || !endDate) {
                return t("communities:date_required");
              }

              const startDateTime = startDate
                .hour(startTime.hour())
                .minute(startTime.minute());

              const endDateTime = endDate
                .hour(time.hour())
                .minute(time.minute());

              if (!endDateTime.isAfter(startDateTime)) {
                return t("communities:end_time_error");
              }

              return (
                endDateTime.isAfter(dayjs()) || t("communities:past_time_error")
              );
            },
          }}
          id="endTime"
          label={t("communities:end_time")}
          error={!!errors.endTime?.message}
          helperText={errors.endTime?.message || ""}
          testId="endTime"
        />
      </div>
    </>
  );
}
