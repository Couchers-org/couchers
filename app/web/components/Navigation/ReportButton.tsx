import {
  darken,
  Link,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import { supportEmail } from "appConstants";
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
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
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
  const { t } = useTranslation("global");
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
  } = useMutation<ReportBugRes.AsObject, RpcError, BugReportFormData>(
    (formData) => service.bugs.reportBug(formData),
    {
      onSuccess: () => {
        setIsOpen(false);
      },
    }
  );

  const handleClose = (
    event: unknown,
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
            {t("report.bug.success_message")}
            <StyledLink variant="body2" href={bug.bugUrl}>
              {bug.bugId}
            </StyledLink>
            .
          </>
        </Snackbar>
      )}
      <Button
        aria-label={t("report.label")}
        onClick={() => setIsOpen(true)}
        startIcon={<BugIcon />}
        variant="contained"
        color="primary"
        classes={{
          containedPrimary: classes.button,
          startIcon: classes.startIcon,
        }}
      >
        {(!isResponsive || !isBelowMd) && t("report.label")}
      </Button>
      <Dialog
        aria-labelledby="bug-reporter"
        open={isOpen}
        onClose={handleClose}
      >
        <DialogTitle id="bug-reporter">{t("report.label")}</DialogTitle>
        {type === "initial" ? (
          <>
            <DialogContent>
              <Button
                onClick={() => setType("bug")}
                className={classes.typeButton}
              >
                {t("report.bug.button_label")}
              </Button>
              <Button
                onClick={() => setType("content")}
                className={classes.typeButton}
              >
                {t("report.content.button_label")}
              </Button>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => handleClose({}, "button")}
                variant="outlined"
              >
                {t("cancel")}
              </Button>
            </DialogActions>
          </>
        ) : type === "content" ? (
          <>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {t("report.content.dialog_message")}
              </Typography>
              <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => handleClose({}, "button")}
                variant="outlined"
              >
                {t("cancel")}
              </Button>
            </DialogActions>
          </>
        ) : type === "bug" ? (
          <form onSubmit={onSubmit}>
            <DialogContent>
              {error && <Alert severity="error">{error.message}</Alert>}
              <DialogContentText>
                {t("report.bug.warning_message")}
              </DialogContentText>
              <TextField
                id="bug-report-subject"
                className={classes.field}
                label={t("report.bug.title_label")}
                helperText={t("report.bug.title_helper")}
                name="subject"
                inputRef={register({ required: true })}
                fullWidth
              />
              <TextField
                className={classes.field}
                id="bug-report-description"
                label={t("report.bug.problem_label")}
                helperText={t("report.bug.problem_helper")}
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
                label={t("report.bug.expect_label")}
                helperText={t("report.bug.expect_helper")}
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
                {t("submit")}
              </Button>
              <Button
                onClick={() => handleClose({}, "button")}
                variant="outlined"
              >
                {t("cancel")}
              </Button>
            </DialogActions>
          </form>
        ) : null}
      </Dialog>
    </>
  );
}
