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
import { useCommunity } from "features/communities/hooks";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import dayjs, { Dayjs } from "utils/dayjs";

import {
  PublicTrip,
  useCreatePublicTrip,
  useUpdatePublicTrip,
} from "./useListPublicTrips";

const DATE_FIELD_ID = "public-trip-dates";
// Must match backend (PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16)
const DESCRIPTION_MIN_LENGTH = 150;

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

type PublicTripDialogProps = {
  open: boolean;
  onClose: () => void;
} & (
  | { mode: "create"; communityId: number; communityName: string }
  | { mode: "edit"; trip: PublicTrip }
);

export default function PublicTripDialog(props: PublicTripDialogProps) {
  const { open, onClose } = props;
  const { t } = useTranslation([COMMUNITIES, GLOBAL]);
  const isEdit = props.mode === "edit";

  const getDefaults = (): FormValues =>
    props.mode === "edit"
      ? {
          fromDate: props.trip.fromDate ? dayjs(props.trip.fromDate) : null,
          toDate: props.trip.toDate ? dayjs(props.trip.toDate) : null,
          description: props.trip.description,
        }
      : { fromDate: null, toDate: null, description: "" };

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: getDefaults(),
  });

  const tripKey = props.mode === "edit" ? props.trip.tripId : null;
  const tripFromDate = props.mode === "edit" ? props.trip.fromDate : null;
  const tripToDate = props.mode === "edit" ? props.trip.toDate : null;
  const tripDescription = props.mode === "edit" ? props.trip.description : null;

  useEffect(() => {
    if (open) {
      reset(getDefaults());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tripKey, tripFromDate, tripToDate, tripDescription]);

  const watchFromDate = useWatch({ control, name: "fromDate" });
  const watchDescription = useWatch({ control, name: "description" }) ?? "";
  const descriptionCharsRemaining =
    DESCRIPTION_MIN_LENGTH - watchDescription.length;

  // PublicTrip proto only carries node_id, so fetch the community name in edit
  // mode. Hook is no-op when id is 0 (create mode already has the name).
  const { data: editCommunity } = useCommunity(
    props.mode === "edit" ? props.trip.nodeId : 0,
  );
  const communityName =
    props.mode === "create" ? props.communityName : editCommunity?.name;

  const handleSuccess = () => {
    if (!isEdit) reset();
    onClose();
  };

  // Both hooks are always called (rules of hooks); only the active one fires.
  const createMutation = useCreatePublicTrip(
    props.mode === "create" ? props.communityId : 0,
    handleSuccess,
  );
  const updateMutation = useUpdatePublicTrip(handleSuccess);

  const {
    isPending,
    error,
    reset: resetMutation,
  } = isEdit ? updateMutation : createMutation;

  const handleClose = () => {
    if (!isEdit) reset();
    resetMutation();
    onClose();
  };

  const onSubmit = handleSubmit(({ fromDate, toDate, description }) => {
    if (!fromDate || !toDate) return;
    const payload = {
      fromDate: fromDate.format("YYYY-MM-DD"),
      toDate: toDate.format("YYYY-MM-DD"),
      description: description.trim(),
    };
    if (props.mode === "edit") {
      updateMutation.mutate({ tripId: props.trip.tripId, ...payload });
    } else {
      createMutation.mutate({ nodeId: props.communityId, ...payload });
    }
  });

  const formId = isEdit ? "edit-public-trip-form" : "create-public-trip-form";
  const titleId = isEdit
    ? "edit-public-trip-dialog-title"
    : "create-public-trip-dialog-title";

  return (
    <Dialog aria-labelledby={titleId} open={open} onClose={handleClose}>
      <DialogTitle id={titleId} onClose={handleClose}>
        {isEdit
          ? t("communities:public_trips_edit_dialog_title")
          : t("communities:public_trips_create_dialog_title")}
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
            {communityName && (
              <Typography variant="body2">
                <Typography component="span" fontWeight={600}>
                  {t("communities:public_trips_location_label")}
                </Typography>{" "}
                {communityName}
              </Typography>
            )}
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
        <Button type="submit" form={formId} loading={isPending}>
          {isEdit
            ? t("communities:public_trips_edit_dialog_submit")
            : t("communities:public_trips_create_dialog_submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
