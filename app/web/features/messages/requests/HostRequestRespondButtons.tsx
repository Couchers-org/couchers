import { Box, styled, Typography } from "@mui/material";
import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { HostRequestStatus } from "proto/messages_pb";

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
  name,
}: {
  isHost: boolean;
  status: HostRequestStatus;
  isLoading: boolean;
  handleStatus: (status: HostRequestStatus) => () => void;
  name?: string;
}) {
  const { t } = useTranslation([MESSAGES, GLOBAL]);

  if (isHost) {
    if (status !== HostRequestStatus.HOST_REQUEST_STATUS_PENDING) return null;

    return (
      <StyledCard>
        <div>
          <Typography variant="subtitle2">{t("messages:respond_box_title")}</Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
            }}
          >
            {t("messages:respond_box_description", { name })}
          </Typography>
        </div>
        <StyledButtonRow>
          <FieldButton
            isLoading={isLoading}
            callback={handleStatus(HostRequestStatus.HOST_REQUEST_STATUS_REJECTED)}
            variant="outlined"
          >
            {t("messages:close_request_button_text")}
          </FieldButton>
          <FieldButton callback={handleStatus(HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED)} isLoading={isLoading}>
            {t("global:accept")}
          </FieldButton>
        </StyledButtonRow>
      </StyledCard>
    );
  }

  if (status !== HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) return null;

  return (
    <StyledCard>
      <div>
        <Typography variant="subtitle2">{t("messages:surfer_confirm_box_title", { name })}</Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
          }}
        >
          {t("messages:surfer_confirm_box_description")}
        </Typography>
      </div>
      <StyledButtonRow>
        <ConfirmationDialogWrapper
          title={t("messages:cancel_request_dialog_title")}
          message={t("messages:cancel_request_dialog_message")}
          confirmButtonLabel={t("messages:cancel_request_dialog_confirm_button")}
          cancelButtonLabel={t("messages:cancel_request_dialog_dismiss_button")}
          onConfirm={handleStatus(HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED)}
        >
          {(setIsOpen) => (
            <FieldButton isLoading={isLoading} callback={() => setIsOpen(true)} variant="outlined">
              {t("messages:cancel_request_button")}
            </FieldButton>
          )}
        </ConfirmationDialogWrapper>
        <FieldButton callback={handleStatus(HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED)} isLoading={isLoading}>
          {t("messages:confirm_request_button_text")}
        </FieldButton>
      </StyledButtonRow>
    </StyledCard>
  );
}
