import { Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { HostRequestStatus } from "proto/messages_pb";
import { theme } from "theme";

interface HostRequestStatusTextProps {
  isHost: boolean;
  requestStatus: HostRequestStatus;
  isPast: boolean;
  hostName?: string;
  // Set for public-trip offers, where the copy is offer-specific: the traveller
  // confirms or declines (cancels), and the offering host withdraws (rejects).
  isOffer?: boolean;
  // The other person's first name, used for offer copy in both roles.
  otherName?: string;
}

function offerStatusText(
  t: ReturnType<typeof useTranslation>["t"],
  isHost: boolean,
  requestStatus: HostRequestStatus,
  isPast: boolean,
  otherName?: string,
): string {
  if (requestStatus === HostRequestStatus.HOST_REQUEST_STATUS_PENDING) {
    if (isPast) return t("host_request_item.expired");
    return isHost
      ? t("host_request_item.invitation_host_status.pending", { name: otherName })
      : t("host_request_item.invitation_surfer_status.pending");
  }
  if (isHost) {
    switch (requestStatus) {
      case HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED:
      case HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED:
        return t("host_request_item.invitation_host_status.accepted", {
          name: otherName,
        });
      case HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED:
        return t("host_request_item.invitation_host_status.declined", {
          name: otherName,
        });
      case HostRequestStatus.HOST_REQUEST_STATUS_REJECTED:
        return t("host_request_item.invitation_host_status.withdrawn");
    }
  } else {
    switch (requestStatus) {
      case HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED:
      case HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED:
        return t("host_request_item.invitation_surfer_status.accepted", {
          name: otherName,
        });
      case HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED:
        return t("host_request_item.invitation_surfer_status.declined");
      case HostRequestStatus.HOST_REQUEST_STATUS_REJECTED:
        return t("host_request_item.invitation_surfer_status.withdrawn", {
          name: otherName,
        });
    }
  }
  return "";
}

export default function HostRequestStatusText({
  isHost,
  requestStatus,
  isPast,
  hostName,
  isOffer = false,
  otherName,
}: HostRequestStatusTextProps) {
  const { t } = useTranslation(MESSAGES);

  let statusText = "";

  if (isOffer) {
    statusText = offerStatusText(t, isHost, requestStatus, isPast, otherName);
  } else {
    if (requestStatus === HostRequestStatus.HOST_REQUEST_STATUS_PENDING) {
      statusText = isPast ? t("host_request_item.expired") : t("host_request_item.pending");
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
          statusText = t("host_request_item.surfer_status.accepted", {
            name: hostName,
          });
          break;
        case HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED:
          statusText = t("host_request_item.surfer_status.cancelled");
          break;
        case HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED:
          statusText = t("host_request_item.surfer_status.confirmed", {
            name: hostName,
          });
          break;
        case HostRequestStatus.HOST_REQUEST_STATUS_REJECTED:
          statusText = t("host_request_item.surfer_status.rejected");
          break;
      }
    }
  }

  if (isPast) {
    statusText = statusText + ` (${t("host_request_status.past")})`;
  }

  return (
    <Typography variant="body2" sx={{ color: isPast ? theme.palette.grey[500] : "default" }}>
      {statusText}
    </Typography>
  );
}
