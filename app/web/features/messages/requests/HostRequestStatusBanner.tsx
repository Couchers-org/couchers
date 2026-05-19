import { Box, styled, Typography } from "@mui/material";
import Button from "components/Button";
import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { HostRequestStatus } from "proto/conversations_pb";
import { useEffect, useState } from "react";

const StyledBanner = styled(Box)(({ theme }) => ({
  background: "var(--mui-palette-background-paper)",
  borderBottom: "1px solid var(--mui-palette-divider)",
  padding: theme.spacing(1.5, 2),
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  flexShrink: 0,
}));

export default function HostRequestStatusBanner({
  isHost,
  status,
  isLoading,
  onAccept,
  onDecline,
  onConfirm,
  onCancel,
}: {
  isHost: boolean;
  status: HostRequestStatus;
  isLoading: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation([MESSAGES, GLOBAL]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setIsEditMode(false);
  }, [status]);

  if (isHost) {
    let message: string | null = null;
    if (status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) {
      message = t("messages:host_request_item.host_status.accepted");
    } else if (status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) {
      message = t("messages:host_request_item.host_status.confirmed");
    } else if (status === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED) {
      message = t("messages:host_request_item.host_status.rejected");
    }

    if (!message) return null;

    const isRejected =
      status === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED;

    return (
      <StyledBanner>
        <Typography variant="body2">{message}</Typography>
        {isEditMode ? (
          <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setIsEditMode(false)}
            >
              {t("messages:status_bar_cancel_edit_button")}
            </Button>
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={isRejected ? onAccept : onDecline}
              loading={isLoading}
            >
              {isRejected
                ? t("global:accept")
                : t("messages:close_request_button_text")}
            </Button>
          </Box>
        ) : (
          <Button
            variant="text"
            size="small"
            color="primary"
            onClick={() => setIsEditMode(true)}
          >
            {t("messages:status_bar_edit_button")}
          </Button>
        )}
      </StyledBanner>
    );
  }

  // surfer view
  const canConfirm = status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED;
  // backend blocks cancel from REJECTED or CANCELLED
  const canCancel =
    status === HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
    status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED ||
    status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED;

  let surferMessage: string | null = null;
  if (status === HostRequestStatus.HOST_REQUEST_STATUS_PENDING) {
    surferMessage = t("messages:surfer_bar_pending");
  } else if (status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) {
    surferMessage = t("messages:host_request_item.surfer_status.accepted");
  } else if (status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) {
    surferMessage = t("messages:host_request_item.surfer_status.confirmed");
  }

  if (!surferMessage) return null;

  return (
    <StyledBanner>
      <Typography variant="body2">{surferMessage}</Typography>
      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
        {canConfirm && (
          <Button
            variant="text"
            size="small"
            color="primary"
            onClick={onConfirm}
            loading={isLoading}
          >
            {t("messages:confirm_request_button_text")}
          </Button>
        )}
        {canCancel && (
          <ConfirmationDialogWrapper
            title={t("messages:cancel_request_dialog_title")}
            message={t("messages:cancel_request_dialog_message")}
            onConfirm={onCancel}
          >
            {(setIsOpen) => (
              <Button
                variant="text"
                size="small"
                color="primary"
                onClick={() => setIsOpen(true)}
                loading={isLoading}
              >
                {t("messages:cancel_request_button")}
              </Button>
            )}
          </ConfirmationDialogWrapper>
        )}
      </Box>
    </StyledBanner>
  );
}
