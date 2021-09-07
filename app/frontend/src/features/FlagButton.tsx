import {
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  Select,
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
import { FlagIcon } from "components/Icons";
import Snackbar from "components/Snackbar";
import TextField from "components/TextField";
import {
  CANCEL,
  CONTENT_REPORT,
  CONTENT_REPORT_DESCRIPTION_HELPER,
  CONTENT_REPORT_DESCRIPTION_LABEL,
  CONTENT_REPORT_EXPLAINER,
  CONTENT_REPORT_REASON_HELPER,
  CONTENT_REPORT_REASON_LABEL,
  CONTENT_REPORT_REASONS,
  CONTENT_REPORT_SUCCESS,
  REASON_REQUIRED,
  SUBMIT,
} from "features/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import { ReportInput } from "service/reporting";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
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
  formControl: {
    "& .MuiOutlinedInput-root": {
      borderRadius: theme.shape.borderRadius * 3,
    },
  },
}));

export interface FlagButtonProps {
  contentRef: string;
  authorUser: string | number;
  className?: string;
}

export default function FlagButton({
  contentRef,
  authorUser,
  className,
}: FlagButtonProps) {
  const classes = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const {
    control,
    handleSubmit,
    register,
    errors,
    reset: resetForm,
  } = useForm<ReportInput>();
  const {
    data: report,
    error,
    isLoading,
    mutate: reportContent,
    reset: resetMutation,
  } = useMutation<Empty, GrpcError, ReportInput>(
    (formData) =>
      service.reporting.reportContent({ ...formData, contentRef, authorUser }),
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
  };

  const onSubmit = handleSubmit((data) => {
    reportContent(data);
  });

  return (
    <>
      {report && (
        <Snackbar severity="success">{CONTENT_REPORT_SUCCESS}</Snackbar>
      )}
      <IconButton
        aria-label={CONTENT_REPORT}
        className={className}
        onClick={() => setIsOpen(true)}
        color="primary"
      >
        <FlagIcon />
      </IconButton>
      <Dialog
        aria-labelledby="content-reporter"
        open={isOpen}
        onClose={handleClose}
      >
        <DialogTitle id="content-reporter">{CONTENT_REPORT}</DialogTitle>
        <form onSubmit={onSubmit}>
          <DialogContent>
            {error && <Alert severity="error">{error.message}</Alert>}
            <DialogContentText>{CONTENT_REPORT_EXPLAINER}</DialogContentText>
            <FormControl
              variant="outlined"
              fullWidth
              className={classes.formControl}
              margin="normal"
            >
              <InputLabel htmlFor="content-report-reason">
                {CONTENT_REPORT_REASON_LABEL}
              </InputLabel>
              <Controller
                control={control}
                defaultValue={""}
                rules={{ validate: (v) => !!v || REASON_REQUIRED }}
                name="reason"
                render={({ onChange, value }) => (
                  <Select
                    className={classes.field}
                    native
                    value={value}
                    label={CONTENT_REPORT_REASON_LABEL}
                    id="content-report-reason"
                    onChange={(event) => onChange(event.target.value)}
                  >
                    {CONTENT_REPORT_REASONS.map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                )}
              />
              <FormHelperText error={!!errors?.reason}>
                {errors?.reason?.message || CONTENT_REPORT_REASON_HELPER}
              </FormHelperText>
            </FormControl>
            <TextField
              className={classes.field}
              id="content-report-description"
              label={CONTENT_REPORT_DESCRIPTION_LABEL}
              helperText={CONTENT_REPORT_DESCRIPTION_HELPER}
              name="description"
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
      </Dialog>
    </>
  );
}
