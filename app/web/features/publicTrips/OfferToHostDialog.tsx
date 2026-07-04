import { styled } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  publicTripsBaseKey,
  publicTripsByUserBaseKey,
} from "features/queryKeys";
import { useTranslation } from "i18n";
import { GLOBAL, PUBLIC_TRIPS } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { routeToHostRequest } from "routes";
import { service } from "service";
import { theme } from "theme";
import { ISO8601_DATE_FORMAT } from "utils/date";
import dayjs from "utils/dayjs";

// Must match the backend host request minimum (and normal host requests).
const MESSAGE_MIN_LENGTH = 250;

const DATE_FIELD_ID = "offer-to-host-dates";

interface FormValues {
  fromDate: string | null;
  toDate: string | null;
  text: string;
}

interface OfferToHostDialogProps {
  open: boolean;
  onClose: () => void;
  tripId: number;
  hostUserId: number;
  hostName: string;
  tripFromDate: string;
  tripToDate: string;
}

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

export default function OfferToHostDialog({
  open,
  onClose,
  tripId,
  hostUserId,
  hostName,
  tripFromDate,
  tripToDate,
}: OfferToHostDialogProps) {
  const { t } = useTranslation([PUBLIC_TRIPS, GLOBAL]);
  const router = useRouter();
  const queryClient = useQueryClient();

  const tripFrom = dayjs(tripFromDate);
  const today = dayjs().startOf("day");
  // The host can offer within the trip's window (shorten, not extend), and
  // never in the past. The backend enforces these too.
  const earliest = tripFrom.isAfter(today) ? tripFrom : today;

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: {
      fromDate: tripFromDate,
      toDate: tripToDate,
      text: "",
    },
  });

  const watchFromDate = watch("fromDate");
  const text = watch("text") ?? "";
  const charsRemaining = MESSAGE_MIN_LENGTH - text.length;

  const {
    mutate,
    isPending,
    error,
    reset: resetMutation,
  } = useMutation({
    mutationFn: ({ fromDate, toDate, text }: FormValues) =>
      service.requests.createHostRequest({
        hostUserId,
        // Both are required by the form, so non-null at submit time.
        fromDate: fromDate!,
        toDate: toDate!,
        text: text.trim(),
        publicTripId: tripId,
        stayType: 0,
      }),
    onSuccess: (hostRequestId) => {
      // Refetch trips so the card's viewerHostRequestId updates (the button
      // flips to "Already offered") next time the list is shown.
      queryClient.invalidateQueries({ queryKey: [publicTripsBaseKey] });
      queryClient.invalidateQueries({ queryKey: [publicTripsByUserBaseKey] });
      reset();
      onClose();
      router.push(routeToHostRequest(hostRequestId));
    },
  });

  const handleClose = () => {
    reset();
    resetMutation();
    onClose();
  };

  const onSubmit = handleSubmit((data) => mutate(data));

  const titleId = "offer-to-host-dialog-title";
  const formId = "offer-to-host-form";

  return (
    <Dialog aria-labelledby={titleId} open={open} onClose={handleClose}>
      <DialogTitle id={titleId} onClose={handleClose}>
        {t("publicTrips:offer_dialog_title", { name: hostName })}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}
        <form id={formId} onSubmit={onSubmit} noValidate>
          <FieldStack>
            <DateRow>
              <Datepicker
                control={control}
                error={!!errors.fromDate}
                helperText={errors.fromDate?.message}
                id={`${DATE_FIELD_ID}-from`}
                label={t("publicTrips:from_date_label")}
                name="fromDate"
                defaultValueISO8601={tripFromDate}
                minValueISO8601={earliest.format(ISO8601_DATE_FORMAT)}
                maxValueISO8601={tripToDate}
                rules={{ required: t("publicTrips:from_date_required") }}
              />
              <Datepicker
                control={control}
                error={!!errors.toDate}
                helperText={errors.toDate?.message}
                id={`${DATE_FIELD_ID}-to`}
                label={t("publicTrips:to_date_label")}
                name="toDate"
                defaultValueISO8601={tripToDate}
                minValueISO8601={
                  watchFromDate ?? earliest.format(ISO8601_DATE_FORMAT)
                }
                maxValueISO8601={tripToDate}
                rules={{ required: t("publicTrips:to_date_required") }}
              />
            </DateRow>
            <TextField
              id="offer-to-host-message"
              {...register("text", {
                required: t("publicTrips:offer_dialog_message_required"),
                minLength: {
                  value: MESSAGE_MIN_LENGTH,
                  message: t("publicTrips:offer_dialog_chars_remaining", {
                    count: charsRemaining,
                  }),
                },
              })}
              label={t("publicTrips:offer_dialog_message_label")}
              placeholder={t("publicTrips:offer_dialog_message_placeholder")}
              minRows={6}
              multiline
              fullWidth
              error={!!errors.text}
              helperText={
                errors.text?.message
                  ? errors.text.message
                  : charsRemaining > 0
                    ? t("publicTrips:offer_dialog_chars_remaining", {
                        count: charsRemaining,
                      })
                    : ""
              }
            />
          </FieldStack>
        </form>
      </DialogContent>
      <DialogActions sx={{ padding: theme.spacing(0, 3, 2) }}>
        <Button variant="outlined" onClick={handleClose}>
          {t("global:cancel")}
        </Button>
        <Button type="submit" form={formId} loading={isPending}>
          {t("publicTrips:offer_dialog_submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
