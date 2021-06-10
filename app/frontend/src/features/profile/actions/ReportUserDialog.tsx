import { DialogProps } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import Snackbar from "components/Snackbar";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import type { ReportUserInput } from "service/user";
import makeStyles from "utils/makeStyles";

import {
  CANCEL,
  getReportDialogTitle,
  getReportUserExplainer,
  getReportUserSuccessMessage,
  REPORT_DETAILS,
  REPORT_REASON,
  SEND,
} from "../constants";
import { useProfileUser } from "../hooks/useProfileUser";

const REPORT_USER_DIALOG_LABEL_ID = "report-user-dialog-title";

type ReportUserFormData = Omit<ReportUserInput, "userId">;

const useStyles = makeStyles((theme) => ({
  textField: {
    "& + &": {
      marginBlockStart: theme.spacing(2),
    },
  },
}));

export default function ReportUserDialog({ onClose, open }: DialogProps) {
  const classes = useStyles();
  const { name, userId } = useProfileUser();
  const {
    handleSubmit,
    register,
    reset: resetForm,
  } = useForm<ReportUserFormData>();

  const {
    error,
    isLoading,
    isSuccess,
    mutate: reportUser,
    reset: resetMutation,
  } = useMutation<Empty, GrpcError, ReportUserFormData>(
    ({ description, reason }) =>
      service.user.reportUser({ description, reason, userId }),
    {
      onSuccess: () => {
        onClose?.({}, "escapeKeyDown");
      },
    }
  );

  const onSubmit = handleSubmit(({ description, reason }) => {
    reportUser({ description, reason });
  });

  return (
    <>
      {isSuccess && (
        <Snackbar severity="success">
          {getReportUserSuccessMessage(name)}
        </Snackbar>
      )}
      <Dialog aria-labelledby={REPORT_USER_DIALOG_LABEL_ID} open={open}>
        <form onSubmit={onSubmit}>
          <DialogTitle id={REPORT_USER_DIALOG_LABEL_ID}>
            {getReportDialogTitle(name)}
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error">{error.message}</Alert>}
            <DialogContentText>
              {getReportUserExplainer(name)}
            </DialogContentText>
            <TextField
              className={classes.textField}
              id="user-report-reason"
              inputRef={register({ required: true })}
              label={REPORT_REASON}
              name="reason"
              fullWidth
            />
            <TextField
              className={classes.textField}
              fullWidth
              id="user-report-details"
              inputRef={register({ required: true })}
              label={REPORT_DETAILS}
              multiline
              name="description"
              rows={4}
              rowsMax={4}
            />
          </DialogContent>
          <DialogActions>
            <Button loading={isLoading} onClick={onSubmit} type="submit">
              {SEND}
            </Button>
            <Button
              onClick={() => {
                resetForm();
                resetMutation();
                onClose?.({}, "escapeKeyDown");
              }}
            >
              {CANCEL}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
