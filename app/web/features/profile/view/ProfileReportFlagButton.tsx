import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Select,
  styled,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "components/Dialog";
import { FlagIcon } from "components/Icons";
import Snackbar from "components/Snackbar";
import TextField from "components/TextField";
import { useBlockUser } from "features/connections/friends/hooks";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { User } from "proto/api_pb";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { dashboardRoute } from "routes";
import { service } from "service";
import { BlockInput } from "service/blocking";
import { ReportInput } from "service/reporting";
import { theme } from "theme";

interface ProfileReportFlagButtonProps {
  contentRef: string;
  authorUser: string | number;
  profileUser: User.AsObject;
}

const FlagButtonWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--mui-palette-primary-main)",
  cursor: "pointer",
  width: "100%",

  "&:hover": {
    backgroundColor: "var(--mui-palette-primary-main)" + "0.1",
    borderRadius: theme.shape.borderRadius,
    color: "var(--mui-palette-primary-dark)",
  },
}));

export default function ProfileReportFlagButton({ contentRef, authorUser, profileUser }: ProfileReportFlagButtonProps) {
  const { t } = useTranslation(GLOBAL);
  const router = useRouter();

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
    () => [t("report.flag.reason.other"), t("report.flag.reason.safety"), t("report.flag.reason.guidelines_breach")],
    [t],
  );
  const {
    control: blockControl,
    register: blockRegister,
    setValue: setBlockValue,
  } = useForm<BlockInput>({
    defaultValues: {
      shouldBlock: false,
    },
  });

  const shouldBlockField = useWatch({
    control: blockControl,
    name: "shouldBlock",
  });

  const {
    data: report,
    error,
    isPending,
    mutate: reportContent,
    reset: resetMutation,
  } = useMutation({
    mutationFn: (formData: ReportInput) => service.reporting.reportContent({ ...formData, contentRef, authorUser }),
    onSuccess: () => {
      setIsOpen(false);
    },
  });

  const { blockUserMutation, error: blockUserError } = useBlockUser();

  const handleClose = (event: unknown, reason: "backdropClick" | "escapeKeyDown" | "button") => {
    if (reason !== "button") return;
    resetForm();
    resetMutation();
    setBlockValue("shouldBlock", false);
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
      [t("report.flag.reason.guidelines_breach")]: t("report.flag.reason.guidelines_breach", { lng: "en" }),
      [t("report.flag.reason.other")]: t("report.flag.reason.other", {
        lng: "en",
      }),
    };

    if (data.reason !== "" || data.description !== "") {
      reportContent({ ...data, reason: reasonMap[data.reason] });
    }

    if (shouldBlockField) {
      blockUserMutation(profileUser);
      router.push(dashboardRoute);
    }
  });

  const handleFlagButtonClick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setIsOpen(true);
  };

  return (
    <>
      {report && <Snackbar severity="success">{t("report.content.success_message")}</Snackbar>}
      {blockUserError && <Snackbar severity="error">{blockUserError.message}</Snackbar>}
      <FlagButtonWrapper aria-label={t("report.flag.profile_button_aria_label")} onClick={handleFlagButtonClick}>
        <FlagIcon sx={{ marginRight: theme.spacing(1) }} />
        <Typography sx={{ fontSize: ".875rem" }}>{t("report.flag.profile_title")}</Typography>
      </FlagButtonWrapper>
      <Dialog
        aria-labelledby="content-reporter"
        open={isOpen}
        onClose={handleClose}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <DialogTitle id="content-reporter">{t("report.flag.profile_title")}</DialogTitle>
        <form onSubmit={onSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" role="alert">
                {error.message}
              </Alert>
            )}
            <DialogContentText variant="body2" sx={{ paddingLeft: 1, paddingBottom: 0 }}>
              <strong> {t("report.flag.explainer")}</strong>
            </DialogContentText>
            <FormControl
              variant="outlined"
              fullWidth
              margin="normal"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.shape.borderRadius * 1,
                },
              }}
            >
              <InputLabel htmlFor="content-report-reason">{t("report.flag.reason_label")}</InputLabel>
              <Controller
                control={control}
                defaultValue={""}
                name="reason"
                render={({ field }) => (
                  <Select
                    {...field}
                    variant="outlined"
                    native
                    value={field.value}
                    label={t("report.flag.reason_label")}
                    id="content-report-reason"
                    onChange={field.onChange}
                    sx={{
                      marginBottom: theme.spacing(2),
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
              {errors?.reason && <FormHelperText error={!!errors?.reason}>{errors?.reason?.message}</FormHelperText>}
            </FormControl>
            <Controller
              control={control}
              defaultValue={""}
              name="description"
              rules={{
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
                  helperText={!errors?.description?.message ? t("report.flag.description_helper") : undefined}
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
            <FormControl
              sx={{
                marginTop: theme.spacing(2),
              }}
            >
              <FormControlLabel
                control={<Checkbox {...blockRegister("shouldBlock")} data-testid="block-user-check" />}
                label={t("report.flag.block_user", {
                  username: profileUser.username,
                })}
              />
              <DialogContentText variant="body2" sx={{ paddingTop: 0, paddingBottom: 0 }}>
                <strong>{t("report.flag.block_user_explainer")}</strong>
              </DialogContentText>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleClose({}, "button")} variant="outlined">
              {t("cancel")}
            </Button>
            <Button
              disabled={(requiredReasons.includes(reason) && !description) || (!reason && !shouldBlockField)}
              type="submit"
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
