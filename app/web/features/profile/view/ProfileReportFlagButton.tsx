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
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import { BlockInput, blockUser } from "service/blocking";
import { ReportInput } from "service/reporting";
import { theme } from "theme";

export interface ProfileReportFlagButtonProps {
  contentRef: string;
  authorUser: string | number;
  profileUsername: string;
}

const FlagButtonWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.primary.main,
  cursor: "pointer",
  width: "100%",

  "&:hover": {
    backgroundColor: theme.palette.primary.main + "0.1",
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.primary.dark,
  },
}));

export default function ProfileReportFlagButton({
  contentRef,
  authorUser,
  profileUsername,
}: ProfileReportFlagButtonProps) {
  const { t } = useTranslation(GLOBAL);

  const [isOpen, setIsOpen] = useState(false);
  const [requiredValueError, setRequiredValueError] = useState<string | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    register,
    reset: resetForm,
    formState: { errors },
  } = useForm<ReportInput>();

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
    isLoading,
    mutate: reportContent,
    reset: resetMutation,
  } = useMutation<Empty, RpcError, ReportInput>(
    (formData) =>
      service.reporting.reportContent({ ...formData, contentRef, authorUser }),
    {
      onSuccess: () => {
        setIsOpen(false);
      },
    },
  );

  const handleClose = (
    event: unknown,
    reason: "backdropClick" | "escapeKeyDown" | "button",
  ) => {
    if (reason !== "button") return;
    resetForm();
    resetMutation();
    setBlockValue("shouldBlock", false);
    setIsOpen(false);
    setRequiredValueError(null);
  };

  const onSubmit = handleSubmit((data) => {
    if (data.description.length < 1 && !shouldBlockField) {
      setRequiredValueError(t("report.flag.profile_reason_required"));
      return;
    }

    reportContent(data);

    if (shouldBlockField) {
      blockUser({ username: profileUsername });
    }
  });

  const handleFlagButtonClick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setIsOpen(true);
  };

  return (
    <>
      {report && (
        <Snackbar severity="success">
          {t("report.content.success_message")}
        </Snackbar>
      )}
      <FlagButtonWrapper
        aria-label={t("report.flag.button_aria_label")}
        onClick={handleFlagButtonClick}
      >
        <FlagIcon sx={{ marginRight: theme.spacing(1) }} />
        <Typography sx={{ fontSize: ".875rem" }}>
          {t("report.flag.profile_title")}
        </Typography>
      </FlagButtonWrapper>
      <Dialog
        aria-labelledby="content-reporter"
        open={isOpen}
        onClose={handleClose}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <DialogTitle id="content-reporter">
          {t("report.flag.profile_title")}
        </DialogTitle>
        <form onSubmit={onSubmit}>
          <DialogContent>
            {error && <Alert severity="error">{error.message}</Alert>}
            {requiredValueError && (
              <Alert severity="error">{requiredValueError}</Alert>
            )}
            <DialogContentText
              variant="body2"
              sx={{ paddingLeft: 1, paddingBottom: 0 }}
            >
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
              <InputLabel id="content-report-reason">
                {t("report.flag.reason_label")}
              </InputLabel>
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
                    labelId="content-report-reason"
                    label={t("report.flag.reason_label")}
                    id="content-report-reason"
                    onChange={field.onChange}
                    sx={{
                      marginBottom: theme.spacing(2),
                    }}
                  >
                    {[
                      "",
                      t("report.flag.reason.spam"),
                      t("report.flag.reason.dating"),
                      t("report.flag.reason.external"),
                      t("report.flag.reason.commercial"),
                      t("report.flag.reason.harassment"),
                      t("report.flag.reason.fake"),
                      t("report.flag.reason.freeloading"),
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
              {errors?.reason && (
                <FormHelperText error={!!errors?.reason}>
                  {errors?.reason?.message}
                </FormHelperText>
              )}
            </FormControl>
            <TextField
              id="content-report-description"
              {...register("description")}
              label={t("report.flag.description_label")}
              helperText={t("report.flag.description_helper")}
              fullWidth
              multiline
              minRows={4}
              maxRows={6}
            />
            <FormControl
              sx={{
                marginTop: theme.spacing(2),
              }}
            >
              <FormControlLabel
                control={<Checkbox {...blockRegister("shouldBlock")} />}
                label={t("report.flag.block_user")}
              />
              <DialogContentText
                variant="body2"
                sx={{ paddingTop: 0, paddingBottom: 0 }}
              >
                <strong>{t("report.flag.block_user_explainer")}</strong>
              </DialogContentText>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleClose({}, "button")}
              variant="outlined"
              sx={{
                color: theme.palette.common.black,
                borderColor: theme.palette.grey[300],

                "&:hover": {
                  borderColor: theme.palette.grey[300],
                  backgroundColor: "#3135390A",
                },
              }}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" loading={isLoading} onClick={onSubmit}>
              {t("submit")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
