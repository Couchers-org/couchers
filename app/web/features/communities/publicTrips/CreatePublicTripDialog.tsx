import { styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import Datepicker from "components/Datepicker";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import TextField from "components/TextField";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useForm, useWatch } from "react-hook-form";
import dayjs, { Dayjs } from "utils/dayjs";

import { useCreatePublicTrip } from "./useListPublicTrips";

const DATE_FIELD_ID = "public-trip-dates";
const DESCRIPTION_MIN_LENGTH = 150; // Must match backend (PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16)

const FieldStack = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const DateRow = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}));

interface FormValues {
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
  description: string;
}

interface CreatePublicTripDialogProps {
  communityId: number;
  communityName: string;
  open: boolean;
  onClose: () => void;
}

export default function CreatePublicTripDialog({
  communityId,
  communityName,
  open,
  onClose,
}: CreatePublicTripDialogProps) {
  const { t } = useTranslation([COMMUNITIES, GLOBAL]);

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: { fromDate: null, toDate: null, description: "" },
  });

  const watchFromDate = useWatch({ control, name: "fromDate" });
  const watchDescription = useWatch({ control, name: "description" }) ?? "";
  const descriptionCharsRemaining =
    DESCRIPTION_MIN_LENGTH - watchDescription.length;

  const {
    mutate,
    isPending,
    error,
    reset: resetMutation,
  } = useCreatePublicTrip(communityId, () => {
    reset();
    onClose();
  });

  const handleClose = () => {
    reset();
    resetMutation();
    onClose();
  };

  const onSubmit = handleSubmit(({ fromDate, toDate, description }) => {
    if (!fromDate || !toDate) return;
    mutate({
      nodeId: communityId,
      fromDate: fromDate.format("YYYY-MM-DD"),
      toDate: toDate.format("YYYY-MM-DD"),
      description: description.trim(),
    });
  });

  return (
    <Dialog
      aria-labelledby="create-public-trip-dialog-title"
      open={open}
      onClose={handleClose}
    >
      <DialogTitle id="create-public-trip-dialog-title" onClose={handleClose}>
        {t("communities:public_trips_create_dialog_title")}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}
        <form id="create-public-trip-form" onSubmit={onSubmit} noValidate>
          <FieldStack>
            <DateRow>
              <Datepicker
                control={control}
                error={!!errors.fromDate}
                helperText={errors.fromDate?.message}
                id={`${DATE_FIELD_ID}-from`}
                label={t("communities:public_trips_from_date_label")}
                name="fromDate"
                defaultValue={null}
                rules={{
                  required: t("communities:public_trips_from_date_required"),
                }}
              />
              <Datepicker
                control={control}
                error={!!errors.toDate}
                helperText={errors.toDate?.message}
                id={`${DATE_FIELD_ID}-to`}
                label={t("communities:public_trips_to_date_label")}
                name="toDate"
                defaultValue={null}
                minDate={watchFromDate ? watchFromDate : dayjs()}
                rules={{
                  required: t("communities:public_trips_to_date_required"),
                }}
              />
            </DateRow>
            <Typography variant="body2">
              <Typography component="span" fontWeight={600}>
                {t("communities:public_trips_location_label")}
              </Typography>{" "}
              {communityName}
            </Typography>
            <TextField
              id="public-trip-description"
              {...register("description", {
                required: t("communities:public_trips_description_required"),
                validate: (value) => {
                  if (value.trim().length === 0) {
                    return t("communities:public_trips_description_required");
                  }
                  if (value.length < DESCRIPTION_MIN_LENGTH) {
                    return t(
                      "communities:public_trips_description_chars_remaining",
                      { count: DESCRIPTION_MIN_LENGTH - value.length },
                    );
                  }
                  return true;
                },
              })}
              label={t("communities:public_trips_description_label")}
              placeholder={t(
                "communities:public_trips_description_placeholder",
              )}
              multiline
              minRows={4}
              fullWidth
              error={!!errors.description}
              helperText={
                errors.description?.message
                  ? errors.description.message
                  : descriptionCharsRemaining > 0
                    ? t(
                        "communities:public_trips_description_chars_remaining",
                        { count: descriptionCharsRemaining },
                      )
                    : ""
              }
            />
          </FieldStack>
        </form>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose}>
          {t("global:cancel")}
        </Button>
        <Button
          type="submit"
          form="create-public-trip-form"
          loading={isPending}
        >
          {t("communities:public_trips_create_dialog_submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
