import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  TextField,
} from "@material-ui/core";
import { loadStripe } from "@stripe/stripe-js";
import Alert from "components/Alert";
import Button from "components/Button";
import PageTitle from "components/PageTitle";
import { Error as GrpcError } from "grpc-web";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { useLocation } from "react-router-dom";
import { service } from "service";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY!);

export interface DonationFormData {
  amount: number;
  recurring: boolean;
}

export default function DonationPage() {
  const [success, setSuccess] = useState<boolean>(false);
  const [cancelled, setcancelled] = useState<boolean>(false);

  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    setSuccess(query.get("success") ? true : false);
    setcancelled(query.get("cancelled") ? true : false);
  }, [location]);

  const {
    control,
    register,
    handleSubmit,
    reset: resetForm,
    errors,
  } = useForm<DonationFormData>({ defaultValues: { recurring: true } });

  const { error, isLoading, mutate: initiateDonation } = useMutation<
    void,
    GrpcError,
    DonationFormData
  >(
    async (formData) => {
      const stripe = (await stripePromise)!;
      const session_id = await service.donations.initiateDonation(formData);
      // When the customer clicks on the button, redirect them to Checkout.
      const result = await stripe.redirectToCheckout({
        sessionId: session_id,
      });
      if (result.error) {
        throw Error(result.error.message);
      }
    },
    {
      onSuccess: () => {
        resetForm();
      },
    }
  );

  const onSubmit = handleSubmit((data) => {
    initiateDonation(data);
  });

  return (
    <>
      <PageTitle>Donate to the Couchers.org Foundation</PageTitle>
      <form onSubmit={onSubmit}>
        {error && <Alert severity="error">{error.message}</Alert>}
        {success && (
          <Alert severity="success">
            Thank you for donating to Couchers.org! We appreciate your support!
          </Alert>
        )}
        {cancelled && (
          <Alert severity="warning">The payment was cancelled.</Alert>
        )}
        <Controller
          id="recurring"
          control={control}
          name="recurring"
          rules={{ required: "This field is required." }}
          defaultValue="monthly"
          render={({ onChange, value }) => (
            <FormControl>
              <RadioGroup
                aria-label="recurring"
                name="recurring-radio"
                onChange={(e) => onChange(e.target.value === "monthly")}
                value={value ? "monthly" : "one-time"}
              >
                <FormControlLabel
                  value="one-time"
                  control={<Radio />}
                  label="One-time"
                />
                <FormControlLabel
                  value="monthly"
                  control={<Radio />}
                  label="Monthly"
                />
              </RadioGroup>
              <FormHelperText error={!!errors?.recurring?.message}>
                {errors?.recurring?.message ??
                  "A monthly gift helps us plan ahead and build our operations on a stable footing."}
              </FormHelperText>
            </FormControl>
          )}
        />
        <TextField
          id="amount"
          label="Amount to donate"
          name="amount"
          inputRef={register({ required: true })}
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          loading={isLoading}
          onClick={onSubmit}
        >
          Submit
        </Button>
      </form>
    </>
  );
}
