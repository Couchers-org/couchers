import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { accountInfoQueryKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "next-i18next";
import { GetAccountInfoRes } from "proto/account_pb";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

import useChangeDetailsFormStyles from "../useChangeDetailsFormStyles";

interface ChangePhoneFormData {
  phone: string;
}

interface VerifyPhoneFormData {
  code: string;
}

type ChangePhoneProps = GetAccountInfoRes.AsObject & {
  className?: string;
};

export default function ChangePhone(props: ChangePhoneProps) {
  const { t } = useTranslation(["auth"]);
  const { className } = props;
  const formClasses = useChangeDetailsFormStyles();
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const queryClient = useQueryClient();

  const {
    handleSubmit: changeHandleSubmit,
    register: changeRegister,
    reset: resetChangeForm,
  } = useForm<ChangePhoneFormData>();
  const onChangeSubmit = changeHandleSubmit(({ phone }) => {
    changePhone({ phone });
  });

  const {
    error: changeError,
    isLoading: isChangeLoading,
    isSuccess: isChangeSuccess,
    mutate: changePhone,
    reset: resetChange,
  } = useMutation<Empty, RpcError, ChangePhoneFormData>(
    ({ phone }) => service.account.changePhone(phone),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(accountInfoQueryKey);
        resetChangeForm();
        resetVerify();
        resetRemove();
      },
    }
  );

  const {
    handleSubmit: verifyHandleSubmit,
    register: verifyRegister,
    reset: resetVerifyForm,
  } = useForm<VerifyPhoneFormData>();
  const onVerifySubmit = verifyHandleSubmit(({ code }) => {
    verifyPhone({ code });
  });

  const {
    error: verifyError,
    isLoading: isVerifyLoading,
    isSuccess: isVerifySuccess,
    mutate: verifyPhone,
    reset: resetVerify,
  } = useMutation<Empty, RpcError, VerifyPhoneFormData>(
    ({ code }) => service.account.verifyPhone(code),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(accountInfoQueryKey);
        resetVerifyForm();
        resetChange();
        resetRemove();
      },
    }
  );

  const {
    error: removeError,
    isLoading: isRemoveLoading,
    isSuccess: isRemoveSuccess,
    mutate: removePhone,
    reset: resetRemove,
  } = useMutation<Empty, RpcError>(service.account.removePhone, {
    onSuccess: () => {
      queryClient.invalidateQueries(accountInfoQueryKey);
      resetChangeForm();
      resetVerifyForm();
      resetChange();
      resetVerify();
    },
  });

  return (
    <div className={className}>
      {changeError && <Alert severity="error">{changeError.message}</Alert>}
      {verifyError && <Alert severity="error">{verifyError.message}</Alert>}
      {removeError && <Alert severity="error">{removeError.message}</Alert>}
      {isChangeSuccess && (
        <Alert severity="success">
          {t("auth:change_phone_form.add_success")}
        </Alert>
      )}
      {isVerifySuccess && (
        <Alert severity="success">
          {t("auth:change_phone_form.verify_success")}
        </Alert>
      )}
      {isRemoveSuccess && (
        <Alert severity="success">
          {t("auth:change_phone_form.remove_success")}
        </Alert>
      )}
      <Typography variant="h2">{t("auth:change_phone_form.title")}</Typography>
      {!props.phone ? (
        <form className={formClasses.form} onSubmit={onChangeSubmit}>
          <Typography variant="body1">
            {t("auth:change_phone_form.no_phone_description")}
          </Typography>
          <TextField
            id="phone"
            inputRef={changeRegister({ required: true })}
            label={t("auth:change_phone_form.phone_label")}
            name="phone"
            fullWidth={!isMdOrWider}
          />
          <Button
            fullWidth={!isMdOrWider}
            loading={isChangeLoading}
            type="submit"
          >
            {t("auth:change_phone_form.add_button_text")}
          </Button>
        </form>
      ) : (
        <>
          {!props.phoneVerified ? (
            <form className={formClasses.form} onSubmit={onVerifySubmit}>
              <Typography variant="body1">
                <Trans
                  t={t}
                  i18nKey="auth:change_phone_form.phone_not_verified_description"
                >
                  We sent you a code to <b>{{ phone: props.phone }}</b>. To
                  verify your number, please enter the code below:
                </Trans>
              </Typography>
              <TextField
                id="code"
                inputRef={verifyRegister({ required: true })}
                label={t("auth:change_phone_form.code_label")}
                name="code"
                fullWidth={!isMdOrWider}
              />
              <Button
                fullWidth={!isMdOrWider}
                loading={isVerifyLoading}
                type="submit"
              >
                {t("auth:change_phone_form.verify_button_text")}
              </Button>
            </form>
          ) : (
            <>
              <Typography variant="body1">
                <Trans
                  t={t}
                  i18nKey="auth:change_phone_form.remove_phone_description"
                >
                  Your phone number is currently <b>{{ phone: props.phone }}</b>
                  . You can remove your phone number below, you will loose
                  verification.
                </Trans>
              </Typography>
              <Button
                fullWidth={!isMdOrWider}
                loading={isRemoveLoading}
                onClick={() => removePhone()}
              >
                {t("auth:change_phone_form.remove_button_text")}
              </Button>
            </>
          )}
          <form className={formClasses.form} onSubmit={onChangeSubmit}>
            <Typography variant="body1">
              {t("auth:change_phone_form.change_to_different_description")}
            </Typography>
            <TextField
              id="phone"
              inputRef={changeRegister({ required: true })}
              label={t("auth:change_phone_form.phone_label")}
              name="phone"
              fullWidth={!isMdOrWider}
            />
            <Button
              fullWidth={!isMdOrWider}
              loading={isChangeLoading}
              type="submit"
            >
              {t("auth:change_phone_form.change_button_text")}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
