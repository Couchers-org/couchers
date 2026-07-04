import { styled } from "@mui/material";
import Datepicker from "components/Datepicker";
import Timepicker from "components/Timepicker";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Event } from "proto/events_pb";
import { UseFormReturn } from "react-hook-form";
import { theme } from "theme";
import {
  ISO8601_DATE_FORMAT,
  ISO8601_HOUR_MIN_FORMAT,
  iso8601ToDayjs,
  isSameOrFutureDate,
  timestamp2Date,
} from "utils/date";
import dayjs from "utils/dayjs";
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
    ? dayjs(timestamp2Date(event.startTime))
    : undefined;
  const defaultEndDateTime = event?.endTime
    ? dayjs(timestamp2Date(event.endTime))
    : undefined;

  const handleStartDateChange = (valueISO8601: string) => {
    setValue("startDateISO8601", valueISO8601, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleEndDateChange = (valueISO8601: string) => {
    setValue("endDateISO8601", valueISO8601, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleStartTimeChange = (valueISO8601: string) => {
    setValue("startTimeISO8601", valueISO8601, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleEndTimeChange = (valueISO8601: string) => {
    setValue("endTimeISO8601", valueISO8601, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <>
      <StyledContainer>
        <Datepicker
          control={control}
          defaultValueISO8601={defaultStartDateTime?.format(
            ISO8601_DATE_FORMAT,
          )}
          error={!!errors.startDateISO8601?.message}
          helperText={errors.startDateISO8601?.message}
          id="startDate"
          label={t("communities:start_date")}
          name="startDateISO8601"
          onPostChange={handleStartDateChange}
          rules={{
            required: t("communities:date_required"),
            validate: (valueISO8601: string) => {
              // Only disable validation temporarily if `event` exists/in the edit event context
              if (event && !dirtyFields.startDateISO8601) {
                return true;
              }
              return (
                isSameOrFutureDate(dayjs(valueISO8601), dayjs()) ||
                t("communities:past_date_error")
              );
            },
          }}
          testId="startDate"
        />

        <Timepicker
          control={control}
          name="startTimeISO8601"
          onPostChange={handleStartTimeChange}
          defaultValueISO8601={defaultStartDateTime?.format(
            ISO8601_HOUR_MIN_FORMAT,
          )}
          rules={{
            required: t("communities:time_required"),
            pattern: {
              message: t("communities:invalid_time"),
              value: timePattern,
            },
            validate: (valueISO8601: string) => {
              if (event && !dirtyFields.startTimeISO8601) {
                return true;
              }

              const startDateISO8601 = getValues("startDateISO8601");

              if (!startDateISO8601) {
                return t("communities:date_required");
              }

              if (!valueISO8601) {
                return t("communities:time_required");
              }

              const startDateTime = iso8601ToDayjs(
                startDateISO8601,
                valueISO8601,
              );

              return (
                startDateTime.isAfter(dayjs()) ||
                t("communities:past_time_error")
              );
            },
          }}
          id="startTime"
          label={t("communities:start_time")}
          error={!!errors.startTimeISO8601?.message}
          helperText={errors.startTimeISO8601?.message || ""}
          testId="startTime"
        />
      </StyledContainer>
      <StyledContainer>
        <Datepicker
          control={control}
          defaultValueISO8601={defaultEndDateTime?.format(ISO8601_DATE_FORMAT)}
          error={!!errors.endDateISO8601?.message}
          helperText={errors.endDateISO8601?.message || ""}
          id="endDate"
          label={t("communities:end_date")}
          name="endDateISO8601"
          rules={{
            required: t("communities:date_required"),
            validate: (valueISO8601: string) => {
              if (event && !dirtyFields.endDateISO8601) {
                return true;
              }

              const startDateISO8601 = getValues("startDateISO8601");
              if (dayjs(valueISO8601).isBefore(dayjs(startDateISO8601))) {
                return t("communities:end_date_error");
              }

              return (
                isSameOrFutureDate(dayjs(valueISO8601), dayjs()) ||
                t("communities:past_date_error")
              );
            },
          }}
          testId="endDate"
          onPostChange={handleEndDateChange}
        />

        <Timepicker
          control={control}
          name="endTimeISO8601"
          onPostChange={handleEndTimeChange}
          defaultValueISO8601={defaultEndDateTime?.format(
            ISO8601_HOUR_MIN_FORMAT,
          )}
          rules={{
            required: t("communities:time_required"),
            pattern: {
              message: t("communities:invalid_time"),
              value: timePattern,
            },
            validate: (valueISO8601: string) => {
              if (event && !dirtyFields.endTimeISO8601) {
                return true;
              }

              const startTimeISO8601 = getValues("startTimeISO8601");
              const startDateISO8601 = getValues("startDateISO8601");
              const endDateISO8601 = getValues("endDateISO8601");

              if (!startTimeISO8601 || !valueISO8601) {
                return t("communities:time_required");
              }

              if (!startDateISO8601 || !endDateISO8601) {
                return t("communities:date_required");
              }

              const startDateTime = iso8601ToDayjs(
                startDateISO8601,
                startTimeISO8601,
              );
              const endDateTime = iso8601ToDayjs(endDateISO8601, valueISO8601);

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
          error={!!errors.endTimeISO8601?.message}
          helperText={errors.endTimeISO8601?.message || ""}
          testId="endTime"
        />
      </StyledContainer>
    </>
  );
}
