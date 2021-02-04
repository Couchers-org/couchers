import { makeStyles } from "@material-ui/core";
import { Error as GrpcError } from "grpc-web";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";

import Alert from "../components/Alert";
import Button from "../components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "../components/Dialog";
import { BugIcon } from "../components/Icons";
import TextField from "../components/TextField";
import { service } from "../service";
import { useAuthContext } from "./auth/AuthProvider";

export interface BugReportFormData {
  subject: string;
  description: string;
  steps: string;
  results: string;
}

const useStyles = makeStyles((theme) => ({
  field: {
    "& + &": {
      marginBlockStart: theme.spacing(2),
    },
  },
}));

export default function BugReport() {
  const classes = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset: resetForm,
  } = useForm<BugReportFormData>();
  const userId = useAuthContext().authState.userId;
  const {
    data: reportIdentifier,
    error,
    mutate: reportBug,
    reset: resetMutation,
  } = useMutation<string, GrpcError, BugReportFormData>((formData) =>
    service.bugs.reportBug(formData, userId)
  );

  const handleClose = () => {
    resetForm();
    resetMutation();
    setIsOpen(false);
  };

  const onSubmit = handleSubmit((data) => {
    // TODO: send bug report
    reportBug(data);
  });

  return (
    <>
      <Button onClick={() => setIsOpen(true)} startIcon={<BugIcon />}>
        Report a bug
      </Button>
      <Dialog
        aria-labelledby="bug-reporter"
        open={isOpen}
        onClose={handleClose}
      >
        <form onSubmit={onSubmit}>
          <DialogTitle id="bug-reporter">Report a problem</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error">{error.message}</Alert>}
            {reportIdentifier && (
              <Alert severity="success">
                Thank you for reporting that bug and making Couchers better, a
                report was sent to the devs! The bug ID is {reportIdentifier}
              </Alert>
            )}
            <DialogContentText>
              Please note that this information, as well as diagnostic
              information including which page you are on, what browser you are
              using, and your user ID will be saved to a public list of bugs.
            </DialogContentText>
            {/* {!!errors.length && (
                <Alert severity={"error"}>{errors.join("\n")}</Alert>
              )} */}
            <TextField
              className={classes.field}
              label="Brief description of the bug"
              name="subject"
              inputRef={register({ required: true })}
              fullWidth
            />
            <TextField
              className={classes.field}
              label="What's the problem?"
              name="description"
              inputRef={register({ required: true })}
              fullWidth
              multiline
              rows={4}
              rowsMax={6}
            />
            <TextField
              className={classes.field}
              defaultValue=""
              label="What did you do to trigger the bug?"
              name="steps"
              inputRef={register}
              fullWidth
              multiline
              rows={4}
              rowsMax={6}
            />
            <TextField
              className={classes.field}
              defaultValue=""
              label="What happened? What did you expect should have happened?"
              name="results"
              inputRef={register}
              fullWidth
              multiline
              rows={4}
              rowsMax={6}
            />
          </DialogContent>
          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={onSubmit}
            >
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
