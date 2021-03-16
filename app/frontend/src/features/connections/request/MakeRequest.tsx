import {
  CardActions,
  FormControlLabel,
  makeStyles,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Typography,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import Datepicker from "components/Date/Datepicker";
import TextField from "components/TextField";
import {
  ARRIVAL_DATE,
  DEPARTURE_DATE,
  MEETUP_ONLY,
  OVERNIGHT_STAY,
  REQUEST,
  REQUEST_DESCRIPTION,
  SEND,
  sendRequest,
} from "features/constants";
import { User } from "pb/api_pb";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";

const useStyles = makeStyles((theme) => ({
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

interface MakeRequestProps {
  user: User.AsObject;
}

type RequestInputs = {
  type: string;
  arrivalDate: string;
  isFlexibleArrival: boolean;
  departureDate: string;
  isFlexibleDeparture: boolean;
  numberOfVisitors: number;
  requestMessage: string;
};

export default function MakeRequest({ user }: MakeRequestProps) {
  const classes = useStyles();
  const today = new Date();
  const isPostBetaEnabled = process.env.REACT_APP_IS_POST_BETA_ENABLED;
  const [mutationError] = useState("");
  const [numVisitors, setNumVisitors] = useState(1);
  const [selectedArrivalDate, setSelectedArrivalDate] = useState(today);
  const [selectedDepartureDate, setSelectedDepartureDate] = useState(today);

  const { control, handleSubmit, register } = useForm<RequestInputs>({
    mode: "onBlur",
    shouldUnregister: false,
  });

  const guests = Array.from({ length: 8 }, (_, i) => {
    const num = i + 1;
    return (
      <MenuItem key={num} value={num} ref={register}>
        {num}
      </MenuItem>
    );
  });

  const send = handleSubmit(async (data: RequestInputs) => {
    console.log(data);
    return;
  });

  return (
    <div>
      <Typography variant="h1" className={classes.title}>
        {sendRequest(user.name)}
      </Typography>
      <form onSubmit={send}>
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
            label={ARRIVAL_DATE}
            minDate={today}
            selectedDate={selectedArrivalDate}
            setSelectedDate={setSelectedArrivalDate}
          />
          <Datepicker
            className={classes.date}
            label={DEPARTURE_DATE}
            minDate={selectedArrivalDate}
            selectedDate={selectedDepartureDate}
            setSelectedDate={setSelectedDepartureDate}
          />
          {isPostBetaEnabled && (
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={numVisitors}
              onChange={(event) => setNumVisitors(Number(event.target.value))}
            >
              {guests}
            </Select>
          )}
        </div>
        <TextField
          className={classes.requestField}
          id="request-field"
          label={REQUEST}
          name="text"
          rows={6}
          multiline
          fullWidth
          placeholder={REQUEST_DESCRIPTION}
        />
        <CardActions className={classes.send}>
          <Button onClick={send}>{SEND}</Button>
        </CardActions>
      </form>
      {mutationError && <Alert severity="error">{mutationError}</Alert>}
    </div>
  );
}
