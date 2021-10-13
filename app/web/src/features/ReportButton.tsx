import {
  darken,
  Link,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
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
import Snackbar from "components/Snackbar";
import TextField from "components/TextField";
import {
  BUG_DESCRIPTION_HELPER,
  BUG_DESCRIPTION_NAME,
  BUG_REPORT_SUCCESS,
  CANCEL,
  EXPECT_HELPER,
  EXPECT_NAME,
  PROBLEM_HELPER,
  PROBLEM_NAME,
  REPORT,
  REPORT_BUG_BUTTON,
  REPORT_CONTENT_BUTTON,
  REPORT_CONTENT_EMAIL,
  REPORT_CONTENT_MESSAGE,
  SUBMIT,
  WARNING,
} from "features/constants";
import { Error as GrpcError } from "grpc-web";
import { ReportBugRes } from "proto/bugs_pb";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import makeStyles from "utils/makeStyles";

export interface BugReportFormData {
  subject: string;
  description: string;
  results: string;
}

const useStyles = makeStyles((theme) => ({
  button: {
    flexShrink: 0,
    "&:hover": {
      backgroundColor: darken(theme.palette.error.main, 0.1),
    },
    backgroundColor: theme.palette.error.main,
  },
  typeButton: {
    display: "block",
    margin: "0 auto",
    "& + &": {
      marginBlockStart: theme.spacing(2),
    },
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

export default function ReportButton({
  isResponsive = true,
}: {
  isResponsive?: boolean;
}) {
  const theme = useTheme();
  const isBelowMd = useMediaQuery(theme.breakpoints.down("sm"));

  const classes = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"initial" | "bug" | "content">("initial");
  const {
    register,
    handleSubmit,
    reset: resetForm,
  } = useForm<BugReportFormData>();
  const {
    data: bug,
    error,
    isLoading,
    mutate: reportBug,
    reset: resetMutation,
  } = useMutation<ReportBugRes.AsObject, GrpcError, BugReportFormData>(
    (formData) => service.bugs.reportBug(formData),
    {
      onSuccess: () => {
        setIsOpen(false);
      },
    }
  );

  const handleClose = (
    event: {},
    reason: "backdropClick" | "escapeKeyDown" | "button"
  ) => {
    if (reason !== "button") return;
    resetForm();
    resetMutation();
    setIsOpen(false);
    setTimeout(
      () => setType("initial"),
      theme.transitions.duration.leavingScreen
    );
  };

  const onSubmit = handleSubmit((data) => {
    reportBug(data);
  });

  return (
    <>
      {bug && (
        <Snackbar severity="success">
          <>
            {BUG_REPORT_SUCCESS}
            <Link href={bug.bugUrl}>{bug.bugId}</Link>.
          </>
        </Snackbar>
      )}
      <Button
        aria-label={REPORT}
        onClick={() => setIsOpen(true)}
        startIcon={<BugIcon />}
        variant="contained"
        color="primary"
        classes={{
          containedPrimary: classes.button,
          startIcon: classes.startIcon,
        }}
      >
        {(!isResponsive || !isBelowMd) && REPORT}
      </Button>
      <Dialog
        aria-labelledby="bug-reporter"
        open={isOpen}
        onClose={handleClose}
      >
        <DialogTitle id="bug-reporter">{REPORT}</DialogTitle>
        {type === "initial" ? (
          <>
            <DialogContent>
              <Button
                onClick={() => setType("bug")}
                className={classes.typeButton}
              >
                {REPORT_BUG_BUTTON}
              </Button>
              <Button
                onClick={() => setType("content")}
                className={classes.typeButton}
              >
                {REPORT_CONTENT_BUTTON}
              </Button>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => handleClose({}, "button")}
                variant="outlined"
              >
                {CANCEL}
              </Button>
            </DialogActions>
          </>
        ) : type === "content" ? (
          <>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {REPORT_CONTENT_MESSAGE}
              </Typography>
              <Link href={`mailto:${REPORT_CONTENT_EMAIL}`}>
                {REPORT_CONTENT_EMAIL}
              </Link>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => handleClose({}, "button")}
                variant="outlined"
              >
                {CANCEL}
              </Button>
            </DialogActions>
          </>
        ) : type === "bug" ? (
          <form onSubmit={onSubmit}>
            <DialogContent>
              {error && <Alert severity="error">{error.message}</Alert>}
              <DialogContentText>{WARNING}</DialogContentText>
              <TextField
                id="bug-report-subject"
                className={classes.field}
                label={BUG_DESCRIPTION_NAME}
                helperText={BUG_DESCRIPTION_HELPER}
                name="subject"
                inputRef={register({ required: true })}
                fullWidth
              />
              <TextField
                className={classes.field}
                id="bug-report-description"
                label={PROBLEM_NAME}
                helperText={PROBLEM_HELPER}
                name="description"
                inputRef={register({ required: true })}
                fullWidth
                multiline
                minRows={4}
                maxRows={6}
              />
              <TextField
                className={classes.field}
                id="bug-report-results"
                defaultValue=""
                label={EXPECT_NAME}
                helperText={EXPECT_HELPER}
                name="results"
                inputRef={register}
                fullWidth
                multiline
                minRows={4}
                maxRows={6}
              />
            </DialogContent>
            <DialogActions>
              <Button type="submit" loading={isLoading} onClick={onSubmit}>
                {SUBMIT}
              </Button>
              <Button
                onClick={() => handleClose({}, "button")}
                variant="outlined"
              >
                {CANCEL}
              </Button>
            </DialogActions>
          </form>
        ) : null}
      </Dialog>
    </>
  );
}
