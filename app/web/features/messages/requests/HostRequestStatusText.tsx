import { Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { HostRequestStatus } from "proto/conversations_pb";
import { theme } from "theme";

interface HostRequestStatusTextProps {
  isHost: boolean;
  requestStatus: HostRequestStatus;
  isPast: boolean;
}

export default function HostRequestStatusText({
  isHost,
  requestStatus,
  isPast,
}: HostRequestStatusTextProps) {
  const { t } = useTranslation(MESSAGES);

  let statusText = "";
  if (requestStatus === HostRequestStatus.HOST_REQUEST_STATUS_PENDING) {
    statusText = isPast
      ? t("host_request_item.expired")
      : t("host_request_item.pending");
  }

  if (isHost) {
    switch (requestStatus) {
      case HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED:
        statusText = t("host_request_item.host_status.accepted");
        break;
      case HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED:
        statusText = t("host_request_item.host_status.cancelled");
        break;
      case HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED:
        statusText = t("host_request_item.host_status.confirmed");
        break;
      case HostRequestStatus.HOST_REQUEST_STATUS_REJECTED:
        statusText = t("host_request_item.host_status.rejected");
        break;
    }
  } else {
    switch (requestStatus) {
      case HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED:
        statusText = t("host_request_item.surfer_status.accepted");
        break;
      case HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED:
        statusText = t("host_request_item.surfer_status.cancelled");
        break;
      case HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED:
        statusText = t("host_request_item.surfer_status.confirmed");
        break;
      case HostRequestStatus.HOST_REQUEST_STATUS_REJECTED:
        statusText = t("host_request_item.surfer_status.rejected");
        break;
    }
  }

  if (isPast) {
    statusText = statusText + ` (${t("host_request_status.past")})`;
  }

  return (
    <Typography
      variant="body2"
      color={isPast ? theme.palette.grey[500] : "default"}
    >
      {statusText}
    </Typography>
  );
}
