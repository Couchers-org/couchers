import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { HostRequestStatus } from "proto/conversations_pb";
import React from "react";

import FieldButton from "./FieldButton";

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

  const handleAccept = handleStatus(
    HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED
  );
  const handleReject = handleStatus(
    HostRequestStatus.HOST_REQUEST_STATUS_REJECTED
  );
  const handleCancel = handleStatus(
    HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED
  );
  const handleConfirm = handleStatus(
    HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED
  );

  if (isHost) {
    const canAccept =
      status === HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
      status === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED;

    const canReject =
      status === HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
      status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED ||
      status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED;

    return (
      <>
        {canAccept && (
          <FieldButton callback={handleAccept} isLoading={isLoading}>
            {t("global:accept")}
          </FieldButton>
        )}
        {canReject && (
          <ConfirmationDialogWrapper
            title={t("messages:close_request_dialog_title")}
            message={t("messages:close_request_dialog_host")}
            onConfirm={handleReject}
          >
            {(setIsOpen) => (
              <FieldButton
                isLoading={isLoading}
                callback={() => setIsOpen(true)}
              >
                {t("messages:close_request_button_text")}
              </FieldButton>
            )}
          </ConfirmationDialogWrapper>
        )}
      </>
    );
  } else {
    //user is the surfer
    const canConfirm =
      status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED;

    const canCancel =
      status === HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
      status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED ||
      status === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED ||
      status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED;

    return (
      <>
        {canConfirm && (
          <FieldButton callback={handleConfirm} isLoading={isLoading}>
            {t("messages:confirm_request_button_text")}
          </FieldButton>
        )}
        {canCancel && (
          <ConfirmationDialogWrapper
            title={t("messages:close_request_dialog_title")}
            message={t("messages:close_request_dialog_surfer")}
            onConfirm={handleCancel}
          >
            {(setIsOpen) => (
              <FieldButton
                isLoading={isLoading}
                callback={() => setIsOpen(true)}
              >
                {t("global:cancel")}
              </FieldButton>
            )}
          </ConfirmationDialogWrapper>
        )}
      </>
    );
  }
}
