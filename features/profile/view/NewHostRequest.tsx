import {
  CardActions,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import Button from "components/Button";
import Datepicker from "components/Datepicker";
import TextField from "components/TextField";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { useUser } from "features/userQueries/useUsers";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import { CreateHostRequestWrapper } from "service/requests";
import { isSameOrFutureDate } from "utils/date";
import dayjs from "utils/dayjs";

const useStyles = makeStyles((theme) => ({
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    paddingTop: theme.spacing(1),
  },
  form: {
    "& > *": {
      marginTop: theme.spacing(2),
    },
  },
  title: {
    marginBottom: theme.spacing(1),
  },
  request: {
    display: "flex",
    flexDirection: "row",
  },
  date: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
  },
  requestField: {
    marginTop: theme.spacing(2),
  },
  send: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(2),
  },
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
  const classes = useStyles();
  const isPostBetaEnabled = process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED;
  const [numVisitors, setNumVisitors] = useState(1);
  const user = useProfileUser();

  const {
    control,
    errors,
    getValues,
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<CreateHostRequestWrapper>({
    defaultValues: { hostUserId: user.userId },
  });

  useEffect(() => register("hostUserId"));

  const { error, mutate } = useMutation<
    number,
    RpcError,
    CreateHostRequestWrapper
  >(
    (data: CreateHostRequestWrapper) =>
      service.requests.createHostRequest(data),
    {
      onSuccess: () => {
        setIsRequesting(false);
        setIsRequestSuccess(true);
      },
    }
  );

  const { isLoading: hostLoading, error: hostError } = useUser(user.userId);

  const onSubmit = handleSubmit((data) => mutate(data));

  const guests = Array.from({ length: 8 }, (_, i) => {
    const num = i + 1;
    return (
      <MenuItem key={num} value={num} ref={register}>
        {num}
      </MenuItem>
    );
  });

  const watchFromDate = watch("fromDate", dayjs());
  useEffect(() => {
    if (isSameOrFutureDate(watchFromDate, getValues("toDate"))) {
      setValue("toDate", watchFromDate.add(1, "day"));
    }
  });

  return (
    <>
      <Typography variant="h1">
        {hostLoading ? (
          <Skeleton width="100" />
        ) : (
          t("profile:request_form.send_request", { name: user.name })
        )}
      </Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {hostError ? (
        <Alert severity={"error"}>{hostError}</Alert>
      ) : (
        <form onSubmit={onSubmit}>
          <div className={classes.request}>
            {isPostBetaEnabled && (
              <Controller
                name="stayType"
                control={control}
                defaultValue={1}
                render={({ onChange, value }) => (
                  <RadioGroup
                    aria-label={t("profile:request_form.stay_type_a11y_text")}
                    name="stay-radio"
                    value={value}
                    onChange={(value) => onChange(value)}
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
            <Datepicker
              control={control}
              error={
                //@ts-ignore Dayjs type breaks this
                !!errors.fromDate
              }
              helperText={
                //@ts-ignore
                errors?.fromDate?.message
              }
              id="from-date"
              label={t("profile:request_form.arrival_date")}
              name="fromDate"
            />
            <Datepicker
              className={classes.date}
              control={control}
              error={!!errors.toDate}
              helperText={
                //@ts-ignore
                errors?.toDate?.message
              }
              id="to-date"
              label={t("profile:request_form.departure_date")}
              minDate={watchFromDate.add(1, "day").toDate()}
              name="toDate"
            />
            {isPostBetaEnabled && (
              <Select
                name="visitorCount"
                value={numVisitors}
                onChange={(event) => setNumVisitors(Number(event.target.value))}
              >
                {guests}
              </Select>
            )}
          </div>
          <TextField
            id="text"
            className={classes.requestField}
            label={t("profile:request_form.request")}
            name="text"
            minRows={6}
            inputRef={register}
            multiline
            fullWidth
            placeholder={t("profile:request_form.request_description")}
          />
          <CardActions className={classes.send}>
            <Button onClick={() => setIsRequesting(false)}>
              {t("global:cancel")}
            </Button>
            <Button type="submit" onClick={onSubmit}>
              {t("global:send")}
            </Button>
          </CardActions>
        </form>
      )}
    </>
  );
}
