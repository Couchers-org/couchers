import Datepicker from "components/Datepicker";
import TextField from "components/TextField";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Event } from "proto/events_pb";
import { useMemo, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
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

  const [timeDelta, setTimeDelta] = useState(60);
  const [dateDelta, setDateDelta] = useState(0);

  const { date: eventStartDate, time: eventStartTime } =
    splitTimestampToDateAndTime(event?.startTime);
  const { date: eventEndDate, time: eventEndTime } =
    splitTimestampToDateAndTime(event?.endTime);

  const now = dayjs();
  const defaultDate = now.get("hour") === 23 ? now.add(1, "day") : now;

  const endDate = useWatch({
    control,
    name: "endDate",
    defaultValue: eventEndDate || defaultDate,
  });

  const defaultEndTime = useMemo(
    () => dayjs().add(1, "hour").add(timeDelta, "minutes").format("HH:[00]"),
    [timeDelta]
  );

  const handleStartTimeChange = (e: {
    target: { value: string | number | dayjs.Dayjs | Date | null | undefined };
  }) => {
    const newStartTime = dayjs(e.target.value, TIME_FORMAT);
    const newEndTime = dayjs(e.target.value, TIME_FORMAT)
      .add(timeDelta, "minutes")
      .format(TIME_FORMAT);

    if (newStartTime.isValid()) {
      setValue("startTime", newStartTime.format(TIME_FORMAT), {
        shouldDirty: true,
      });
      setValue("endTime", newEndTime, { shouldDirty: true });
    }
  };

  const handleStartDateChange = (newStartDate: Dayjs) => {
    setValue("startDate", newStartDate, { shouldDirty: true });

    if (!isNaN(dateDelta)) {
      setValue("endDate", newStartDate.add(dateDelta, "days"), {
        shouldDirty: true,
      });
    }
  };

  const handleEndTimeChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const startTime = getValues("startTime");
    const newEndTime = dayjs(event.target.value, TIME_FORMAT);

    setValue("endTime", newEndTime.format(TIME_FORMAT), { shouldDirty: true });

    const newTimeDelta = dayjs(newEndTime, TIME_FORMAT).diff(
      dayjs(startTime, TIME_FORMAT),
      "minutes"
    );

    if (!isNaN(newTimeDelta)) {
      setTimeDelta(newTimeDelta);
    }
  };

  const handleEndDateChange = (newEndDate: Dayjs) => {
    const startDate = getValues("startDate");
    const newDelta = endDate
      .startOf("day")
      .diff(startDate.startOf("day"), "days");

    if (!isNaN(newDelta)) {
      setDateDelta(newDelta);
    }

    setValue("endDate", newEndDate, { shouldDirty: true });
  };

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
            pattern: {
              message: t("communities:invalid_time"),
              value: timePattern,
            },
            validate: (time: string) => {
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
          defaultValue={eventEndDate ?? defaultDate}
          error={!!errors.endDate?.message}
          helperText={errors.endDate?.message || ""}
          id="endDate"
          label={t("communities:end_date")}
          name="endDate"
          rules={{
            required: t("communities:date_required"),
            validate: (date) => {
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
          onPostChange={handleEndDateChange}
        />
        <TextField
          defaultValue={eventEndTime || defaultEndTime}
          error={!!errors.endTime?.message}
          fullWidth
          helperText={errors.endTime?.message || ""}
          id="endTime"
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
