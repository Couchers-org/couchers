import { DonationFormData } from "features/donations/DonationsBox";
import { InitiateDonationReq } from "proto/donations_pb";
import client from "service/client";

export async function initiateDonation({
  amount,
  recurring,
}: DonationFormData) {
  const req = new InitiateDonationReq();

  req.setAmount(amount);
  req.setRecurring(recurring);

  const res = await client.donations.initiateDonation(req);
  return res.getStripeCheckoutSessionId();
}
