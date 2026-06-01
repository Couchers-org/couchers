import { Box, styled, Typography } from "@mui/material";
import Button from "components/Button";
import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { HostRequestStatus } from "proto/conversations_pb";

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
  onCancel,
  hostName,
}: {
  isHost: boolean;
  status: HostRequestStatus;
  isLoading: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  hostName?: string;
}) {
  const { t } = useTranslation([MESSAGES, GLOBAL]);

  if (isHost) {
    let message: string | null = null;
    if (status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) {
      message = t("messages:host_request_item.host_status.accepted_waiting");
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
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={isRejected ? onAccept : onDecline}
          loading={isLoading}
          sx={{ flexShrink: 0 }}
        >
          {isRejected
            ? t("global:accept")
            : t("messages:close_request_button_text")}
        </Button>
      </StyledBanner>
    );
  }

  // surfer view
  let surferMessage: string | null = null;
  if (status === HostRequestStatus.HOST_REQUEST_STATUS_PENDING) {
    surferMessage = t("messages:surfer_bar_pending", { name: hostName });
  } else if (status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) {
    surferMessage = t("messages:host_request_item.surfer_status.confirmed", {
      name: hostName,
    });
  }

  if (!surferMessage) return null;

  return (
    <StyledBanner>
      <Typography variant="body2">{surferMessage}</Typography>
      <ConfirmationDialogWrapper
        title={t("messages:cancel_request_dialog_title")}
        message={t("messages:cancel_request_dialog_message")}
        confirmButtonLabel={t("messages:cancel_request_dialog_confirm_button")}
        cancelButtonLabel={t("messages:cancel_request_dialog_dismiss_button")}
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
    </StyledBanner>
  );
}
