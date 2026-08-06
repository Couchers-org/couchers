import {
  CancelPostalVerificationReq,
  ConfirmPostalAddressReq,
  GetPostalVerificationStatusReq,
  InitiatePostalVerificationReq,
  PostalAddress,
  VerifyPostalCodeReq,
} from "proto/postal_verification_pb";

import client from "./client";

export type PostalAddressData = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  countryCode: string;
};

function addressToProto(address: PostalAddressData) {
  const req = new PostalAddress();
  req.setAddressLine1(address.addressLine1);
  req.setAddressLine2(address.addressLine2 ?? "");
  req.setCity(address.city);
  req.setState(address.state ?? "");
  req.setPostalCode(address.postalCode ?? "");
  req.setCountryCode(address.countryCode);
  return req;
}

export async function getPostalVerificationStatus() {
  const req = new GetPostalVerificationStatusReq();
  const res = await client.postalVerification.getPostalVerificationStatus(req);
  return res.toObject();
}

export async function initiatePostalVerification(address: PostalAddressData) {
  const req = new InitiatePostalVerificationReq();
  req.setAddress(addressToProto(address));
  const res = await client.postalVerification.initiatePostalVerification(req);
  return res.toObject();
}

export async function confirmPostalAddress(postalVerificationAttemptId: number) {
  const req = new ConfirmPostalAddressReq();
  req.setPostalVerificationAttemptId(postalVerificationAttemptId);
  const res = await client.postalVerification.confirmPostalAddress(req);
  return res.toObject();
}

export async function verifyPostalCode(code: string) {
  const req = new VerifyPostalCodeReq();
  req.setCode(code);
  const res = await client.postalVerification.verifyPostalCode(req);
  return res.toObject();
}

export async function cancelPostalVerification(postalVerificationAttemptId: number) {
  const req = new CancelPostalVerificationReq();
  req.setPostalVerificationAttemptId(postalVerificationAttemptId);
  await client.postalVerification.cancelPostalVerification(req);
}
