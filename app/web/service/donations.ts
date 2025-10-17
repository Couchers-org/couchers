import { InitiateDonationReq } from "@couchers/services/donations";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import client from "./client";

export const initiateDonation = async (
  amount: number,
  recurring: boolean,
  source?: string,
) => {
  const req = new InitiateDonationReq();

  req.setAmount(amount);
  req.setRecurring(recurring);

  if (source) {
    req.setSource(source);
  }

  const res = await client.donations.initiateDonation(req);
  return res.getStripeCheckoutSessionId();
};

export const getDonationPortalLink = async () => {
  const res = await client.donations.getDonationPortalLink(new Empty());
  return res.getStripePortalUrl();
};
