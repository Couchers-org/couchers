import { InitiateDonationReq } from "proto/donations_pb";

import client from "./client";

export async function initiateDonation(
  amount: number,
  recurring: boolean,
  source?: string,
) {
  const req = new InitiateDonationReq();

  req.setAmount(amount);
  req.setRecurring(recurring);

  if (source) {
    req.setSource(source);
  }

  const res = await client.donations.initiateDonation(req);
  return {
    sessionId: res.getStripeCheckoutSessionId(),
    checkoutUrl: res.getStripeCheckoutUrl(),
  };
}
