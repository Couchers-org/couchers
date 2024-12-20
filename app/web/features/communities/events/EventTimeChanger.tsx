import Datepicker from "components/Datepicker";
import TextField from "components/TextField";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Event } from "proto/events_pb";
import { useEffect, useMemo, useRef, useState } from "react";
import { set, UseFormReturn, useWatch } from "react-hook-form";
import { isSameOrFutureDate, timestamp2Date } from "utils/date";
import dayjs, { Dayjs, TIME_FORMAT } from "utils/dayjs";
import { timePattern } from "utils/validation";
import { debounce } from "@mui/material";

import { CreateEventData, useEventFormStyles } from "./EventForm";
import { S } from "msw/lib/glossary-2792c6da";

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

  console.log("DateDelta", dateDelta);

  const { date: eventStartDate, time: eventStartTime } =
    splitTimestampToDateAndTime(event?.startTime);
  const { date: eventEndDate, time: eventEndTime } =
    splitTimestampToDateAndTime(event?.endTime);

  const now = dayjs();
  const defaultDate = now.get("hour") === 23 ? now.add(1, "day") : now;

  // const dateDelta = useRef(0);
  const endDate = useWatch({
    control,
    name: "endDate",
    defaultValue: eventEndDate || defaultDate,
  });
  // useEffect(() => {
  //   if (getValues("startDate")) {
  //     const startDate = getValues("startDate");

  //     console.log('USE EFFECT TRIGGERED BY END DATE CHANGE startDate', startDate.format('MM/DD/YYYY'), 'endDate', endDate.format('MM/DD/YYYY'))
  //     const newDelta = endDate
  //       .startOf("day")
  //       .diff(startDate.startOf("day"), "days");

  //       console.log('NEW DELTA', newDelta)
  //     if (!isNaN(newDelta)) {
  //       setDateDelta(newDelta);
  //     }
  //   }
  // }, [getValues, endDate]);

  const defaultEndTime = useMemo(
    () => dayjs().add(1, "hour").add(timeDelta, "minutes").format("HH:[00]"),
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
      setTimeDelta(newDelta);
    }
  }, [getValues, endTime]);

  const handleStartTimeChange = debounce((e) => {
    const newStartTime = dayjs(e.target.value, TIME_FORMAT);

    console.log("newSTARTTIME", newStartTime.format("HH:mm"));

    if (newStartTime.isValid()) {
      // Get the current start date and adjust the end time by the timeDelta
      const adjustedEndTime = newStartTime
        .add(timeDelta, "minutes")
        .format(TIME_FORMAT);

      // Set the new end time value
      setValue("endTime", adjustedEndTime, { shouldDirty: true });
    }
  });

  const handleStartDateChange = debounce((newStartDate: Dayjs) => {
    const oldStartDate = getValues("startDate");
    console.log("OLD START DATE", oldStartDate.format("MM/DD/YYYY"));

    const newDateDelta = endDate
      .startOf("day")
      .diff(oldStartDate.startOf("day"), "days");

    console.log("NEW DELTA", newDateDelta);
    if (!isNaN(newDateDelta)) {
      if (newDateDelta < 0) {
        setDateDelta(0);
        setValue("endDate", newStartDate.add(0, "days"), {
          shouldDirty: true,
        });
      } else {
        setDateDelta(newDateDelta);
        setValue("endDate", newStartDate.add(newDateDelta, "days"), {
          shouldDirty: true,
        });
      }
    }
  });

  const handleEndTimeChange = debounce((e) => {
    const newEndTime = dayjs(e.target.value, TIME_FORMAT);

    console.log("newENDTIME", newEndTime.format("HH:mm"));

    setValue("endTime", newEndTime.format(TIME_FORMAT), { shouldDirty: true });


  });

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
