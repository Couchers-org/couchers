import React from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
// import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import { useAuthContext } from "features/auth/AuthProvider";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { HostRequestStatus } from "proto/conversations_pb";
import { HostRequest, RespondHostRequestReq } from "proto/requests_pb";
import { UseMutationResult } from "react-query";
import { useForm } from "react-hook-form";
import ConfirmationDialogWrapper from "@/components/ConfirmationDialogWrapper";
import { router } from "expo-router";
import { leaveReferenceBaseRoute, referenceTypeRoute } from "@/routes";
import { ReferenceType } from "@/proto/references_pb";

interface MessageFormData {
  text: string;
}

export interface HostRequestSendFieldProps {
  hostRequest: HostRequest.AsObject;
  sendMutation: UseMutationResult<string | undefined | Empty, RpcError, string>;
  respondMutation: UseMutationResult<
    unknown,
    RpcError,
    Required<RespondHostRequestReq.AsObject>
  >;
}

const FieldButton = ({
  children,
  callback,
  disabled = false,
  isLoading,
}: {
  children: React.ReactNode;
  callback: () => void;
  disabled?: boolean;
  isLoading: boolean;
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      disabled={disabled || isLoading}
      onPress={callback}
    >
      <Text style={styles.buttonText}>{children}</Text>
    </TouchableOpacity>
  );
};

export default function HostRequestSendField({
  hostRequest,
  sendMutation,
  respondMutation,
}: HostRequestSendFieldProps) {
  const { t } = useTranslation([MESSAGES, GLOBAL]);
  const { authState } = useAuthContext();

  const isHost = hostRequest.hostUserId === authState.userId;

  const { data: availableRefrences } = useListAvailableReferences(
    isHost ? hostRequest.surferUserId : hostRequest.hostUserId
  );

  const { mutate: handleSend, isLoading } = sendMutation;
  const { mutate: handleRespond, isLoading: isResponseLoading } =
    respondMutation;

  const { handleSubmit, reset, setValue, getValues } = useForm<MessageFormData>();

  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    handleSend(data.text);
    reset();
  });

  const handleStatus = (status: HostRequestStatus) =>
    handleSubmit(async (data: MessageFormData) => {
      handleRespond({
        hostRequestId: hostRequest.hostRequestId,
        status,
        text: data.text,
      });
      reset();
    });
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

  const isButtonLoading = isLoading || isResponseLoading;

  const isRequestClosed =
    hostRequest.toDate < new Date().toISOString().split("T")[0] ||
    hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED ||
    hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED;

  const isReferenceAvailable =
    (hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED ||
      hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) &&
    availableRefrences &&
    availableRefrences.availableWriteReferencesList.find(
      ({ hostRequestId }) => hostRequestId === hostRequest.hostRequestId
    );

  return (
    <View>
      <View style={styles.buttonContainer}>
        {isHost ? (
          <>
            {(hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_REJECTED) && (
              <FieldButton
                callback={handleAccept}
                disabled={isRequestClosed}
                isLoading={isButtonLoading}
              >
                {t("global:accept")}
              </FieldButton>
            )}
            {(hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) && (
              <ConfirmationDialogWrapper
                title={t("messages:close_request_dialog_title")}
                message={t("messages:close_request_dialog_host")}
                onConfirm={handleReject}
              >
                {(setIsOpen) => (
                  <FieldButton
                    isLoading={isButtonLoading}
                    callback={() => setIsOpen(true)}
                  >
                    {t("messages:close_request_button_text")}
                  </FieldButton>
                )}
              </ConfirmationDialogWrapper>
            )}
            {isReferenceAvailable && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  // Replace Link component with TouchableOpacity
                  // Implement navigation to the reference page
                }}
              >
                <Text style={styles.buttonText}>
                  {t("messages:write_reference_button_text")}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          //user is the surfer
          <>
            {hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED && (
              <FieldButton callback={handleConfirm} isLoading={isButtonLoading}>
                {t("messages:confirm_request_button_text")}
              </FieldButton>
            )}
            {(hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_REJECTED ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) && (
              <ConfirmationDialogWrapper
                title={t("messages:close_request_dialog_title")}
                message={t("messages:close_request_dialog_surfer")}
                onConfirm={handleCancel}
              >
                {(setIsOpen) => (
                  <FieldButton
                    isLoading={isButtonLoading}
                    callback={() => setIsOpen(true)}
                  >
                    {t("global:cancel")}
                  </FieldButton>
                )}
              </ConfirmationDialogWrapper>
            )}
            {isReferenceAvailable && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  router.push(`${leaveReferenceBaseRoute}/${
                    referenceTypeRoute[ReferenceType.REFERENCE_TYPE_HOSTED]
                  }/${hostRequest.surferUserId}/${hostRequest.hostRequestId}` as any);
                }}
              >
                <Text style={styles.buttonText}>
                  {t("messages:write_reference_button_text")}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      <View style={styles.container}>
        <TextInput
          id="text"
          defaultValue={
            isRequestClosed ? t("messages:request_closed_message") : ""
          }
          editable={!isRequestClosed}
          placeholder={!isRequestClosed ? t("messages:chat_input.label") : ""}
          multiline
          onChangeText={(text) => setValue("text", text)}
          value={getValues("text")}
          maxLength={1000}
          style={[
            styles.textField,
            isRequestClosed && styles.textFieldDisabled,
          ]}
        />
        <FieldButton
          callback={onSubmit}
          disabled={isRequestClosed}
          isLoading={isButtonLoading}
        >
          {t("global:send")}
        </FieldButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
  },
  textField: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  textFieldDisabled: {
    backgroundColor: "#f0f0f0",
  },
});
