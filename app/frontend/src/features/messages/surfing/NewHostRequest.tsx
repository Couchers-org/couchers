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
import Datepicker from "components/Date/Datepicker";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import {
  ARRIVAL_DATE,
  CANCEL,
  DEPARTURE_DATE,
  MEETUP_ONLY,
  OVERNIGHT_STAY,
  REQUEST,
  REQUEST_DESCRIPTION,
  SEND,
  sendRequest,
  SEND_REQUEST_SUCCESS,
} from "features/constants";
import { useUser } from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { User } from "pb/api_pb";
import { CreateHostRequestReq } from "pb/requests_pb";
import { send } from "process";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { routeToHostRequest } from "routes";
import { service } from "service/index";
import { firstName } from "utils/names";

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
  setIsRequesting: Dispatch<SetStateAction<boolean>>;
  user: User.AsObject;
}

export default function NewHostRequest({
  setIsRequesting,
  user,
}: NewHostRequestProps) {
  const classes = useStyles();
  const today = new Date();
  const isPostBetaEnabled = process.env.REACT_APP_IS_POST_BETA_ENABLED;
  const [numVisitors, setNumVisitors] = useState(1);
  const [selectedArrivalDate, setSelectedArrivalDate] = useState(today);
  const [selectedDepartureDate, setSelectedDepartureDate] = useState(today);

  const { control, register, handleSubmit } = useForm<
    Required<CreateHostRequestReq.AsObject>
  >({ defaultValues: { toUserId: user.userId } });

  const { error, isSuccess, mutate } = useMutation<
    number,
    GrpcError,
    Required<CreateHostRequestReq.AsObject>
  >((data: Required<CreateHostRequestReq.AsObject>) =>
    service.requests.createHostRequest(data)
  );

  const { isLoading: hostLoading, error: hostError } = useUser(user.userId);

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    return mutate(data);
  });

  const guests = Array.from({ length: 8 }, (_, i) => {
    const num = i + 1;
    return (
      <MenuItem key={num} value={num} ref={register}>
        {num}
      </MenuItem>
    );
  });

  return (
    <>
      <Typography variant="h1">
        {hostLoading ? (
          <Skeleton width="100" />
        ) : (
          sendRequest(user.name) ?? null
        )}
      </Typography>
      {error && <Alert severity={"error"}>{error.message}</Alert>}
      {isSuccess && <Alert severity={"success"}>{SEND_REQUEST_SUCCESS}</Alert>}
      {hostError ? (
        <Alert severity={"error"}>{hostError}</Alert>
      ) : (
        <div>
          <form onSubmit={onSubmit}>
            <div className={classes.request}>
              {isPostBetaEnabled && (
                <Controller
                  name="stayType"
                  control={control}
                  defaultValue={1}
                  render={({ onChange, value }) => (
                    <RadioGroup
                      aria-label="stay type"
                      name="stay-radio"
                      value={value}
                      onChange={(value) => onChange(value)}
                    >
                      <FormControlLabel
                        value={OVERNIGHT_STAY}
                        control={<Radio />}
                        label={OVERNIGHT_STAY}
                      />
                      <FormControlLabel
                        value={MEETUP_ONLY}
                        control={<Radio />}
                        label={MEETUP_ONLY}
                      />
                    </RadioGroup>
                  )}
                />
              )}
              <Datepicker
                name="fromDate"
                label={ARRIVAL_DATE}
                minDate={today}
                selectedDate={selectedArrivalDate}
                setSelectedDate={setSelectedArrivalDate}
              />
              <Datepicker
                name="toDate"
                className={classes.date}
                label={DEPARTURE_DATE}
                minDate={selectedArrivalDate}
                selectedDate={selectedDepartureDate}
                setSelectedDate={setSelectedDepartureDate}
              />
              {isPostBetaEnabled && (
                <Select
                  name="visitorCount"
                  value={numVisitors}
                  onChange={(event) =>
                    setNumVisitors(Number(event.target.value))
                  }
                >
                  {guests}
                </Select>
              )}
            </div>
            <TextField
              id="text"
              className={classes.requestField}
              label={REQUEST}
              name="text"
              rows={6}
              multiline
              fullWidth
              placeholder={REQUEST_DESCRIPTION}
            />
            <CardActions className={classes.send}>
              <Button onClick={() => setIsRequesting(false)}>{CANCEL}</Button>
              <Button type="submit" onClick={onSubmit}>
                {SEND}
              </Button>
            </CardActions>
          </form>
        </div>
      )}
    </>
  );
}
