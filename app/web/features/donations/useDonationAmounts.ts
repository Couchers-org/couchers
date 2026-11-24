import { JSONValue } from "@growthbook/growthbook";
import { useFeatureValue } from "@growthbook/growthbook-react";
import {
  DONATIONS_BOX_DEFAULT_VALUE_INDEX,
  DONATIONS_BOX_VALUES,
  DONATIONS_BOX_YEARLY_VALUES,
} from "features/donations/constants";
import Sentry from "platform/sentry";
import { useEffect } from "react";

function isValidAmounts(flag: JSONValue): flag is number[] {
  return (
    Array.isArray(flag) &&
    flag.length > DONATIONS_BOX_DEFAULT_VALUE_INDEX &&
    new Set(flag).size === flag.length &&
    // the backend rejects donations under $2
    flag.every((value) => typeof value === "number" && Number.isInteger(value) && value >= 2)
  );
}

function useAmountsFlag(key: string, fallback: number[]) {
  const flag = useFeatureValue<JSONValue>(key, fallback);
  const valid = isValidAmounts(flag);
  const flagJson = JSON.stringify(flag);

  useEffect(() => {
    if (!valid) {
      Sentry.captureException(new Error(`${key} is not a valid list of donation amounts`), {
        tags: { component: "DonationsBox" },
        extra: { flag: flagJson },
      });
    }
  }, [key, valid, flagJson]);

  return valid ? flag : fallback;
}

export default function useDonationAmounts() {
  return {
    monthly: useAmountsFlag("donation_amounts", DONATIONS_BOX_VALUES),
    yearly: useAmountsFlag("donation_amounts_yearly", DONATIONS_BOX_YEARLY_VALUES),
  };
}
