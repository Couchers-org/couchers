import { CardActions, Skeleton, styled, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import Datepicker from "components/Datepicker";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import dayjs from "dayjs";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { howToWriteRequestGuideUrl } from "routes";
import { service } from "service";
import { CreateHostRequestWrapper } from "service/requests";
import { theme } from "theme";
import { isSameOrFutureDate } from "utils/date";

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
    defaultValues: { recipientUserId: user.userId },
  });

  const textField = watch("text") ?? "";

  const { error, mutate } = useMutation({
    mutationFn: (data: CreateHostRequestWrapper) => {
      return service.requests.createHostRequest(data);
    },

    onSuccess: () => {
      setIsRequesting(false);
      setIsRequestSuccess(true);
    },
  });

  const { isLoading: hostLoading, error: hostError } = useLiteUser(user.userId);

  const onSubmit = handleSubmit((data) => {
    mutate(data);
    reset();
  });

  const watchFromDate = watch("fromDate", undefined);
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
        <form onSubmit={onSubmit}>
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
                rules={{
                  required: t("profile:request_form.arrival_date_empty"),
                  validate: (stringDate) => stringDate !== "",
                }}
              />
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
            <Trans i18nKey="profile:request_form.guide_link_help_text">
              <StyledLink variant="body1" href={howToWriteRequestGuideUrl}>
                Read our guide
              </StyledLink>{" "}
              on how to write a request that will get accepted.
            </Trans>
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
