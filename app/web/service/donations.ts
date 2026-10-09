import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { DonationFrequency, InitiateDonationReq } from "proto/donations_pb";

import client from "./client";

export async function initiateDonation(amount: number, frequency: DonationFrequency, source?: string) {
  const req = new InitiateDonationReq();

  req.setAmount(amount);
  req.setFrequency(frequency);

  if (source) {
    req.setSource(source);
  }

  const res = await client.donations.initiateDonation(req);
  return res.getStripeCheckoutUrl();
}

export async function getDonationPortalLink() {
  const res = await client.donations.getDonationPortalLink(new Empty());
  return res.getStripePortalUrl();
}
