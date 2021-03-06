import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { useUser } from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { CreateHostRequestReq } from "pb/requests_pb";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { routeToHostRequest } from "routes";
import { service } from "service/index";
import { firstName } from "utils/names";
import { validateFutureDate } from "utils/validation";

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
}));

export default function NewHostRequest() {
  const classes = useStyles();

  const userId = +useParams<{ userId: string }>().userId;

  const { data: host, isLoading: hostLoading, error: hostError } = useUser(
    userId
  );
  const title = host
    ? `Request to be hosted by ${firstName(host.name)}`
    : undefined;

  const { register, handleSubmit, errors: formErrors } = useForm<
    Required<CreateHostRequestReq.AsObject>
  >({ defaultValues: { toUserId: userId } });

  useEffect(() => register("toUserId"));

  const history = useHistory();

  const mutation = useMutation<
    number,
    GrpcError,
    Required<CreateHostRequestReq.AsObject>
  >(
    (data: Required<CreateHostRequestReq.AsObject>) =>
      service.requests.createHostRequest(data),
    {
      onSuccess: (hostRequestId) => {
        history.push(routeToHostRequest(hostRequestId));
      },
    }
  );

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

  const dateValidate = (stringDate: string) =>
    validateFutureDate(stringDate) || "Must be a valid date in the future.";

  return (
    <Box>
      <Typography variant="h1">
        {hostLoading ? <Skeleton width="100" /> : title ?? null}
      </Typography>
      {mutation.error && (
        <Alert severity={"error"}>{mutation.error?.message}</Alert>
      )}
      {hostError ? (
        <Alert severity={"error"}>{hostError}</Alert>
      ) : (
        <form onSubmit={onSubmit} className={classes.form}>
          <TextField
            id="from-date"
            name="fromDate"
            label="Date from"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            inputRef={register({
              required: "Enter a from date",
              validate: dateValidate,
            })}
            helperText={formErrors?.fromDate?.message}
          />
          <TextField
            id="to-date"
            name="toDate"
            label="Date to"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            inputRef={register({
              required: "Enter a to date",
              validate: dateValidate,
            })}
            helperText={formErrors?.toDate?.message}
          />
          <TextField
            id="host-request-message"
            label="Message"
            name="text"
            defaultValue={""}
            inputRef={register({ required: "Enter a request message" })}
            rows={4}
            rowsMax={6}
            multiline
            fullWidth
          />
          <Box className={classes.buttonContainer}>
            <Button
              type="submit"
              color="primary"
              onClick={onSubmit}
              loading={mutation.isLoading}
            >
              Send
            </Button>
          </Box>
        </form>
      )}
    </Box>
  );
}
