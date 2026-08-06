import "react-phone-number-input/style.css";

import { CheckCircle, SmartphoneOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import { accountInfoQueryKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import luhn from "luhn";
import { GetAccountInfoRes } from "proto/account_pb";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { formatPhoneNumberIntl, isValidPhoneNumber } from "react-phone-number-input";
import PhoneInputWithCountry from "react-phone-number-input/react-hook-form";
import { howToDonateUrl } from "routes";
import { service } from "service";

import { ActionRow, SectionBlock, SectionRoot, SuccessBanner, VerificationSectionHeader } from "./VerificationSection";

type PhoneVerificationSectionProps = {
  accountInfo: GetAccountInfoRes.AsObject;
};

type ChangePhoneFormData = { phone: string };
type VerifyPhoneFormData = { code: string };

const validatePhoneCode = (code: string) => code.length === 6 && luhn.validate(code);

/**
 * The phone number widget ships its own CSS; this pulls its input in line with
 * the rest of the page's fields.
 */
const phoneInputSx = {
  flexGrow: 1,
  width: "100%",
  "& .PhoneInputInput": {
    padding: "12px 14px",
    fontSize: "1rem",
    fontFamily: "inherit",
    color: "var(--mui-palette-text-primary)",
    backgroundColor: "var(--mui-palette-background-paper)",
    border: "1px solid var(--mui-palette-grey-300)",
    borderRadius: "4px",
    "&:focus": {
      outline: "2px solid var(--mui-palette-primary-main)",
      outlineOffset: "-1px",
    },
  },
};

export default function PhoneVerificationSection({ accountInfo }: PhoneVerificationSectionProps) {
  const { t } = useTranslation(AUTH);
  const queryClient = useQueryClient();

  // In the verified and code-sent states the change form is opt-in, so the
  // section leads with the state the user is actually in.
  const [isChangingNumber, setIsChangingNumber] = useState(false);

  const { handleSubmit: changeHandleSubmit, reset: resetChangeForm, control } = useForm<ChangePhoneFormData>();
  const {
    handleSubmit: verifyHandleSubmit,
    register: verifyRegister,
    reset: resetVerifyForm,
    formState: { errors: verifyFormErrors },
  } = useForm<VerifyPhoneFormData>({ mode: "onBlur" });

  const invalidateAccountInfo = () => queryClient.invalidateQueries({ queryKey: [accountInfoQueryKey] });

  const {
    error: changeError,
    isPending: isChangePending,
    mutate: changePhone,
    reset: resetChange,
  } = useMutation<Empty, RpcError, ChangePhoneFormData>({
    mutationFn: ({ phone }) => service.account.changePhone(phone),
    onSuccess: () => {
      invalidateAccountInfo();
      resetChangeForm();
      resetVerify();
      resetRemove();
      setIsChangingNumber(false);
    },
  });

  const {
    error: verifyError,
    isPending: isVerifyPending,
    mutate: verifyPhone,
    reset: resetVerify,
  } = useMutation<Empty, RpcError, VerifyPhoneFormData>({
    mutationFn: ({ code }) => service.account.verifyPhone(code),
    onSuccess: () => {
      invalidateAccountInfo();
      resetVerifyForm();
      resetChange();
      resetRemove();
    },
  });

  const {
    error: removeError,
    isPending: isRemovePending,
    mutate: removePhone,
    reset: resetRemove,
  } = useMutation<Empty, RpcError>({
    mutationFn: () => service.account.removePhone(),
    onSuccess: () => {
      invalidateAccountInfo();
      resetChangeForm();
      resetVerifyForm();
      resetChange();
      resetVerify();
    },
  });

  const status = accountInfo.phoneVerified ? "verified" : accountInfo.phone ? "code_sent" : "not_verified";
  const formattedPhone = accountInfo.phone ? formatPhoneNumberIntl(accountInfo.phone) : "";

  const changeNumberForm = (
    <Box
      component="form"
      onSubmit={changeHandleSubmit(({ phone }) => changePhone({ phone }))}
      sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxWidth: 560 }}
    >
      <Typography component="label" variant="body2" htmlFor="phone" sx={{ color: "var(--mui-palette-text-secondary)" }}>
        {t("change_phone.phone_label")}
      </Typography>
      {/* Button sits beside the number on desktop and drops under it, centred,
          once there isn't room for both. */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
        }}
      >
        <Box sx={phoneInputSx}>
          <PhoneInputWithCountry
            name="phone"
            control={control}
            rules={{ validate: (value: string) => isValidPhoneNumber(value) }}
            international
            placeholder={t("change_phone.phone_label")}
            id="phone"
          />
        </Box>
        <Button type="submit" loading={isChangePending} sx={{ flexShrink: 0 }}>
          {accountInfo.phone ? t("change_phone.change_button_text") : t("change_phone.add_button_text")}
        </Button>
      </Box>
    </Box>
  );

  return (
    <SectionRoot id="phone-verification">
      <VerificationSectionHeader
        icon={<SmartphoneOutlined />}
        iconTint="secondary"
        title={t("verification_page.phone.header")}
        description={t("verification_page.phone.description")}
        status={status}
      />

      {changeError && <Alert severity="error">{changeError.message}</Alert>}
      {verifyError && <Alert severity="error">{verifyError.message}</Alert>}
      {removeError && <Alert severity="error">{removeError.message}</Alert>}

      {!accountInfo.hasDonated ? (
        // ChangePhone is gated on having donated backend-side too, so showing the
        // form here would only earn a FAILED_PRECONDITION.
        <Typography variant="body1">
          <Trans t={t} i18nKey="change_phone.need_to_donate" components={{ 2: <StyledLink href={howToDonateUrl} /> }} />
        </Typography>
      ) : !accountInfo.phone ? (
        changeNumberForm
      ) : !accountInfo.phoneVerified ? (
        <SectionBlock sx={{ maxWidth: 420 }}>
          <Typography variant="body1">
            <Trans
              t={t}
              i18nKey="verification_page.phone.code_sent_description"
              values={{ phone_number: formattedPhone }}
            />
          </Typography>
          <Box component="form" onSubmit={verifyHandleSubmit(({ code }) => verifyPhone({ code }))}>
            <TextField
              id="code"
              {...verifyRegister("code", {
                required: true,
                validate: (code) => validatePhoneCode(code) || t("change_phone.wrong_code"),
              })}
              label={t("change_phone.code_label")}
              helperText={verifyFormErrors?.code?.message ?? " "}
              error={!!verifyFormErrors?.code?.message}
              fullWidth
              sx={{ "& input": { fontSize: "1.25rem", letterSpacing: "6px" } }}
            />
            <ActionRow>
              <Button type="submit" loading={isVerifyPending}>
                {t("change_phone.verify_button_text")}
              </Button>
              {!isChangingNumber && (
                <Button variant="text" onClick={() => setIsChangingNumber(true)}>
                  {t("verification_page.phone.use_another_number_button")}
                </Button>
              )}
            </ActionRow>
          </Box>
          {isChangingNumber && changeNumberForm}
        </SectionBlock>
      ) : (
        <SectionBlock>
          <SuccessBanner>
            <CheckCircle />
            <Typography variant="body1">
              <Trans
                t={t}
                i18nKey="verification_page.phone.verified_message"
                values={{ phone_number: formattedPhone }}
              />
            </Typography>
          </SuccessBanner>
          <ActionRow>
            <Button variant="outlined" loading={isRemovePending} onClick={() => removePhone()}>
              {t("change_phone.remove_button_text")}
            </Button>
            {!isChangingNumber && (
              <Button variant="text" onClick={() => setIsChangingNumber(true)}>
                {t("verification_page.phone.use_another_number_button")}
              </Button>
            )}
          </ActionRow>
          {isChangingNumber && changeNumberForm}
        </SectionBlock>
      )}
    </SectionRoot>
  );
}
