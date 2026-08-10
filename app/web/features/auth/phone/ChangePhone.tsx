import "react-phone-number-input/style.css";

import { styled, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import { accountInfoQueryKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { AUTH } from "i18n/namespaces";
import luhn from "luhn";
import { Trans, useTranslation } from "next-i18next";
import { GetAccountInfoRes } from "proto/account_pb";
import { useForm } from "react-hook-form";
import { formatPhoneNumberIntl, isValidPhoneNumber } from "react-phone-number-input";
import PhoneInputWithCountry from "react-phone-number-input/react-hook-form";
import { howToDonateUrl } from "routes";
import { service } from "service";
import { theme } from "theme";

const StyledForm = styled("form")(() => ({
  marginBottom: theme.spacing(2),
  "& > * + *": {
    marginBlockStart: theme.spacing(1),
  },
}));

const validatePhoneCode = (code: string) => code.length == 6 && luhn.validate(code);

interface ChangePhoneFormData {
  phone: string;
}

interface VerifyPhoneFormData {
  code: string;
}

type ChangePhoneProps = {
  accountInfo: GetAccountInfoRes.AsObject;
  className?: string;
};

export default function ChangePhone({ className, accountInfo }: ChangePhoneProps) {
  const { t } = useTranslation([AUTH]);
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const queryClient = useQueryClient();

  const { handleSubmit: changeHandleSubmit, reset: resetChangeForm, control } = useForm<ChangePhoneFormData>();
  const onChangeSubmit = changeHandleSubmit(({ phone }) => {
    changePhone({ phone });
  });

  const {
    error: changeError,
    isPending: isChangeLoading,
    isSuccess: isChangeSuccess,
    mutate: changePhone,
    reset: resetChange,
  } = useMutation<Empty, RpcError, ChangePhoneFormData>({
    mutationFn: ({ phone }) => service.account.changePhone(phone),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [accountInfoQueryKey],
      });
      resetChangeForm();
      resetVerify();
      resetRemove();
    },
  });

  const {
    handleSubmit: verifyHandleSubmit,
    register: verifyRegister,
    reset: resetVerifyForm,
    formState: { errors: verifyFormErrors },
  } = useForm<VerifyPhoneFormData>({ mode: "onBlur" });
  const onVerifySubmit = verifyHandleSubmit(({ code }) => {
    verifyPhone({ code });
  });

  const {
    error: verifyError,
    isPending: isVerifyLoading,
    isSuccess: isVerifySuccess,
    mutate: verifyPhone,
    reset: resetVerify,
  } = useMutation<Empty, RpcError, VerifyPhoneFormData>({
    mutationFn: ({ code }) => service.account.verifyPhone(code),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [accountInfoQueryKey],
      });
      resetVerifyForm();
      resetChange();
      resetRemove();
    },
  });

  const {
    error: removeError,
    isPending: isRemoveLoading,
    isSuccess: isRemoveSuccess,
    mutate: removePhone,
    reset: resetRemove,
  } = useMutation<Empty, RpcError>({
    mutationFn: () => service.account.removePhone(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [accountInfoQueryKey],
      });
      resetChangeForm();
      resetVerifyForm();
      resetChange();
      resetVerify();
    },
  });

  return (
    <div className={className}>
      <Typography variant="h2">{t("auth:change_phone.title")}</Typography>
      {changeError && <Alert severity="error">{changeError.message}</Alert>}
      {verifyError && <Alert severity="error">{verifyError.message}</Alert>}
      {removeError && <Alert severity="error">{removeError.message}</Alert>}
      {isChangeSuccess && <Alert severity="success">{t("auth:change_phone.add_success")}</Alert>}
      {isVerifySuccess && <Alert severity="success">{t("auth:change_phone.verify_success")}</Alert>}
      {isRemoveSuccess && <Alert severity="success">{t("auth:change_phone.remove_success")}</Alert>}
      {!accountInfo.phone ? (
        !accountInfo.hasDonated ? (
          <Typography variant="body1">
            <Trans
              i18nKey="auth:change_phone.need_to_donate"
              components={{
                2: <StyledLink href={howToDonateUrl} />,
              }}
            />
          </Typography>
        ) : (
          <StyledForm onSubmit={onChangeSubmit}>
            <Typography variant="body1">{t("auth:change_phone.no_phone_description")}</Typography>
            <PhoneInputWithCountry
              name="phone"
              control={control}
              rules={{
                validate: (value: string) => isValidPhoneNumber(value),
              }}
              international
              placeholder={t("auth:change_phone.phone_label")}
              id="phone"
            />
            <Button fullWidth={!isMdOrWider} loading={isChangeLoading} type="submit">
              {t("auth:change_phone.add_button_text")}
            </Button>
          </StyledForm>
        )
      ) : (
        <>
          {!accountInfo.phoneVerified ? (
            <StyledForm onSubmit={onVerifySubmit}>
              <Typography variant="body1">
                <Trans
                  t={t}
                  i18nKey="auth:change_phone.phone_not_verified_description"
                  values={{ phone: formatPhoneNumberIntl(accountInfo.phone) }}
                  components={{ 2: <b /> }}
                />
              </Typography>
              <TextField
                id="code"
                {...verifyRegister("code", {
                  required: true,
                  validate: (code) => validatePhoneCode(code) || t("auth:change_phone.wrong_code"),
                })}
                helperText={verifyFormErrors?.code?.message ?? " "}
                error={!!verifyFormErrors?.code?.message}
                label={t("auth:change_phone.code_label")}
                fullWidth={!isMdOrWider}
              />
              <Button fullWidth={!isMdOrWider} loading={isVerifyLoading} type="submit">
                {t("auth:change_phone.verify_button_text")}
              </Button>
            </StyledForm>
          ) : (
            <>
              <Typography variant="body1">
                <Trans
                  t={t}
                  i18nKey="auth:change_phone.remove_phone_description"
                  values={{ phone: formatPhoneNumberIntl(accountInfo.phone) }}
                  components={{ 2: <b /> }}
                />
              </Typography>
              <Button fullWidth={!isMdOrWider} loading={isRemoveLoading} onClick={() => removePhone()}>
                {t("auth:change_phone.remove_button_text")}
              </Button>
            </>
          )}
          <StyledForm onSubmit={onChangeSubmit}>
            <Typography variant="body1">{t("auth:change_phone.change_to_different_description")}</Typography>
            <PhoneInputWithCountry
              name="phone"
              control={control}
              rules={{
                validate: (value: string) => isValidPhoneNumber(value),
              }}
              countrySelectProps={{ unicodeFlags: true }}
              international
              placeholder={t("auth:change_phone.phone_label")}
              id="phone"
            />
            <Button fullWidth={!isMdOrWider} loading={isChangeLoading} type="submit">
              {t("auth:change_phone.change_button_text")}
            </Button>
          </StyledForm>
        </>
      )}
    </div>
  );
}
