import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import React, { useEffect } from "react";
import { useMutation } from "react-query";
import Alert from "../../../components/Alert";
import { CreateHostRequestReq } from "../../../pb/requests_pb";
import { service } from "../../../service";
import { useUser } from "../../userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { useHistory, useParams } from "react-router-dom";
import { firstName } from "../../../utils/names";
import { useForm } from "react-hook-form";
import TextField from "../../../components/TextField";
import { validateFutureDate } from "../../../utils/validation";
import Button from "../../../components/Button";
import { messagesRoute } from "../../../AppRoutes";

const useStyles = makeStyles({ root: {} });

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
      onMutate: console.log,
      onError: console.log,
      onSuccess: (hostRequestId) => {
        console.log(hostRequestId);
        history.push(`${messagesRoute}/request/${hostRequestId}`);
      },
    }
  );

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

  const dateValidate = (stringDate: string) =>
    validateFutureDate(stringDate) || "Must be a valid date in the future.";

  return (
    <Box className={classes.root}>
      <Typography variant="h3">
        {hostLoading ? <Skeleton width="100" /> : title ?? null}
      </Typography>
      {mutation.error && (
        <Alert severity={"error"}>{mutation.error?.message}</Alert>
      )}
      {hostError ? (
        <Alert severity={"error"}>{hostError}</Alert>
      ) : (
        <form onSubmit={onSubmit}>
          <TextField
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
            label="Message"
            name="text"
            defaultValue={""}
            inputRef={register({ required: "Enter a request message" })}
            rows={4}
            rowsMax={6}
            variant="outlined"
            multiline
            fullWidth
          />
          <Button
            type="submit"
            color="primary"
            onClick={onSubmit}
            loading={mutation.isLoading}
          >
            Send
          </Button>
        </form>
      )}
    </Box>
  );
}
