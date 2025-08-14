import {
  CardActions,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  styled,
  Typography,
} from "@mui/material";
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
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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

interface NewHostRequestProps {
  setIsRequestSuccess: (value: boolean) => void;
  setIsRequesting: (value: boolean) => void;
}

export default function NewHostRequest({
  setIsRequestSuccess,
  setIsRequesting,
}: NewHostRequestProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const isPostBetaEnabled = process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED;
  const [numVisitors, setNumVisitors] = useState(1);
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

  const guests = Array.from({ length: 8 }, (_, i) => {
    const num = i + 1;
    return (
      <MenuItem key={num} value={num}>
        {num}
      </MenuItem>
    );
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
            {isPostBetaEnabled && (
              <Controller
                name="stayType"
                control={control}
                defaultValue={1}
                render={({ field }) => (
                  <RadioGroup
                    {...field}
                    aria-label={t("profile:request_form.stay_type_a11y_text")}
                    name="stay-radio"
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                  >
                    <FormControlLabel
                      value={t("profile:request_form.overnight_stay")}
                      control={<Radio />}
                      label={t("profile:request_form.overnight_stay")}
                    />
                    <FormControlLabel
                      value={t("profile:request_form.meetup_only")}
                      control={<Radio />}
                      label={t("profile:request_form.meetup_only")}
                    />
                  </RadioGroup>
                )}
              />
            )}
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
              {isPostBetaEnabled && (
                <>
                  <InputLabel shrink>
                    {t("profile:request_form.guest_count")}
                  </InputLabel>
                  <Select
                    variant="standard"
                    name="visitorCount"
                    value={numVisitors}
                    onChange={(event) =>
                      setNumVisitors(Number(event.target.value))
                    }
                  >
                    {guests}
                  </Select>
                </>
              )}
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
                value: 250,
                message: t(
                  "profile:request_form.request_char_length_too_short",
                ),
              },
            })}
            label={t("profile:request_form.request")}
            minRows={6}
            multiline
            fullWidth
            placeholder={t("profile:request_form.request_description")}
            error={!!errors.text}
            helperText={errors.text?.message || ""}
            InputLabelProps={{ shrink: true }}
          />
          <StyledSendActions>
            <Button onClick={() => setIsRequesting(false)}>
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
