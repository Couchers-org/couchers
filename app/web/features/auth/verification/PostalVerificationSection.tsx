import { CheckCircle, Error as ErrorIcon, LocalPostOfficeOutlined, MailOutlined } from "@mui/icons-material";
import { alpha, Box, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import { Trans, useTranslation } from "i18n";
import { localizeDateOnly } from "i18n/datetimes";
import { AUTH } from "i18n/namespaces";
import { PostalVerificationStatus } from "proto/postal_verification_pb";
import { useMemo, useState } from "react";
import { howToDonateUrl } from "routes";
import { PostalAddressData } from "service/postalVerification";
import { timestampToPlainDateTime } from "utils/date";

import {
  POSTAL_VERIFICATION_CODE_LENGTH,
  POSTAL_VERIFICATION_CODE_LIFETIME_DAYS,
  POSTAL_VERIFICATION_MAX_ATTEMPTS,
} from "./constants";
import { getLocalizedCountries } from "./countries";
import usePostalVerification, { POSTAL_STEPS, PostalStep } from "./usePostalVerification";
import {
  ActionRow,
  InfoBanner,
  SectionBlock,
  SectionRoot,
  SuccessBanner,
  VerificationSectionHeader,
} from "./VerificationSection";

const EMPTY_ADDRESS: PostalAddressData = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  countryCode: "",
};

const StepList = styled("ol")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: theme.spacing(1),
  listStyle: "none",
  margin: 0,
  padding: 0,
}));

const StepItem = styled("li", { shouldForwardProp: (prop) => prop !== "isCurrent" })<{ isCurrent: boolean }>(
  ({ theme, isCurrent }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.5),
    padding: theme.spacing(1.5),
    borderRadius: "8px",
    border: `1px solid ${isCurrent ? "var(--mui-palette-primary-main)" : "var(--mui-palette-divider)"}`,
    // alpha() needs a real colour rather than a CSS variable.
    backgroundColor: isCurrent ? alpha(theme.palette.primary.main, 0.08) : "transparent",
  }),
);

const StepNumber = styled("span", { shouldForwardProp: (prop) => prop !== "isCurrent" })<{ isCurrent: boolean }>(
  ({ isCurrent }) => ({
    fontSize: "0.625rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: isCurrent ? "var(--mui-palette-primary-dark)" : "var(--mui-palette-text-secondary)",
  }),
);

/** Full-width address lines stacked over paired city/state and code/country. */
const AddressFieldGrid = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  columnGap: theme.spacing(2),
  rowGap: 0,
  [theme.breakpoints.up("sm")]: {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
}));

/** The entered-vs-corrected address pair, side by side where there's room. */
const ComparisonGrid = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: theme.spacing(1.5),
}));

const AddressCardLabel = styled("div")(({ theme }) => ({
  fontSize: "0.625rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: theme.spacing(1),
}));

function addressLines(address: PostalAddressData, countryName: string): string[] {
  return [
    address.addressLine1,
    address.addressLine2,
    [address.postalCode, address.city].filter(Boolean).join(" "),
    address.state,
    countryName,
  ].filter((line): line is string => !!line);
}

export default function PostalVerificationSection({ hasDonated }: { hasDonated: boolean }) {
  const {
    t,
    i18n: { language },
  } = useTranslation(AUTH);

  const {
    statusQuery,
    status,
    step,
    isVerified,
    submittedAddress,
    remainingCodeAttempts,
    isCodeWrong,
    clearCodeError,
    initiate,
    confirm,
    verifyCode,
    cancel,
  } = usePostalVerification();

  const countries = useMemo(() => getLocalizedCountries(language), [language]);
  const countryName = useMemo(() => {
    const byCode = new Map(countries.map((country) => [country.code, country.name]));
    return (code: string) => byCode.get(code) ?? code;
  }, [countries]);

  const [address, setAddress] = useState<PostalAddressData>(EMPTY_ADDRESS);
  const [showRequiredErrors, setShowRequiredErrors] = useState(false);
  const [code, setCode] = useState("");

  const setField = (field: keyof PostalAddressData) => (value: string) =>
    setAddress((previous) => ({ ...previous, [field]: value }));

  const isMissing = (field: "addressLine1" | "city" | "countryCode") => showRequiredErrors && !address[field];

  const onSubmitAddress = () => {
    if (!address.addressLine1 || !address.city || !address.countryCode) {
      setShowRequiredErrors(true);
      return;
    }
    initiate.mutate(address);
  };

  const attemptId = status?.postalVerificationAttemptId ?? 0;
  const lastAttemptStatus = status?.status;
  const isRateLimited = !!status && !status.canInitiateNewAttempt && !status.hasActiveAttempt && !isVerified;
  const mutationError =
    initiate.error?.message ?? confirm.error?.message ?? verifyCode.error?.message ?? cancel.error?.message;

  const cancelButton = (
    <Button variant="text" loading={cancel.isPending} onClick={() => cancel.mutate(attemptId)}>
      {t("verification_page.postal.cancel_button")}
    </Button>
  );

  return (
    <SectionRoot id="postal-verification">
      <VerificationSectionHeader
        icon={<LocalPostOfficeOutlined />}
        iconTint="primaryDark"
        title={t("verification_page.postal.header")}
        description={t("verification_page.postal.description")}
        status={isVerified ? "verified" : status?.hasActiveAttempt ? "in_progress" : "not_verified"}
      />

      {statusQuery.error && <Alert severity="error">{statusQuery.error.message}</Alert>}
      {mutationError && <Alert severity="error">{mutationError}</Alert>}

      {statusQuery.isLoading ? (
        <CenteredSpinner />
      ) : isVerified ? (
        <SuccessBanner>
          <CheckCircle />
          <Typography variant="body1">{t("verification_page.postal.verified_message")}</Typography>
        </SuccessBanner>
      ) : !hasDonated ? (
        // InitiatePostalVerification is gated on having donated backend-side too, so
        // showing the form here would only earn a FAILED_PRECONDITION.
        <Typography variant="body1">
          <Trans
            t={t}
            i18nKey="verification_page.postal.need_to_donate"
            components={{ 2: <StyledLink href={howToDonateUrl} /> }}
          />
        </Typography>
      ) : (
        <>
          <StepList>
            {POSTAL_STEPS.map((stepName: PostalStep, index) => {
              const isCurrent = stepName === step;
              return (
                <StepItem key={stepName} isCurrent={isCurrent} aria-current={isCurrent ? "step" : undefined}>
                  <StepNumber isCurrent={isCurrent}>
                    {t("verification_page.postal.step_number", { step_number: index + 1 })}
                  </StepNumber>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {t(`verification_page.postal.steps.${stepName}`)}
                  </Typography>
                </StepItem>
              );
            })}
          </StepList>

          {step === "address" &&
            (isRateLimited ? (
              <InfoBanner>
                <MailOutlined />
                <Typography variant="body1">
                  {t("verification_page.postal.rate_limited_message", {
                    date: status?.nextAttemptAllowedAt
                      ? localizeDateOnly(timestampToPlainDateTime(status.nextAttemptAllowedAt), language)
                      : "",
                  })}
                </Typography>
              </InfoBanner>
            ) : (
              <SectionBlock>
                {lastAttemptStatus === PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_FAILED && (
                  <Alert severity="warning">{t("verification_page.postal.failed_message")}</Alert>
                )}
                {lastAttemptStatus === PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_CANCELLED && (
                  <Alert severity="info">{t("verification_page.postal.cancelled_message")}</Alert>
                )}
                <Typography variant="body1" sx={{ color: "var(--mui-palette-text-secondary)" }}>
                  {t("verification_page.postal.address_form.description")}
                </Typography>
                <AddressFieldGrid>
                  <TextField
                    id="postal-address-line-1"
                    fullWidth
                    label={t("verification_page.postal.address_form.address_line_1_label")}
                    value={address.addressLine1}
                    onChange={(event) => setField("addressLine1")(event.target.value)}
                    error={isMissing("addressLine1")}
                    helperText={
                      isMissing("addressLine1") ? t("verification_page.postal.address_form.required_field_error") : " "
                    }
                    sx={{ gridColumn: "1 / -1" }}
                  />
                  <TextField
                    id="postal-address-line-2"
                    fullWidth
                    label={t("verification_page.postal.address_form.address_line_2_label")}
                    placeholder={t("verification_page.postal.address_form.address_line_2_placeholder")}
                    value={address.addressLine2}
                    onChange={(event) => setField("addressLine2")(event.target.value)}
                    helperText=" "
                    sx={{ gridColumn: "1 / -1" }}
                  />
                  <TextField
                    id="postal-city"
                    fullWidth
                    label={t("verification_page.postal.address_form.city_label")}
                    value={address.city}
                    onChange={(event) => setField("city")(event.target.value)}
                    error={isMissing("city")}
                    helperText={
                      isMissing("city") ? t("verification_page.postal.address_form.required_field_error") : " "
                    }
                  />
                  <TextField
                    id="postal-state"
                    fullWidth
                    label={t("verification_page.postal.address_form.state_label")}
                    placeholder={t("verification_page.postal.address_form.state_placeholder")}
                    value={address.state}
                    onChange={(event) => setField("state")(event.target.value)}
                    helperText=" "
                  />
                  <TextField
                    id="postal-code"
                    fullWidth
                    label={t("verification_page.postal.address_form.postal_code_label")}
                    value={address.postalCode}
                    onChange={(event) => setField("postalCode")(event.target.value)}
                    helperText=" "
                  />
                  <TextField
                    id="postal-country"
                    fullWidth
                    select
                    slotProps={{ select: { native: true } }}
                    label={t("verification_page.postal.address_form.country_label")}
                    value={address.countryCode}
                    onChange={(event) => setField("countryCode")(event.target.value)}
                    error={isMissing("countryCode")}
                    helperText={
                      isMissing("countryCode") ? t("verification_page.postal.address_form.required_field_error") : " "
                    }
                  >
                    <option value="" />
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </TextField>
                </AddressFieldGrid>
                <ActionRow align="center">
                  <Button loading={initiate.isPending} onClick={onSubmitAddress}>
                    {t("verification_page.postal.address_form.submit_button")}
                  </Button>
                </ActionRow>
              </SectionBlock>
            ))}

          {step === "confirm" && status?.address && (
            <SectionBlock>
              <Typography variant="body1">
                {submittedAddress
                  ? t("verification_page.postal.confirm.corrected_description")
                  : t("verification_page.postal.confirm.unchanged_description")}
              </Typography>
              <ComparisonGrid>
                {submittedAddress && (
                  <Box
                    sx={(theme) => ({
                      padding: theme.spacing(1.75),
                      borderRadius: "8px",
                      backgroundColor: "var(--mui-palette-grey-50)",
                    })}
                  >
                    <AddressCardLabel sx={{ color: "var(--mui-palette-text-secondary)" }}>
                      {t("verification_page.postal.confirm.entered_header")}
                    </AddressCardLabel>
                    <Typography
                      variant="body1"
                      sx={{ color: "var(--mui-palette-text-secondary)", textDecoration: "line-through" }}
                    >
                      {addressLines(submittedAddress, countryName(submittedAddress.countryCode)).map((line) => (
                        <Box component="span" key={line} sx={{ display: "block" }}>
                          {line}
                        </Box>
                      ))}
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={(theme) => ({
                    padding: theme.spacing(1.75),
                    borderRadius: "8px",
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    border: "1px solid var(--mui-palette-primary-main)",
                  })}
                >
                  <AddressCardLabel sx={{ color: "var(--mui-palette-primary-dark)" }}>
                    {t("verification_page.postal.confirm.will_post_to_header")}
                  </AddressCardLabel>
                  <Typography variant="body1">
                    {addressLines(
                      {
                        addressLine1: status.address.addressLine1,
                        addressLine2: status.address.addressLine2,
                        city: status.address.city,
                        state: status.address.state,
                        postalCode: status.address.postalCode,
                        countryCode: status.address.countryCode,
                      },
                      countryName(status.address.countryCode),
                    ).map((line) => (
                      <Box component="span" key={line} sx={{ display: "block" }}>
                        {line}
                      </Box>
                    ))}
                  </Typography>
                </Box>
              </ComparisonGrid>
              <ActionRow>
                <Button loading={confirm.isPending} onClick={() => confirm.mutate(attemptId)}>
                  {t("verification_page.postal.confirm.submit_button")}
                </Button>
                {cancelButton}
              </ActionRow>
            </SectionBlock>
          )}

          {step === "in_the_post" && (
            <SectionBlock>
              <InfoBanner>
                <MailOutlined />
                <Typography variant="body1">
                  {status?.postcardSentAt
                    ? t("verification_page.postal.in_the_post.sent_message", {
                        date: localizeDateOnly(timestampToPlainDateTime(status.postcardSentAt), language),
                        code_lifetime_days: POSTAL_VERIFICATION_CODE_LIFETIME_DAYS,
                      })
                    : t("verification_page.postal.in_the_post.queued_message", {
                        code_lifetime_days: POSTAL_VERIFICATION_CODE_LIFETIME_DAYS,
                      })}
                </Typography>
              </InfoBanner>
              <ActionRow>{cancelButton}</ActionRow>
            </SectionBlock>
          )}

          {step === "code" && (
            <SectionBlock sx={{ maxWidth: 420 }}>
              <Typography variant="body1">{t("verification_page.postal.code_form.description")}</Typography>
              <TextField
                id="postal-verification-code"
                fullWidth
                label={t("verification_page.postal.code_form.code_label")}
                value={code}
                onChange={(event) => {
                  clearCodeError();
                  setCode(event.target.value.toUpperCase());
                }}
                slotProps={{ htmlInput: { maxLength: POSTAL_VERIFICATION_CODE_LENGTH } }}
                sx={{ "& input": { fontSize: "1.5rem", fontWeight: 700, letterSpacing: "10px" } }}
              />
              <Typography variant="body2" sx={{ color: "var(--mui-palette-text-secondary)" }}>
                {t("verification_page.postal.code_form.tries_left", {
                  count: remainingCodeAttempts ?? POSTAL_VERIFICATION_MAX_ATTEMPTS,
                  max_tries: POSTAL_VERIFICATION_MAX_ATTEMPTS,
                })}
              </Typography>
              {isCodeWrong && (
                <Box
                  sx={(theme) => ({
                    display: "flex",
                    gap: 1.25,
                    alignItems: "center",
                    padding: theme.spacing(1.5, 1.75),
                    borderRadius: "4px",
                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                    color: "var(--mui-palette-error-main)",
                    "& .MuiSvgIcon-root": { fontSize: 20 },
                  })}
                >
                  <ErrorIcon />
                  <Typography variant="body1">{t("verification_page.postal.code_form.wrong_code_message")}</Typography>
                </Box>
              )}
              <ActionRow>
                <Button
                  loading={verifyCode.isPending}
                  disabled={code.length !== POSTAL_VERIFICATION_CODE_LENGTH}
                  onClick={() => verifyCode.mutate(code)}
                >
                  {t("verification_page.postal.code_form.submit_button")}
                </Button>
                {cancelButton}
              </ActionRow>
            </SectionBlock>
          )}
        </>
      )}
    </SectionRoot>
  );
}
