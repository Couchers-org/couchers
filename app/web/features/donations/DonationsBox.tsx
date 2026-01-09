import {
  Divider,
  FormControl,
  FormControlLabel,
  FormControlLabelProps,
  FormHelperText,
  Radio,
  RadioGroup,
  styled,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import StyledLink from "components/StyledLink";
import {
  DONATIONS_BOX_CURRENCY,
  DONATIONS_BOX_VALUES,
} from "features/donations/constants";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { DONATIONS } from "i18n/namespaces";
import { useRouter } from "next/router";
import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { service } from "service";
import { theme } from "theme";

const SUB_GRID_ITEM_AMOUNT = 2;

const StyledForm = styled("form")(() => ({
  padding: theme.spacing(2),
  border: `2px solid var(--mui-palette-grey-200)`,
  borderRadius: theme.shape.borderRadius * 2,
  display: "flex",
  flexDirection: "column",
}));

const StyledFormGroup = styled(FormControl)(() => ({
  marginTop: theme.spacing(2),
  width: "100%",
}));

const StyledRadioGroup = styled(RadioGroup)(() => ({
  gridTemplateColumns: "repeat( auto-fit, minmax(160px, 1fr) )",
  gridAutoRows: "2.75rem",
  display: "grid",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const RadioFormControlLabel = (
  props: Omit<FormControlLabelProps, "control">,
) => <FormControlLabel {...props} control={<Radio />} />;

const StyledLabelledRadioButton = styled(RadioFormControlLabel)(() => ({
  boxShadow: "initial",
  margin: 0,
  "&:hover > .MuiFormControlLabel-label": {
    border: `2px solid var(--mui-palette-primary-main)`,
    backgroundColor: "var(--mui-palette-background-paper)",
    color: "var(--mui-palette-primary-main)",
    transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
  },
  "& > .MuiRadio-root": {
    position: "absolute",
    left: "-10000px",
  },
  "& > .MuiFormControlLabel-label": {
    color: "var(--mui-palette-grey-600)",
    fontWeight: 700,
    fontSize: theme.typography.button.fontSize,
    transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
    justifyContent: "center",
    alignItems: "center",
    border: `2px solid var(--mui-palette-grey-200)`,
    borderRadius: "0.5rem",
    backgroundColor: "var(--mui-palette-grey-200)",
    margin: "initial",
    height: "100%",
    width: "100%",
    display: "flex",
  },
  "& > .Mui-checked ~.MuiFormControlLabel-label": {
    border: `2px solid var(--mui-palette-primary-main)`,
    backgroundColor: "var(--mui-palette-background-paper)",
  },
}));

const StyledDivider = styled(Divider)(() => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledAmountGrid = styled("div")(() => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gridAutoRows: "2.75rem",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledAmountSubGrid = styled("div")(() => ({
  display: "grid",
  gridTemplateColumns: "repeat( auto-fit, minmax(72px, 1fr))",
  gap: theme.spacing(2),
}));

const StyledAmountButton = styled("button", {
  shouldForwardProp: (propName) => propName !== "isActive",
})<{ isActive: boolean }>(({ isActive }) => ({
  boxShadow: "initial",
  color: "var(--mui-palette-grey-600)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: theme.typography.button.fontSize,
  transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
  justifyContent: "center",
  alignItems: "center",
  border: `2px solid ${isActive ? "var(--mui-palette-primary-main)" : "var(--mui-palette-grey-200)"}`,
  borderRadius: "0.5rem",
  backgroundColor: isActive
    ? "var(--mui-palette-background-paper)"
    : "var(--mui-palette-grey-200)",
  margin: "initial",
  height: "100%",
  width: "100%",
  display: "flex",
  "&:hover": {
    border: `2px solid var(--mui-palette-primary-main)`,
    backgroundColor: "var(--mui-palette-background-paper)",
    color: "var(--mui-palette-primary-main)",
    transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
  },
}));

const StyledAmountInputWrapper = styled("div")(() => ({
  position: "relative",
  "&::before": {
    content: `'${DONATIONS_BOX_CURRENCY}'`,
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    left: theme.spacing(1),
    color: "var(--mui-palette-grey-600)",
    fontWeight: 700,
    fontSize: theme.typography.button.fontSize,
  },
}));

const StyledAmountInput = styled("input", {
  shouldForwardProp: (propName) => propName !== "isActive",
})<{ isActive: boolean }>(({ isActive }) => ({
  width: "100%",
  height: "100%",
  border: `2px solid ${isActive ? "var(--mui-palette-primary-main)" : "var(--mui-palette-grey-200)"}`,
  paddingLeft: theme.spacing(2),
  color: "var(--mui-palette-grey-600)",
  fontWeight: 700,
  fontSize: theme.typography.button.fontSize,
  "&&": {
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: "initial",
  },
  "&:hover": {
    border: `2px solid var(--mui-palette-primary-main)`,
  },
  "&:focus-visible": {
    border: `2px solid var(--mui-palette-primary-main)`,
    outline: "none",
    boxShadow: "none",
  },
}));

function AmountGrid(props: PropsWithChildren) {
  const children = React.Children.toArray(props.children);
  const subGrids = new Array(children.length / SUB_GRID_ITEM_AMOUNT)
    .fill(0)
    .map((_, index) => (
      <StyledAmountSubGrid key={index}>
        {children.slice(
          index * SUB_GRID_ITEM_AMOUNT,
          (index + 1) * SUB_GRID_ITEM_AMOUNT,
        )}
      </StyledAmountSubGrid>
    ));

  return <StyledAmountGrid>{subGrids}</StyledAmountGrid>;
}

const StyledSubmitButton = styled(Button)(() => ({
  backgroundColor: "var(--mui-palette-primary-main)",

  borderRadius: "0.5rem",
  boxShadow: "initial",
  height: "2.75rem",
  marginBottom: theme.spacing(2),
  "&:hover": {
    opacity: 0.4,
    backgroundColor: "var(--mui-palette-primary-main)",
  },
  "& .MuiButton-label": {
    color: "var(--mui-palette-background-paper)",
    transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
  },
  color: "var(--mui-palette-background-paper)",
  fontWeight: 700,
  transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
  alignSelf: "stretch",
}));

interface DonationFormData {
  amount: number;
  recurring: "monthly" | "one-off";
}

export default function DonationsBox() {
  const { t } = useTranslation(DONATIONS);

  const [isPredefinedAmount, setIsPredefinedAmount] = useState(true);

  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setSuccess(!!router.query["success"]);
      setCancelled(!!router.query["cancelled"]);
    }
  }, [router.isReady, router.query]);

  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<DonationFormData>();

  const customAmountInput = useRef<HTMLInputElement>(null);

  const checkForValidAmount = (amount: number) => {
    if (!Number.isInteger(amount)) return false;
    if (amount < 1) return false;
    return true;
  };

  const {
    error,
    isPending,
    mutate: initiateDonation,
  } = useMutation<void, RpcError, DonationFormData>({
    mutationFn: async ({ amount, recurring }) => {
      if (!checkForValidAmount(amount)) {
        throw Error(t("donations_box.amount_validation_error"));
      }
      const source = router.query.utm_source as string;

      const sessionUrl = await service.donations.initiateDonation(
        amount,
        recurring === "monthly",
        source,
      );

      // Redirect to Stripe Checkout
      window.location.href = sessionUrl;
    },

    onSuccess: () => {
      resetForm();
    },
  });

  const onSubmit = handleSubmit((data) => {
    initiateDonation(data);
  });

  const handleDonationAmountClick =
    ({
      amount,
      onChange,
    }: {
      amount: number;
      onChange: (...event: unknown[]) => void;
    }) =>
    () => {
      if (customAmountInput.current) customAmountInput.current.value = "";
      onChange(amount);
      setIsPredefinedAmount(true);
    };

  const formatDonationValue = (val: number) =>
    new Intl.NumberFormat("en-US", {
      currency: "USD",
      minimumFractionDigits: 0,
      style: "currency",
    }).format(val);

  return (
    <StyledForm onSubmit={onSubmit}>
      {error && <Alert severity="error">{error.message}</Alert>}
      {success && (
        <Alert severity="success">
          {t("donations_box.alert.success_message")}
        </Alert>
      )}
      {cancelled && (
        <Alert severity="warning">
          {t("donations_box.alert.warning_message")}
        </Alert>
      )}
      <Typography variant="h3">{t("donations_box.title")}</Typography>
      <Controller
        control={control}
        name="recurring"
        rules={{
          required: t("donations_box.validation_message"),
        }}
        defaultValue="monthly"
        render={({ field }) => (
          <StyledFormGroup variant="standard">
            <StyledRadioGroup
              {...field}
              id="recurring"
              aria-label={t("donations_box.recurrence_aria_label")}
              name="recurring-radio"
              onChange={(_, value) => field.onChange(value)}
              value={field.value}
            >
              <StyledLabelledRadioButton
                value="monthly"
                label={t("donations_box.monthly_button_label")}
              />
              <StyledLabelledRadioButton
                value="one-time"
                label={t("donations_box.one_time_button_label")}
              />
            </StyledRadioGroup>
            <FormHelperText error={!!errors?.recurring?.message}>
              {errors?.recurring?.message}
            </FormHelperText>
          </StyledFormGroup>
        )}
      />
      <Typography variant="body2" gutterBottom>
        {t("donations_recurrence_explainer")}
      </Typography>
      <StyledDivider />
      <Controller
        name="amount"
        control={control}
        defaultValue={DONATIONS_BOX_VALUES[2]}
        render={({ field }) => (
          <AmountGrid>
            {[
              ...DONATIONS_BOX_VALUES.map((value) => {
                return (
                  <StyledAmountButton
                    key={value}
                    type="button"
                    isActive={isPredefinedAmount && value === field.value}
                    onClick={handleDonationAmountClick({
                      amount: value,
                      onChange: field.onChange,
                    })}
                  >
                    {formatDonationValue(value)}
                  </StyledAmountButton>
                );
              }),
              <StyledAmountInputWrapper key={"input"}>
                <StyledAmountInput
                  {...field}
                  isActive={!isPredefinedAmount}
                  value={Number(field.value)}
                  ref={customAmountInput}
                  type="number"
                  min="1"
                  onChange={(e) => {
                    field.onChange(
                      typeof e.target.valueAsNumber === "number"
                        ? e.target.valueAsNumber
                        : DONATIONS_BOX_VALUES[0],
                    );
                    setIsPredefinedAmount(false);
                  }}
                  id="amount"
                />
              </StyledAmountInputWrapper>,
            ]}
          </AmountGrid>
        )}
      />
      <Typography
        variant="body2"
        sx={{
          marginBottom: "16px",
        }}
      >
        <Trans
          t={t}
          i18nKey="donations_box.helper_text"
          components={{
            2: (
              <StyledLink
                key="portal-link"
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  router.push(await service.donations.getDonationPortalLink());
                }}
              />
            ),
          }}
        />
      </Typography>
      <StyledSubmitButton type="submit" loading={isPending} onClick={onSubmit}>
        {t("donations_box.action_button_label")}
      </StyledSubmitButton>
    </StyledForm>
  );
}
