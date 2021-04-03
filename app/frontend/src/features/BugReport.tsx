import { darken, makeStyles, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import { BugIcon } from "components/Icons";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import {
  BUG_DESCRIPTION,
  EXPECT,
  PROBLEM,
  REPORT,
  STEPS,
  SUBMIT,
  WARNING,
} from "features/constants";
import { Error as GrpcError } from "grpc-web";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";

export interface BugReportFormData {
  subject: string;
  description: string;
  steps: string;
  results: string;
}

const useStyles = makeStyles((theme) => ({
  button: {
    "&:hover": {
      backgroundColor: darken(theme.palette.error.main, 0.1),
    },
    backgroundColor: theme.palette.error.main,
  },
  field: {
    "& + &": {
      marginBlockStart: theme.spacing(2),
    },
  },
  startIcon: {
    [theme.breakpoints.down("sm")]: {
      margin: 0,
    },
  },
}));

export default function BugReport() {
  const theme = useTheme();
  const isBelowMd = useMediaQuery(theme.breakpoints.down("sm"));

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
    isLoading,
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
    reportBug(data);
  });

  return (
    <>
      <Button
        aria-label="Report a bug"
        onClick={() => setIsOpen(true)}
        startIcon={<BugIcon />}
        variant="contained"
        color="primary"
        classes={{
          containedPrimary: classes.button,
          startIcon: classes.startIcon,
        }}
      >
        {!isBelowMd && REPORT}
      </Button>
      <Dialog
        aria-labelledby="bug-reporter"
        open={isOpen}
        onClose={handleClose}
      >
        <form onSubmit={onSubmit}>
          <DialogTitle id="bug-reporter">{REPORT}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error">{error.message}</Alert>}
            {reportIdentifier && (
              <Alert severity="success">
                {`Thank you for reporting that bug and making Couchers better, a
                report was sent to the devs! The bug ID is ${reportIdentifier}`}
              </Alert>
            )}
            <DialogContentText>{WARNING}</DialogContentText>
            <TextField
              id="bug-report-subject"
              className={classes.field}
              label={BUG_DESCRIPTION}
              name="subject"
              inputRef={register({ required: true })}
              fullWidth
            />
            <TextField
              className={classes.field}
              id="bug-report-description"
              label={PROBLEM}
              name="description"
              inputRef={register({ required: true })}
              fullWidth
              multiline
              rows={4}
              rowsMax={6}
            />
            <TextField
              className={classes.field}
              id="bug-report-steps"
              defaultValue=""
              label={STEPS}
              name="steps"
              inputRef={register}
              fullWidth
              multiline
              rows={4}
              rowsMax={6}
            />
            <TextField
              className={classes.field}
              id="bug-report-results"
              defaultValue=""
              label={EXPECT}
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
              loading={isLoading}
              onClick={onSubmit}
            >
              {SUBMIT}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
