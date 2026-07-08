import { styled } from "@mui/material";
import Datepicker from "components/Datepicker";
import Timepicker from "components/Timepicker";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Event } from "proto/events_pb";
import { UseFormReturn } from "react-hook-form";
import { Temporal } from "temporal-polyfill";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import { timePattern } from "utils/validation";

import { CreateEventData } from "./EventForm";

const StyledContainer = styled("div")(() => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(3, 2),
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "1fr 1fr",
  },
}));

interface EventTimeChangerProps
  extends Pick<
    UseFormReturn<CreateEventData>,
    "control" | "getValues" | "setValue" | "register"
  > {
  dirtyFields: UseFormReturn<CreateEventData>["formState"]["dirtyFields"];
  event?: Event.AsObject;
  errors: UseFormReturn<CreateEventData>["formState"]["errors"];
}

function toPlainDateTime(
  timestamp: Timestamp.AsObject,
): Temporal.PlainDateTime {
  const legacyDate = timestamp2Date(timestamp);
  const instant = Temporal.Instant.fromEpochMilliseconds(legacyDate.getTime());
  // FIXME(#8064): Event times should be interpreted in their timezones.
  const zoned = instant.toZonedDateTimeISO(Temporal.Now.timeZoneId());
  return zoned.toPlainDateTime();
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

  const defaultStartDateTime = event?.startTime
    ? toPlainDateTime(event.startTime)
    : undefined;
  const defaultEndDateTime = event?.endTime
    ? toPlainDateTime(event.endTime)
    : undefined;

  const handleStartDateChange = (value: Temporal.PlainDate) => {
    setValue("startDate", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleEndDateChange = (value: Temporal.PlainDate) => {
    setValue("endDate", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleStartTimeChange = (value: Temporal.PlainTime) => {
    setValue("startTime", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleEndTimeChange = (value: Temporal.PlainTime) => {
    setValue("endTime", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <>
      <StyledContainer>
        <Datepicker
          control={control}
          defaultValue={defaultStartDateTime?.toPlainDate()}
          error={!!errors.startDate?.message}
          helperText={errors.startDate?.message}
          id="startDate"
          label={t("communities:start_date")}
          name="startDate"
          onPostChange={handleStartDateChange}
          rules={{
            required: t("communities:date_required"),
            validate: (startDate: Temporal.PlainDate) => {
              // Only disable validation temporarily if `event` exists/in the edit event context
              if (event && !dirtyFields.startDate) {
                return true;
              }
              return (
                Temporal.PlainDate.compare(
                  startDate,
                  Temporal.Now.plainDateISO(),
                ) >= 0 || t("communities:past_date_error")
              );
            },
          }}
          testId="startDate"
        />

        <Timepicker
          control={control}
          name="startTime"
          onPostChange={handleStartTimeChange}
          defaultValue={defaultStartDateTime?.toPlainTime()}
          rules={{
            required: t("communities:time_required"),
            pattern: {
              message: t("communities:invalid_time"),
              value: timePattern,
            },
            validate: (startTime: Temporal.PlainTime) => {
              if (event && !dirtyFields.startTime) {
                return true;
              }

              const startDate = getValues("startDate");
              if (!startDate) {
                return t("communities:date_required");
              }

              if (!startTime) {
                return t("communities:time_required");
              }

              const startDateTime = startDate.toPlainDateTime(startTime);
              return (
                Temporal.PlainDateTime.compare(
                  startDateTime,
                  Temporal.Now.plainDateTimeISO(),
                ) >= 0 || t("communities:past_time_error")
              );
            },
          }}
          id="startTime"
          label={t("communities:start_time")}
          error={!!errors.startTime?.message}
          helperText={errors.startTime?.message || ""}
          testId="startTime"
        />
      </StyledContainer>
      <StyledContainer>
        <Datepicker
          control={control}
          defaultValue={defaultEndDateTime?.toPlainDate()}
          error={!!errors.endDate?.message}
          helperText={errors.endDate?.message || ""}
          id="endDate"
          label={t("communities:end_date")}
          name="endDate"
          rules={{
            required: t("communities:date_required"),
            validate: (endDate: Temporal.PlainDate) => {
              if (event && !dirtyFields.endDate) {
                return true;
              }

              const startDate = getValues("startDate");
              if (
                startDate &&
                Temporal.PlainDate.compare(endDate, startDate) < 0
              ) {
                return t("communities:end_date_error");
              }

              return (
                Temporal.PlainDate.compare(
                  endDate,
                  Temporal.Now.plainDateISO(),
                ) >= 0 || t("communities:past_date_error")
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
          defaultValue={defaultEndDateTime?.toPlainTime()}
          rules={{
            required: t("communities:time_required"),
            pattern: {
              message: t("communities:invalid_time"),
              value: timePattern,
            },
            validate: (endTime: Temporal.PlainTime) => {
              if (event && !dirtyFields.endTime) {
                return true;
              }

              const startTime = getValues("startTime");
              const startDate = getValues("startDate");
              const endDate = getValues("endDate");

              if (!startTime || !endTime) {
                return t("communities:time_required");
              }

              if (!startDate || !endDate) {
                return t("communities:date_required");
              }

              const startDateTime = startDate.toPlainDateTime(startTime);
              const endDateTime = endDate.toPlainDateTime(endTime);
              if (
                Temporal.PlainDateTime.compare(endDateTime, startDateTime) <= 0
              ) {
                return t("communities:end_time_error");
              }

              return (
                Temporal.PlainDateTime.compare(
                  endDateTime,
                  Temporal.Now.plainDateTimeISO(),
                ) >= 0 || t("communities:past_time_error")
              );
            },
          }}
          id="endTime"
          label={t("communities:end_time")}
          error={!!errors.endTime?.message}
          helperText={errors.endTime?.message || ""}
          testId="endTime"
        />
      </StyledContainer>
    </>
  );
}
