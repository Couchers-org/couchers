import {
  FormControl,
  IconButton,
  InputLabel,
  Portal,
  Select,
} from "@mui/material";
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
import { FlagIcon } from "components/Icons";
import Snackbar from "components/Snackbar";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { service } from "service";
import { ReportInput } from "service/reporting";
import { theme } from "theme";

interface FlagButtonProps {
  contentRef: string;
  authorUser: string | number;
  className?: string;
}

export default function FlagButton({
  contentRef,
  authorUser,
  className,
}: FlagButtonProps) {
  const { t } = useTranslation(GLOBAL);

  const [isOpen, setIsOpen] = useState(false);
  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
    watch,
  } = useForm<ReportInput>();

  const reason = watch("reason");
  const description = watch("description");
  const requiredReasons = useMemo(
    () => [
      t("report.flag.reason.other"),
      t("report.flag.reason.safety"),
      t("report.flag.reason.guidelines_breach"),
    ],
    [t],
  );

  // Reset errors when reason changes
  useEffect(() => {
    if (!requiredReasons.includes(reason)) {
      resetForm(
        { description: "", reason: "" },
        { keepValues: true, keepErrors: false, keepDirty: false },
      );
    }
  }, [reason, requiredReasons, resetForm]);

  const {
    data: report,
    error,
    isPending,
    mutate: reportContent,
    reset: resetMutation,
  } = useMutation<Empty, RpcError, ReportInput>({
    mutationFn: (formData) =>
      service.reporting.reportContent({ ...formData, contentRef, authorUser }),
    onSuccess: () => {
      setIsOpen(false);
    },
  });

  const handleClose = (
    event: unknown,
    reason: "backdropClick" | "escapeKeyDown" | "button",
  ) => {
    if (reason !== "button") return;
    resetForm();
    resetMutation();
    setIsOpen(false);
  };

  const onSubmit = handleSubmit((data) => {
    // Use English version to send to backend
    const reasonMap: Record<string, string> = {
      [t("report.flag.reason.dating")]: t("report.flag.reason.dating", {
        lng: "en",
      }),
      [t("report.flag.reason.sexualized")]: t("report.flag.reason.sexualized", {
        lng: "en",
      }),
      [t("report.flag.reason.safety")]: t("report.flag.reason.safety", {
        lng: "en",
      }),
      [t("report.flag.reason.scam")]: t("report.flag.reason.scam", {
        lng: "en",
      }),
      [t("report.flag.reason.spam")]: t("report.flag.reason.spam", {
        lng: "en",
      }),
      [t("report.flag.reason.external")]: t("report.flag.reason.external", {
        lng: "en",
      }),
      [t("report.flag.reason.harassment")]: t("report.flag.reason.harassment", {
        lng: "en",
      }),
      [t("report.flag.reason.guidelines_breach")]: t(
        "report.flag.reason.guidelines_breach",
        { lng: "en" },
      ),
      [t("report.flag.reason.other")]: t("report.flag.reason.other", {
        lng: "en",
      }),
    };

    reportContent({ ...data, reason: reasonMap[data.reason] });
  });

  return (
    <>
      {report && (
        <Portal>
          <Snackbar severity="success">
            {t("report.content.success_message")}
          </Snackbar>
        </Portal>
      )}
      <IconButton
        aria-label={t("report.flag.button_aria_label")}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          setIsOpen(true);
        }}
        color="primary"
        size="large"
      >
        <FlagIcon />
      </IconButton>
      <Dialog
        aria-labelledby="content-reporter"
        open={isOpen}
        onClose={handleClose}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
        }}
      >
        <DialogTitle id="content-reporter">
          {t("report.flag.title")}
        </DialogTitle>
        <form onSubmit={onSubmit}>
          <DialogContent>
            {error && <Alert severity="error">{error.message}</Alert>}
            <DialogContentText>{t("report.flag.explainer")}</DialogContentText>
            <FormControl
              variant="outlined"
              fullWidth
              margin="normal"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.shape.borderRadius * 3,
                },
              }}
            >
              <InputLabel htmlFor="content-report-reason">
                {t("report.flag.reason_label")}
              </InputLabel>
              <Controller
                control={control}
                defaultValue={""}
                rules={{
                  validate: (v) => !!v || t("report.flag.reason_required"),
                }}
                name="reason"
                render={({ field }) => (
                  <Select
                    {...field}
                    variant="outlined"
                    native
                    label={t("report.flag.reason_label")}
                    id="content-report-reason"
                    sx={{
                      "& + &": {
                        marginBlockStart: theme.spacing(2),
                      },
                    }}
                  >
                    {[
                      "",
                      t("report.flag.reason.dating"),
                      t("report.flag.reason.sexualized"),
                      t("report.flag.reason.safety"),
                      t("report.flag.reason.scam"),
                      t("report.flag.reason.spam"),
                      t("report.flag.reason.external"),
                      t("report.flag.reason.harassment"),
                      t("report.flag.reason.guidelines_breach"),
                      t("report.flag.reason.other"),
                    ].map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
            <Controller
              control={control}
              defaultValue={""}
              name="description"
              rules={{
                required: requiredReasons.includes(reason),
                validate: (value) => {
                  // Only require description if reason is in requiredReasons
                  if (requiredReasons.includes(reason)) {
                    return !!value || t("report.flag.description_required");
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <TextField
                  id="content-report-description"
                  {...field}
                  error={!!errors?.description?.message}
                  helperText={
                    !errors?.description?.message
                      ? t("report.flag.description_helper")
                      : undefined
                  }
                  label={t("report.flag.description_label")}
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={6}
                  sx={{
                    marginTop: theme.spacing(2),
                    "& + &": {
                      marginBlockStart: theme.spacing(2),
                    },
                  }}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleClose({}, "button")}
              variant="outlined"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                !reason || (requiredReasons.includes(reason) && !description)
              }
              loading={isPending}
              onClick={onSubmit}
            >
              {t("submit")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
