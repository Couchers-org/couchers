import { Container, styled, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import {
  postalVerificationAttemptsQueryKey,
  postalVerificationStatusQueryKey,
} from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { useRouter } from "next/router";
import {
  GetPostalVerificationStatusRes,
  PostalVerificationStatus,
  VerifyPostalCodeRes,
} from "proto/postal_verification_pb";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { settingsRoute } from "routes";
import { service } from "service";
import { theme } from "theme";
import stringOrFirstString from "utils/stringOrFirstString";

const StyledForm = styled("form")(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& > * + *": {
    marginBlockStart: theme.spacing(1),
  },
}));

const VERIFICATION_CODE_PATTERN = /^[A-Za-z0-9]{6}$/;

interface CodeFormData {
  code: string;
}

export default function CompletePostalVerification() {
  const { t } = useTranslation(AUTH);
  const router = useRouter();
  const queryClient = useQueryClient();

  const initialCode = (stringOrFirstString(router.query.c) ?? "")
    .trim()
    .toUpperCase();

  const {
    data: status,
    error: statusError,
    isLoading: isStatusLoading,
  } = useQuery<GetPostalVerificationStatusRes.AsObject, RpcError>({
    queryKey: [postalVerificationStatusQueryKey],
    queryFn: () => service.postalVerification.getPostalVerificationStatus(),
  });

  const {
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<CodeFormData>({ mode: "onBlur" });

  useEffect(() => {
    if (initialCode) {
      setValue("code", initialCode);
    }
  }, [initialCode, setValue]);

  const {
    data: verifyData,
    error: verifyError,
    isPending: isVerifyLoading,
    mutate: verifyCode,
  } = useMutation<VerifyPostalCodeRes.AsObject, RpcError, CodeFormData>({
    mutationFn: ({ code }) =>
      service.postalVerification.verifyPostalCode(code.trim().toUpperCase()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [postalVerificationStatusQueryKey],
      });
      queryClient.invalidateQueries({
        queryKey: [postalVerificationAttemptsQueryKey],
      });
    },
  });

  const onSubmit = handleSubmit((form) => verifyCode(form));

  const isAwaitingVerification =
    status?.hasActiveAttempt &&
    status.status ===
      PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_AWAITING_VERIFICATION;

  return (
    <>
      <HtmlMeta title={t("postal_verification.complete_page.title")} />
      <Container maxWidth="md" sx={{ marginTop: theme.spacing(3) }}>
        <PageTitle>{t("postal_verification.complete_page.title")}</PageTitle>
        <Typography variant="body1" gutterBottom>
          {t("postal_verification.complete_page.description")}
        </Typography>
        {isStatusLoading ? (
          <CenteredSpinner />
        ) : statusError ? (
          <Alert severity="error">{statusError.message}</Alert>
        ) : !isAwaitingVerification ? (
          <>
            <Alert severity="info">
              {t("postal_verification.complete_page.no_active_attempt")}
            </Alert>
            <Typography variant="body1">
              <StyledLink href={settingsRoute}>
                {t("postal_verification.complete_page.back_to_settings")}
              </StyledLink>
            </Typography>
          </>
        ) : (
          <>
            {verifyError && (
              <Alert severity="error">{verifyError.message}</Alert>
            )}
            {verifyData?.success && (
              <Alert severity="success">
                {t("postal_verification.verify_success")}
              </Alert>
            )}
            {verifyData && !verifyData.success && (
              <Alert severity="error">
                {t("postal_verification.code_form.incorrect_code", {
                  remaining: verifyData.remainingAttempts,
                })}
              </Alert>
            )}
            {verifyData?.success ? (
              <Typography variant="body1">
                <StyledLink href={settingsRoute}>
                  {t("postal_verification.complete_page.back_to_settings")}
                </StyledLink>
              </Typography>
            ) : (
              <StyledForm onSubmit={onSubmit}>
                <TextField
                  id="postal-verification-complete-code"
                  {...register("code", {
                    required: t(
                      "postal_verification.code_form.wrong_format_error",
                    ),
                    validate: (value) =>
                      VERIFICATION_CODE_PATTERN.test(value.trim()) ||
                      t("postal_verification.code_form.wrong_format_error"),
                  })}
                  label={t("postal_verification.code_form.code_label")}
                  helperText={errors.code?.message ?? " "}
                  error={!!errors.code}
                  fullWidth
                />
                <Button loading={isVerifyLoading} type="submit">
                  {t("postal_verification.code_form.submit_button")}
                </Button>
              </StyledForm>
            )}
          </>
        )}
      </Container>
    </>
  );
}
