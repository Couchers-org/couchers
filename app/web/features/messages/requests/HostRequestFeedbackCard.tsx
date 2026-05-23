import { ThumbDown, ThumbsUpDown, ThumbUp } from "@mui/icons-material";
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  styled,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import { hostRequestKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { HostRequestQuality } from "proto/requests_pb";
import { useState } from "react";
import { service } from "service";

type DeclineReason =
  | "didnt_read_profile"
  | "dont_want_to_host"
  | "not_available"
  | "other";

const StyledCard = styled(Box)(({ theme }) => ({
  background: "var(--mui-palette-grey-50)",
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(2, 2, 1.5),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledActions = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
});

export default function HostRequestFeedbackCard({
  hostRequestId,
}: {
  hostRequestId: number;
}) {
  const { t } = useTranslation(MESSAGES);
  const queryClient = useQueryClient();

  const [quality, setQuality] = useState<HostRequestQuality | null>(null);
  const [declineReasons, setDeclineReasons] = useState<Set<DeclineReason>>(
    new Set(),
  );
  const [otherText, setOtherText] = useState("");

  const toggleReason = (reason: DeclineReason) => {
    setDeclineReasons((prev) => {
      const next = new Set(prev);
      if (next.has(reason)) {
        next.delete(reason);
      } else {
        next.add(reason);
      }
      return next;
    });
  };

  const {
    mutate: submitFeedback,
    isPending,
    error,
  } = useMutation<
    void,
    RpcError,
    { quality: HostRequestQuality; declineReason: string }
  >({
    mutationFn: (data) =>
      service.requests.sendHostRequestFeedback(
        hostRequestId,
        data.quality,
        data.declineReason,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: hostRequestKey(hostRequestId),
      });
    },
  });

  const handleSkip = () => {
    submitFeedback({
      quality: HostRequestQuality.HOST_REQUEST_QUALITY_UNSPECIFIED,
      declineReason: "",
    });
  };

  const handleSubmit = () => {
    const reasons = Array.from(declineReasons).map((r) =>
      r === "other" ? otherText : r,
    );
    submitFeedback({
      quality: quality ?? HostRequestQuality.HOST_REQUEST_QUALITY_UNSPECIFIED,
      declineReason: reasons.join(","),
    });
  };

  return (
    <StyledCard>
      {error && <Alert severity="error">{error.message}</Alert>}
      <FormControl component="fieldset">
        <Typography variant="subtitle2" gutterBottom>
          {t("private_feedback_card.quality_label")}
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={quality}
          onChange={(_e, val) => setQuality(val)}
          aria-label={t("private_feedback_card.quality_label")}
          size="small"
          sx={{
            gap: 1,
            flexWrap: "wrap",
            "& .MuiToggleButton-root": {
              border: "1px solid var(--mui-palette-divider) !important",
            },
            "& .MuiToggleButton-root.Mui-selected": {
              border: "1px solid var(--mui-palette-primary-main) !important",
            },
          }}
        >
          <ToggleButton
            value={HostRequestQuality.HOST_REQUEST_QUALITY_LOW}
            sx={{
              borderRadius: "2rem !important",
              px: { xs: 1, sm: 2 },
              fontSize: { xs: "0.7rem", sm: "0.8125rem" },
              gap: 0.75,
              background: "var(--mui-palette-grey-200)",
            }}
          >
            <ThumbDown fontSize="inherit" />
            {t("private_feedback_card.quality_low")}
          </ToggleButton>
          <ToggleButton
            value={HostRequestQuality.HOST_REQUEST_QUALITY_OKAY}
            sx={{
              borderRadius: "2rem !important",
              px: { xs: 1, sm: 2 },
              fontSize: { xs: "0.7rem", sm: "0.8125rem" },
              gap: 0.75,
              background: "var(--mui-palette-grey-200)",
            }}
          >
            <ThumbsUpDown fontSize="inherit" />
            {t("private_feedback_card.quality_okay")}
          </ToggleButton>
          <ToggleButton
            value={HostRequestQuality.HOST_REQUEST_QUALITY_HIGH}
            sx={{
              borderRadius: "2rem !important",
              px: { xs: 1, sm: 2 },
              fontSize: { xs: "0.7rem", sm: "0.8125rem" },
              gap: 0.75,
              background: "var(--mui-palette-grey-200)",
            }}
          >
            <ThumbUp fontSize="inherit" />
            {t("private_feedback_card.quality_high")}
          </ToggleButton>
        </ToggleButtonGroup>
      </FormControl>
      <FormControl component="fieldset">
        <Typography variant="subtitle2" gutterBottom>
          {t("private_feedback_card.decline_reason_label")}
        </Typography>
        <FormGroup>
          {(
            [
              "didnt_read_profile",
              "dont_want_to_host",
              "not_available",
              "other",
            ] as DeclineReason[]
          ).map((reason) => (
            <FormControlLabel
              key={reason}
              control={
                <Checkbox
                  size="small"
                  checked={declineReasons.has(reason)}
                  onChange={() => toggleReason(reason)}
                />
              }
              label={t(`private_feedback_card.reason_${reason}`)}
            />
          ))}
        </FormGroup>
        {declineReasons.has("other") && (
          <TextField
            multiline
            minRows={2}
            maxRows={4}
            fullWidth
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder={t("private_feedback_card.reason_other_placeholder")}
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </FormControl>
      <Typography variant="caption" color="text.secondary">
        {t("private_feedback_card.privacy_notice")}
      </Typography>
      <StyledActions>
        <Button
          variant="text"
          size="small"
          onClick={handleSkip}
          disabled={isPending}
        >
          {t("private_feedback_card.skip_button")}
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          loading={isPending}
        >
          {t("private_feedback_card.submit_button")}
        </Button>
      </StyledActions>
    </StyledCard>
  );
}
