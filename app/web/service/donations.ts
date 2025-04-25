import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { InitiateDonationReq } from "proto/donations_pb";

import client from "./client";

export async function initiateDonation(amount: number, recurring: boolean) {
  const req = new InitiateDonationReq();

  req.setAmount(amount);
  req.setRecurring(recurring);

  const res = await client.donations.initiateDonation(req);
  return res.getStripeCheckoutSessionId();
}

export async function getDonationPortalLink() {
  const res = await client.donations.getDonationPortalLink(new Empty());
  return res.getStripePortalUrl();
}
