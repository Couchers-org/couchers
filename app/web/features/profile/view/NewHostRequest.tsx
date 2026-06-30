import { CardActions, Skeleton, styled, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import Datepicker from "components/Datepicker";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import { createForegroundTracker } from "features/analytics/foregroundTracker";
import { useLogEvent } from "features/analytics/hooks";
import {
  readSearchReferrer,
  referrerToProperties,
} from "features/analytics/searchAttribution";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import React, { MutableRefObject, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { howToWriteRequestGuideUrl } from "routes";
import { service } from "service";
import { CreateHostRequestWrapper } from "service/requests";
import { theme } from "theme";
import { isSameOrFutureDate } from "utils/date";
import dayjs from "utils/dayjs";

const TYPING_GAP_CAP_MS = 3000;

interface FormValuesSnapshot {
  text: string;
  fromDate: dayjs.Dayjs | null;
  toDate: dayjs.Dayjs | null;
}

function isFormField(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA";
}

/**
 * Logs `host_request.form_closed` when the form unmounts (closed or submitted),
 * reporting engagement: time open and visible, time a field was focused, active
 * typing time and keystroke count, the final draft length and dates, whether it
 * was submitted, and any search referrer that led the user here.
 *
 * Runs once for the form's open/close lifecycle, so it reads the latest form
 * values and submitted flag from refs rather than re-subscribing on each change.
 */
function useHostRequestFormTracking({
  hostUserId,
  formRef,
  getSubmitted,
  getLatestValues,
}: {
  hostUserId: number;
  formRef: MutableRefObject<HTMLFormElement | null>;
  getSubmitted: () => boolean;
  getLatestValues: () => FormValuesSnapshot;
}) {
  const logEvent = useLogEvent();

  useEffect(() => {
    const tracker = createForegroundTracker();
    let focusAccumMs = 0;
    let focusSince: number | null = null;
    let activeTypingMs = 0;
    let lastKeystroke: number | null = null;
    let keystrokeCount = 0;

    const onFocusIn = (e: FocusEvent) => {
      if (!isFormField(e.target)) return;
      if (focusSince === null) focusSince = performance.now();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!isFormField(e.target)) return;
      if (focusSince !== null) {
        focusAccumMs += performance.now() - focusSince;
        focusSince = null;
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isFormField(e.target)) return;
      const now = performance.now();
      if (lastKeystroke !== null) {
        const gap = now - lastKeystroke;
        if (gap <= TYPING_GAP_CAP_MS) activeTypingMs += gap;
      }
      lastKeystroke = now;
      keystrokeCount += 1;
    };

    document.addEventListener("visibilitychange", tracker.onVisibilityChange);
    const formEl = formRef.current;
    formEl?.addEventListener("focusin", onFocusIn);
    formEl?.addEventListener("focusout", onFocusOut);
    formEl?.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        tracker.onVisibilityChange,
      );
      formEl?.removeEventListener("focusin", onFocusIn);
      formEl?.removeEventListener("focusout", onFocusOut);
      formEl?.removeEventListener("keydown", onKeyDown);

      if (focusSince !== null) focusAccumMs += performance.now() - focusSince;
      const { foregroundMs, totalMs } = tracker.finalize();

      const { text, fromDate, toDate } = getLatestValues();
      const referrerProps = referrerToProperties(
        readSearchReferrer(hostUserId),
      );

      logEvent("host_request.form_closed", {
        host_user_id: hostUserId,
        submitted: getSubmitted(),
        form_open_ms: foregroundMs,
        form_open_total_ms: totalMs,
        focus_ms: Math.round(focusAccumMs),
        active_typing_ms: Math.round(activeTypingMs),
        keystroke_count: keystrokeCount,
        text_length: text.length,
        from_date: fromDate ? fromDate.format("YYYY-MM-DD") : null,
        to_date: toDate ? toDate.format("YYYY-MM-DD") : null,
        ...referrerProps,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const StyledTitle = styled(Typography)(() => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledRequestRow = styled("div")(() => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
}));

const StyledDateRow = styled("div")(() => ({
  marginTop: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  width: "72%",
}));

const StyledDatepicker = styled(Datepicker)(() => ({
  marginBottom: theme.spacing(2),
}));

const StyledHelpText = styled(Typography)(() => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledRequestField = styled(TextField)(() => ({
  marginTop: theme.spacing(2),
}));

const StyledSendActions = styled(CardActions)(() => ({
  display: "flex",
  justifyContent: "flex-end",
  marginTop: theme.spacing(2),
}));

const MIN_LENGTH = 250; // Must match backend

interface NewHostRequestProps {
  setIsRequestSuccess: (value: boolean) => void;
  setIsRequesting: (value: boolean) => void;
}

export default function NewHostRequest({
  setIsRequestSuccess,
  setIsRequesting,
}: NewHostRequestProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();

  const {
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateHostRequestWrapper>({
    defaultValues: { hostUserId: user.userId },
  });

  const textField = watch("text") ?? "";

  const formRef = useRef<HTMLFormElement | null>(null);
  const submittedRef = useRef(false);
  const latestValuesRef = useRef<FormValuesSnapshot>({
    text: "",
    fromDate: null,
    toDate: null,
  });
  latestValuesRef.current = {
    text: watch("text") ?? "",
    fromDate: watch("fromDate") ?? null,
    toDate: watch("toDate") ?? null,
  };

  useHostRequestFormTracking({
    hostUserId: user.userId,
    formRef,
    getSubmitted: () => submittedRef.current,
    getLatestValues: () => latestValuesRef.current,
  });

  const { error, mutate } = useMutation({
    mutationFn: (data: CreateHostRequestWrapper) => {
      return service.requests.createHostRequest(data);
    },

    onSuccess: () => {
      submittedRef.current = true;
      reset();
      setIsRequesting(false);
      setIsRequestSuccess(true);
    },
  });

  const { isLoading: hostLoading, error: hostError } = useLiteUser(user.userId);

  const onSubmit = handleSubmit((data) => {
    mutate(data);
  });

  const hostToday = user.timezone
    ? dayjs().tz(user.timezone).startOf("day")
    : dayjs().startOf("day");

  const watchFromDate = watch("fromDate", undefined);
  const arrivalBeforeHostToday =
    !!watchFromDate && dayjs(watchFromDate).isBefore(hostToday);

  useEffect(() => {
    if (
      watchFromDate &&
      getValues("toDate") &&
      isSameOrFutureDate(watchFromDate, getValues("toDate"))
    ) {
      setValue("toDate", watchFromDate.add(1, "day"));
    }
  });

  return (
    <>
      <StyledTitle variant="h1">
        {hostLoading ? (
          <Skeleton width="100" />
        ) : (
          t("profile:request_form.send_request", { name: user.name })
        )}
      </StyledTitle>
      {error && <Alert severity="error">{error.message}</Alert>}
      {hostError ? (
        <Alert severity={"error"}>{hostError?.message}</Alert>
      ) : (
        <form onSubmit={onSubmit} ref={formRef}>
          <StyledRequestRow>
            <StyledDateRow>
              <StyledDatepicker
                control={control}
                error={!!errors.fromDate}
                helperText={errors?.fromDate?.message}
                id="from-date"
                label={t("profile:request_form.arrival_date")}
                name="fromDate"
                defaultValue={null}
                minDate={hostToday}
                rules={{
                  required: t("profile:request_form.arrival_date_empty"),
                  validate: {
                    notEmpty: (date) => !date || date !== "",
                    notBeforeHostToday: (date) =>
                      !date ||
                      !dayjs(date).isBefore(hostToday) ||
                      t("profile:request_form.arrival_date_before_host_today", {
                        name: user.name,
                      }),
                  },
                }}
              />
              {arrivalBeforeHostToday && (
                <Alert severity="error">
                  {t("profile:request_form.arrival_date_before_host_today", {
                    name: user.name,
                  })}
                </Alert>
              )}
              <StyledDatepicker
                control={control}
                error={!!errors.toDate}
                helperText={errors?.toDate?.message}
                id="to-date"
                label={t("profile:request_form.departure_date")}
                minDate={watchFromDate ? watchFromDate.add(1, "day") : dayjs()}
                name="toDate"
                defaultValue={null}
                rules={{
                  required: t("profile:request_form.departure_date_empty"),
                  validate: (stringDate) => stringDate !== "",
                }}
              />
            </StyledDateRow>
          </StyledRequestRow>
          <StyledHelpText variant="body1">
            <Trans
              i18nKey="profile:request_form.guide_link_help_text"
              components={{
                0: <StyledLink variant="body1" href={howToWriteRequestGuideUrl} />,
              }}
            />
          </StyledHelpText>

          <StyledRequestField
            id="text"
            {...register("text", {
              required: t("profile:request_form.request_description_empty"),
              minLength: {
                value: MIN_LENGTH,
                message: t("profile:request_form.request_chars_remaining", {
                  count: MIN_LENGTH - textField.length,
                }),
              },
            })}
            label={t("profile:request_form.request")}
            minRows={6}
            multiline
            fullWidth
            placeholder={t("profile:request_form.request_description")}
            error={!!errors.text}
            helperText={
              errors.text?.message
                ? errors.text.message
                : MIN_LENGTH - textField.length > 0
                  ? t("profile:request_form.request_chars_remaining", {
                      count: MIN_LENGTH - textField.length,
                    })
                  : ""
            }
          />
          <StyledSendActions>
            <Button onClick={() => setIsRequesting(false)} variant="outlined">
              {t("global:cancel")}
            </Button>
            <Button type="submit" onClick={onSubmit}>
              {t("global:send")}
            </Button>
          </StyledSendActions>
        </form>
      )}
    </>
  );
}
