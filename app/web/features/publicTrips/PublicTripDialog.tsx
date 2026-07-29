import { Checkbox, FormControlLabel, styled, Typography } from "@mui/material";
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
import { GLOBAL, PUBLIC_TRIPS } from "i18n/namespaces";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Temporal } from "temporal-polyfill";

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
  fromDate: Temporal.PlainDate | null;
  toDate: Temporal.PlainDate | null;
  description: string;
  sameGenderOnly: boolean;
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
  const { t } = useTranslation([PUBLIC_TRIPS, GLOBAL]);
  const isEdit = props.mode === "edit";

  const getDefaults = (): FormValues =>
    props.mode === "edit"
      ? {
          fromDate: props.trip.fromDate
            ? Temporal.PlainDate.from(props.trip.fromDate)
            : null,
          toDate: props.trip.toDate
            ? Temporal.PlainDate.from(props.trip.toDate)
            : null,
          description: props.trip.description,
          sameGenderOnly: props.trip.sameGenderOnly ?? false,
        }
      : {
          fromDate: null,
          toDate: null,
          description: "",
          sameGenderOnly: false,
        };

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
  const tripSameGenderOnly =
    props.mode === "edit" ? props.trip.sameGenderOnly : null;

  useEffect(() => {
    if (open) {
      reset(getDefaults());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    tripKey,
    tripFromDate,
    tripToDate,
    tripDescription,
    tripSameGenderOnly,
  ]);

  const watchFromDate = useWatch({ control, name: "fromDate" });
  const watchDescription = useWatch({ control, name: "description" }) ?? "";
  const descriptionCharsRemaining =
    DESCRIPTION_MIN_LENGTH - watchDescription.length;

  // PublicTrip proto only carries community_id, so fetch the community name in
  // edit mode. Hook is no-op when id is 0 (create mode already has the name).
  const { data: editCommunity } = useCommunity(
    props.mode === "edit" ? props.trip.communityId : 0,
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

  const onSubmit = handleSubmit(
    ({ fromDate, toDate, description, sameGenderOnly }) => {
      if (!fromDate || !toDate) return;
      const payload = {
        fromDate: fromDate.toString(),
        toDate: toDate.toString(),
        description: description.trim(),
        sameGenderOnly,
      };
      if (props.mode === "edit") {
        updateMutation.mutate({ tripId: props.trip.tripId, ...payload });
      } else {
        createMutation.mutate({ communityId: props.communityId, ...payload });
      }
    },
  );

  const formId = isEdit ? "edit-public-trip-form" : "create-public-trip-form";
  const titleId = isEdit
    ? "edit-public-trip-dialog-title"
    : "create-public-trip-dialog-title";

  return (
    <Dialog aria-labelledby={titleId} open={open} onClose={handleClose}>
      <DialogTitle id={titleId} onClose={handleClose}>
        {isEdit
          ? t("publicTrips:edit_dialog_title")
          : t("publicTrips:create_dialog_title")}
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
                rules={{
                  required: t("publicTrips:from_date_required"),
                }}
              />
              <Datepicker
                control={control}
                error={!!errors.toDate}
                helperText={errors.toDate?.message}
                id={`${DATE_FIELD_ID}-to`}
                label={t("publicTrips:to_date_label")}
                name="toDate"
                minValue={watchFromDate ?? Temporal.Now.plainDateISO()}
                rules={{
                  required: t("publicTrips:to_date_required"),
                }}
              />
            </DateRow>
            {communityName && (
              <Typography variant="body2">
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {t("publicTrips:location_label")}
                </Typography>{" "}
                {communityName}
              </Typography>
            )}
            <Controller
              control={control}
              name="sameGenderOnly"
              render={({ field: { value, onChange } }) => (
                <div>
                  <FormControlLabel
                    control={<Checkbox checked={value} onChange={onChange} />}
                    label={t("publicTrips:same_gender_only_label")}
                  />
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ pl: 4 }}
                  >
                    {t("publicTrips:same_gender_only_helper")}
                  </Typography>
                </div>
              )}
            />
            <TextField
              id="public-trip-description"
              {...register("description", {
                required: t("publicTrips:description_required"),
                validate: (value) => {
                  if (value.trim().length === 0) {
                    return t("publicTrips:description_required");
                  }
                  if (value.length < DESCRIPTION_MIN_LENGTH) {
                    return t("publicTrips:description_chars_remaining", {
                      count: DESCRIPTION_MIN_LENGTH - value.length,
                    });
                  }
                  return true;
                },
              })}
              label={t("publicTrips:description_label")}
              placeholder={t("publicTrips:description_placeholder")}
              multiline
              minRows={4}
              fullWidth
              error={!!errors.description}
              helperText={
                errors.description?.message
                  ? errors.description.message
                  : descriptionCharsRemaining > 0
                    ? t("publicTrips:description_chars_remaining", {
                        count: descriptionCharsRemaining,
                      })
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
            ? t("publicTrips:edit_dialog_submit")
            : t("publicTrips:create_dialog_submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
