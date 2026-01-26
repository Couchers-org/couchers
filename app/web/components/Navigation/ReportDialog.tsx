import { DialogProps, styled } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
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
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { ReportBugRes } from "proto/bugs_pb";
import { ComponentPropsWithRef, forwardRef, useState } from "react";
import { useForm } from "react-hook-form";
import { helpCenterReportContentURL } from "routes";
import { service } from "service";
import { theme } from "theme";

export interface BugReportFormData {
  subject: string;
  description: string;
  results: string;
}

const StyledTextField = styled(TextField)(() => ({
  marginBottom: theme.spacing(2),
}));

// If onKeyDown event propagation isn't stopped, rendering inside menu will cause
// focus issues
const ReportDialogTextField = forwardRef<
  HTMLInputElement,
  Omit<ComponentPropsWithRef<typeof TextField>, "onKeyDown">
>((props, ref) => (
  <StyledTextField
    ref={ref}
    {...props}
    onKeyDown={(e) => e.stopPropagation()}
  />
));

ReportDialogTextField.displayName = "ReportDialogTextField";

const StyledReportTypeButton = styled(Button)(() => ({
  display: "block",
  margin: "0 auto",
  "& + &": {
    marginBlockStart: theme.spacing(2),
  },
}));

export default function ReportDialog({ open, onClose }: DialogProps) {
  const { t } = useTranslation("global");

  const [type, setType] = useState<"initial" | "bug">("initial");
  const {
    register,
    handleSubmit,
    reset: resetForm,
  } = useForm<BugReportFormData>();
  const {
    data: bug,
    error,
    isPending,
    mutate: reportBug,
    reset: resetMutation,
  } = useMutation<ReportBugRes.AsObject, RpcError, BugReportFormData>({
    mutationFn: (formData) => service.bugs.reportBug(formData),
    onSuccess: () => {
      onClose?.({}, "escapeKeyDown");
    },
  });

  const handleClose = (
    event: unknown,
    reason: "backdropClick" | "escapeKeyDown" | "button",
  ) => {
    if (reason !== "button") return;
    resetForm();
    resetMutation();
    onClose?.({}, "escapeKeyDown");
    setTimeout(
      () => setType("initial"),
      theme.transitions.duration.leavingScreen,
    );
  };

  const onSubmit = handleSubmit((data) => {
    reportBug(data);
    resetForm();
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
      <Dialog aria-labelledby="bug-reporter" open={open} onClose={handleClose}>
        <DialogTitle id="bug-reporter">{t("report.label")}</DialogTitle>
        {type === "initial" ? (
          <>
            <DialogContent>
              <StyledReportTypeButton
                onClick={() => {
                  setType("bug");
                }}
              >
                {t("report.bug.button_label")}
              </StyledReportTypeButton>
              <StyledReportTypeButton
                href={helpCenterReportContentURL}
                style={{ maxWidth: "fit-content", textAlign: "center" }}
              >
                {t("report.content.button_label")}
              </StyledReportTypeButton>
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
              <ReportDialogTextField
                id="bug-report-subject"
                {...register("subject", { required: true })}
                label={t("report.bug.title_label")}
                fullWidth
              />
              <ReportDialogTextField
                id="bug-report-description"
                {...register("description", { required: true })}
                label={t("report.bug.problem_label")}
                helperText={t("report.bug.problem_helper")}
                name="description"
                fullWidth
                multiline
                minRows={4}
                maxRows={6}
              />
              <ReportDialogTextField
                {...register("results")}
                id="bug-report-results"
                defaultValue=""
                label={t("report.bug.expect_label")}
                helperText={t("report.bug.expect_helper")}
                name="results"
                fullWidth
                multiline
                minRows={4}
                maxRows={6}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => handleClose({}, "button")}
                variant="outlined"
              >
                {t("cancel")}
              </Button>
              <Button type="submit" loading={isPending} onClick={onSubmit}>
                {t("submit")}
              </Button>
            </DialogActions>
          </form>
        ) : null}
      </Dialog>
    </>
  );
}
