import {
  CancelPostalVerificationReq,
  ConfirmPostalAddressReq,
  GetPostalVerificationStatusReq,
  InitiatePostalVerificationReq,
  ListPostalVerificationAttemptsReq,
  PostalAddress,
  VerifyPostalCodeReq,
} from "proto/postal_verification_pb";

import client from "./client";

function postalAddressFromObject(address: PostalAddress.AsObject) {
  const pb = new PostalAddress();
  pb.setAddressLine1(address.addressLine1);
  pb.setAddressLine2(address.addressLine2);
  pb.setCity(address.city);
  pb.setState(address.state);
  pb.setPostalCode(address.postalCode);
  pb.setCountryCode(address.countryCode);
  return pb;
}

export async function initiatePostalVerification(
  address: PostalAddress.AsObject,
) {
  const req = new InitiatePostalVerificationReq();
  req.setAddress(postalAddressFromObject(address));
  const res = await client.postalVerification.initiatePostalVerification(req);
  return res.toObject();
}

export async function confirmPostalAddress(attemptId: number) {
  const req = new ConfirmPostalAddressReq();
  req.setPostalVerificationAttemptId(attemptId);
  const res = await client.postalVerification.confirmPostalAddress(req);
  return res.toObject();
}

export async function getPostalVerificationStatus(attemptId?: number) {
  const req = new GetPostalVerificationStatusReq();
  if (attemptId) {
    req.setPostalVerificationAttemptId(attemptId);
  }
  const res = await client.postalVerification.getPostalVerificationStatus(req);
  return res.toObject();
}

export async function verifyPostalCode(code: string) {
  const req = new VerifyPostalCodeReq();
  req.setCode(code);
  const res = await client.postalVerification.verifyPostalCode(req);
  return res.toObject();
}

export function cancelPostalVerification(attemptId: number) {
  const req = new CancelPostalVerificationReq();
  req.setPostalVerificationAttemptId(attemptId);
  return client.postalVerification.cancelPostalVerification(req);
}

export async function listPostalVerificationAttempts() {
  const res = await client.postalVerification.listPostalVerificationAttempts(
    new ListPostalVerificationAttemptsReq(),
  );
  return res.toObject();
}
