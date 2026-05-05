import { styled, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import TextField from "components/TextField";
import {
  postalVerificationAttemptsQueryKey,
  postalVerificationStatusQueryKey,
} from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import {
  ConfirmPostalAddressRes,
  GetPostalVerificationStatusRes,
  InitiatePostalVerificationRes,
  ListPostalVerificationAttemptsRes,
  PostalAddress,
  PostalVerificationStatus,
  VerifyPostalCodeRes,
} from "proto/postal_verification_pb";
import { useForm } from "react-hook-form";
import { service } from "service";
import { localizeDateTime, timestamp2Date } from "utils/date";

const StyledForm = styled("form")(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& > * + *": {
    marginBlockStart: theme.spacing(1),
  },
}));

const AddressBlock = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: `1px solid var(--mui-palette-divider)`,
  borderRadius: theme.shape.borderRadius,
}));

const HistoryItem = styled("div")(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderTop: `1px solid var(--mui-palette-divider)`,
}));

const COUNTRY_CODE_PATTERN = /^[A-Za-z]{2}$/;
const VERIFICATION_CODE_PATTERN = /^[A-Za-z0-9]{6}$/;

interface AddressFormData {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
}

interface CodeFormData {
  code: string;
}

function formatAddress(address: PostalAddress.AsObject) {
  const lines = [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state, address.postalCode]
      .filter((s) => s.length > 0)
      .join(", "),
    address.countryCode,
  ].filter((s) => s && s.length > 0);
  return lines;
}

type PostalVerificationProps = {
  className?: string;
};

export default function PostalVerification({
  className,
}: PostalVerificationProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(AUTH);
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const queryClient = useQueryClient();

  const {
    data: status,
    error: statusError,
    isLoading: isStatusLoading,
  } = useQuery<GetPostalVerificationStatusRes.AsObject, RpcError>({
    queryKey: [postalVerificationStatusQueryKey],
    queryFn: () => service.postalVerification.getPostalVerificationStatus(),
  });

  const { data: attempts } = useQuery<
    ListPostalVerificationAttemptsRes.AsObject,
    RpcError
  >({
    queryKey: [postalVerificationAttemptsQueryKey],
    queryFn: () => service.postalVerification.listPostalVerificationAttempts(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: [postalVerificationStatusQueryKey],
    });
    queryClient.invalidateQueries({
      queryKey: [postalVerificationAttemptsQueryKey],
    });
  };

  const {
    handleSubmit: handleAddressSubmit,
    register: registerAddress,
    reset: resetAddressForm,
    formState: { errors: addressErrors },
  } = useForm<AddressFormData>({ mode: "onBlur" });

  const {
    error: initiateError,
    isPending: isInitiateLoading,
    mutate: initiate,
  } = useMutation<
    InitiatePostalVerificationRes.AsObject,
    RpcError,
    AddressFormData
  >({
    mutationFn: (form) =>
      service.postalVerification.initiatePostalVerification({
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        countryCode: form.countryCode.trim().toUpperCase(),
      }),
    onSuccess: () => {
      resetAddressForm();
      invalidate();
    },
  });

  const onAddressSubmit = handleAddressSubmit((form) => initiate(form));

  const {
    error: confirmError,
    isPending: isConfirmLoading,
    isSuccess: isConfirmSuccess,
    mutate: confirmAddress,
  } = useMutation<ConfirmPostalAddressRes.AsObject, RpcError, number>({
    mutationFn: (attemptId) =>
      service.postalVerification.confirmPostalAddress(attemptId),
    onSuccess: () => {
      invalidate();
    },
  });

  const {
    error: cancelError,
    isPending: isCancelLoading,
    isSuccess: isCancelSuccess,
    mutate: cancelAttempt,
  } = useMutation<Empty, RpcError, number>({
    mutationFn: (attemptId) =>
      service.postalVerification.cancelPostalVerification(attemptId),
    onSuccess: () => {
      invalidate();
    },
  });

  const {
    handleSubmit: handleCodeSubmit,
    register: registerCode,
    reset: resetCodeForm,
    formState: { errors: codeErrors },
  } = useForm<CodeFormData>({ mode: "onBlur" });

  const {
    data: verifyData,
    error: verifyError,
    isPending: isVerifyLoading,
    mutate: verifyCode,
  } = useMutation<VerifyPostalCodeRes.AsObject, RpcError, CodeFormData>({
    mutationFn: ({ code }) =>
      service.postalVerification.verifyPostalCode(code.trim().toUpperCase()),
    onSuccess: (data) => {
      if (data.success) {
        resetCodeForm();
      }
      invalidate();
    },
  });

  const onCodeSubmit = handleCodeSubmit((form) => verifyCode(form));

  const statusLabel = (status: PostalVerificationStatus) => {
    switch (status) {
      case PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_SUCCEEDED:
        return t("postal_verification.history_status_succeeded");
      case PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_FAILED:
        return t("postal_verification.history_status_failed");
      case PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_CANCELLED:
        return t("postal_verification.history_status_cancelled");
      case PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_IN_PROGRESS:
        return t("postal_verification.history_status_in_progress");
      case PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_AWAITING_VERIFICATION:
        return t("postal_verification.history_status_awaiting_verification");
      case PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_PENDING_ADDRESS_CONFIRMATION:
        return t(
          "postal_verification.history_status_pending_address_confirmation",
        );
      default:
        return "";
    }
  };

  const renderStatusLine = () => {
    if (!status) return null;
    if (status.hasPostalVerification) {
      return (
        <Typography variant="body1" gutterBottom>
          <Trans
            t={t}
            i18nKey="postal_verification.status.verified"
            components={{ 1: <strong /> }}
          />
        </Typography>
      );
    }
    return (
      <Typography variant="body1" gutterBottom>
        <Trans
          t={t}
          i18nKey="postal_verification.status.not_verified"
          components={{ 1: <strong /> }}
        />
      </Typography>
    );
  };

  const renderActiveAttempt = () => {
    if (!status || !status.hasActiveAttempt || !status.address) return null;
    const attemptId = status.postalVerificationAttemptId;

    if (
      status.status ===
      PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_PENDING_ADDRESS_CONFIRMATION
    ) {
      return (
        <>
          <Typography variant="body1" gutterBottom>
            {t("postal_verification.status.pending_address_confirmation")}
          </Typography>
          <AddressBlock>
            {formatAddress(status.address).map((line, i) => (
              <Typography variant="body1" key={i}>
                {line}
              </Typography>
            ))}
          </AddressBlock>
          <Button
            loading={isConfirmLoading}
            onClick={() => confirmAddress(attemptId)}
          >
            {t("postal_verification.confirm_address.confirm_button")}
          </Button>{" "}
          <Button
            variant="outlined"
            loading={isCancelLoading}
            onClick={() => cancelAttempt(attemptId)}
          >
            {t("postal_verification.confirm_address.edit_button")}
          </Button>
        </>
      );
    }

    if (
      status.status ===
      PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_IN_PROGRESS
    ) {
      return (
        <>
          <Typography variant="body1" gutterBottom>
            {t("postal_verification.status.in_progress")}
          </Typography>
          <Button
            variant="outlined"
            loading={isCancelLoading}
            onClick={() => cancelAttempt(attemptId)}
          >
            {t("postal_verification.cancel_button")}
          </Button>
        </>
      );
    }

    if (
      status.status ===
      PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_AWAITING_VERIFICATION
    ) {
      const sentDate = status.postcardSentAt
        ? localizeDateTime(timestamp2Date(status.postcardSentAt), {
            locale,
            includeTime: false,
            abbreviate: true,
          })
        : null;
      return (
        <>
          <Typography variant="body1" gutterBottom>
            {sentDate ? (
              <Trans
                t={t}
                i18nKey="postal_verification.status.awaiting_verification"
                values={{ sent_date: sentDate }}
                components={{ 1: <strong /> }}
              />
            ) : (
              t("postal_verification.status.awaiting_verification_no_date")
            )}
          </Typography>
          <StyledForm onSubmit={onCodeSubmit}>
            <Typography variant="body1">
              {t("postal_verification.code_form.description")}
            </Typography>
            <TextField
              id="postal-verification-code"
              {...registerCode("code", {
                required: t("postal_verification.code_form.wrong_format_error"),
                validate: (value) =>
                  VERIFICATION_CODE_PATTERN.test(value.trim()) ||
                  t("postal_verification.code_form.wrong_format_error"),
              })}
              label={t("postal_verification.code_form.code_label")}
              helperText={codeErrors.code?.message ?? " "}
              error={!!codeErrors.code}
              fullWidth={!isMdOrWider}
            />
            <Button
              fullWidth={!isMdOrWider}
              loading={isVerifyLoading}
              type="submit"
            >
              {t("postal_verification.code_form.submit_button")}
            </Button>
          </StyledForm>
          <Button
            variant="outlined"
            loading={isCancelLoading}
            onClick={() => cancelAttempt(attemptId)}
          >
            {t("postal_verification.cancel_button")}
          </Button>
        </>
      );
    }

    return null;
  };

  const renderStartForm = () => {
    if (!status || status.hasActiveAttempt) return null;
    if (!status.canInitiateNewAttempt) {
      const nextDate = status.nextAttemptAllowedAt
        ? localizeDateTime(timestamp2Date(status.nextAttemptAllowedAt), {
            locale,
            includeTime: false,
            abbreviate: true,
          })
        : null;
      if (nextDate) {
        return (
          <Typography variant="body1">
            <Trans
              t={t}
              i18nKey="postal_verification.rate_limited"
              values={{ next_attempt_date: nextDate }}
              components={{ 1: <strong /> }}
            />
          </Typography>
        );
      }
      return null;
    }

    const isRetry =
      status.status !==
      PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_UNKNOWN;

    return (
      <StyledForm onSubmit={onAddressSubmit}>
        <Typography variant="body1">
          {t("postal_verification.address_form.description")}
        </Typography>
        <TextField
          id="postal-address-line-1"
          {...registerAddress("addressLine1", {
            required: t("postal_verification.address_form.required_error"),
          })}
          label={t("postal_verification.address_form.address_line_1_label")}
          helperText={addressErrors.addressLine1?.message ?? " "}
          error={!!addressErrors.addressLine1}
          fullWidth
        />
        <TextField
          id="postal-address-line-2"
          {...registerAddress("addressLine2")}
          label={t("postal_verification.address_form.address_line_2_label")}
          fullWidth
        />
        <TextField
          id="postal-address-city"
          {...registerAddress("city", {
            required: t("postal_verification.address_form.required_error"),
          })}
          label={t("postal_verification.address_form.city_label")}
          helperText={addressErrors.city?.message ?? " "}
          error={!!addressErrors.city}
          fullWidth
        />
        <TextField
          id="postal-address-state"
          {...registerAddress("state")}
          label={t("postal_verification.address_form.state_label")}
          fullWidth
        />
        <TextField
          id="postal-address-postal-code"
          {...registerAddress("postalCode")}
          label={t("postal_verification.address_form.postal_code_label")}
          fullWidth
        />
        <TextField
          id="postal-address-country-code"
          {...registerAddress("countryCode", {
            required: t("postal_verification.address_form.required_error"),
            validate: (value) =>
              COUNTRY_CODE_PATTERN.test(value.trim()) ||
              t(
                "postal_verification.address_form.country_code_validation_error",
              ),
          })}
          label={t("postal_verification.address_form.country_code_label")}
          helperText={
            addressErrors.countryCode?.message ??
            t("postal_verification.address_form.country_code_helper")
          }
          error={!!addressErrors.countryCode}
          fullWidth={!isMdOrWider}
        />
        <Button
          fullWidth={!isMdOrWider}
          loading={isInitiateLoading}
          type="submit"
        >
          {isRetry
            ? t("postal_verification.start_new_button")
            : t("postal_verification.start_button")}
        </Button>
      </StyledForm>
    );
  };

  const renderHistory = () => {
    if (!attempts || attempts.attemptsList.length === 0) return null;
    return (
      <>
        <Typography variant="h3">
          {t("postal_verification.history_title")}
        </Typography>
        {attempts.attemptsList.map((attempt) => (
          <HistoryItem key={attempt.postalVerificationAttemptId}>
            <Typography variant="body2">
              {attempt.created
                ? localizeDateTime(timestamp2Date(attempt.created), {
                    locale,
                    includeTime: false,
                    abbreviate: true,
                  })
                : null}
              {" — "}
              {statusLabel(attempt.status)}
            </Typography>
            {attempt.address ? (
              <Typography variant="body2" color="text.secondary">
                {formatAddress(attempt.address).join(" · ")}
              </Typography>
            ) : null}
          </HistoryItem>
        ))}
      </>
    );
  };

  const successAlert = () => {
    if (verifyData?.success) {
      return (
        <Alert severity="success">
          {t("postal_verification.verify_success")}
        </Alert>
      );
    }
    if (verifyData && !verifyData.success) {
      return (
        <Alert severity="error">
          {t("postal_verification.code_form.incorrect_code", {
            remaining: verifyData.remainingAttempts,
          })}
        </Alert>
      );
    }
    if (isConfirmSuccess) {
      return (
        <Alert severity="success">
          {t("postal_verification.confirm_success")}
        </Alert>
      );
    }
    if (isCancelSuccess) {
      return (
        <Alert severity="success">
          {t("postal_verification.cancel_success")}
        </Alert>
      );
    }
    return null;
  };

  return (
    <div className={className} id="postal-verification">
      <Typography variant="h2">{t("postal_verification.title")}</Typography>
      <Typography variant="body1" gutterBottom>
        {t("postal_verification.subtitle")}
      </Typography>
      {isStatusLoading ? (
        <CenteredSpinner />
      ) : statusError ? (
        <Alert severity="error">{statusError.message}</Alert>
      ) : status ? (
        <>
          {renderStatusLine()}
          {initiateError && (
            <Alert severity="error">{initiateError.message}</Alert>
          )}
          {confirmError && (
            <Alert severity="error">{confirmError.message}</Alert>
          )}
          {cancelError && <Alert severity="error">{cancelError.message}</Alert>}
          {verifyError && <Alert severity="error">{verifyError.message}</Alert>}
          {successAlert()}
          {renderActiveAttempt()}
          {renderStartForm()}
          {renderHistory()}
        </>
      ) : null}
    </div>
  );
}
