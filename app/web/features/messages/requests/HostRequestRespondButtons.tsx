import { Box, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { HostRequestStatus } from "proto/conversations_pb";

import FieldButton from "./FieldButton";

const StyledCard = styled(Box)(({ theme }) => ({
  background: "var(--mui-palette-grey-50)",
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  alignSelf: "flex-start",
}));

const StyledButtonRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  justifyContent: "flex-end",
}));

export default function HostRequestRespondButtons({
  isHost,
  status,
  isLoading,
  handleStatus,
}: {
  isHost: boolean;
  status: HostRequestStatus;
  isLoading: boolean;
  handleStatus: (status: HostRequestStatus) => () => void;
}) {
  const { t } = useTranslation([MESSAGES, GLOBAL]);

  if (!isHost) return null;

  if (status !== HostRequestStatus.HOST_REQUEST_STATUS_PENDING) return null;

  return (
    <StyledCard>
      <div>
        <Typography variant="subtitle2">
          {t("messages:respond_box_title")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("messages:respond_box_description")}
        </Typography>
      </div>
      <StyledButtonRow>
        <FieldButton
          isLoading={isLoading}
          callback={handleStatus(
            HostRequestStatus.HOST_REQUEST_STATUS_REJECTED,
          )}
          variant="outlined"
        >
          {t("messages:close_request_button_text")}
        </FieldButton>
        <FieldButton
          callback={handleStatus(
            HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED,
          )}
          isLoading={isLoading}
        >
          {t("global:accept")}
        </FieldButton>
      </StyledButtonRow>
    </StyledCard>
  );
}
