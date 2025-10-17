import {
  AvailableWriteReferencesReq,
  HostRequestIndicateDidntMeetupReq,
  ListReferencesReq,
  WriteFriendReferenceReq,
  WriteHostRequestReferenceReq,
} from "@couchers/services/references";
import { HostRequest } from "@couchers/services/requests";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import type { ReferenceTypeState } from "@/features/profile/view/References";

import client from "./client";

const REFERENCES_PAGE_SIZE = 25;

export enum ReferenceTypeStrings {
  "friend",
  "surfed",
  "hosted",
}

interface GetReferencesBaseInput {
  userId: number;
  pageToken?: string;
}

interface GetAvailableReferencesInput {
  userId: number;
}

interface WriteReferenceBaseInput {
  text: string;
  wasAppropriate: boolean;
  rating: number;
  privateText?: string;
}

export interface WriteHostRequestReferenceInput
  extends WriteReferenceBaseInput {
  hostRequestId: number;
}

export interface WriteFriendReferenceInput extends WriteReferenceBaseInput {
  toUserId: number;
}

type GetReferencesGivenInput = GetReferencesBaseInput;

export const getReferencesGivenByUser = async ({
  userId,
  pageToken = "0",
}: GetReferencesGivenInput) => {
  const req = new ListReferencesReq();
  req.setFromUserId(userId);
  req.setReferenceTypeFilterList([]);
  req.setPageSize(REFERENCES_PAGE_SIZE);
  req.setPageToken(pageToken);

  const res = await client.references.listReferences(req);
  return res.toObject();
};

interface GetReferencesReceivedInput extends GetReferencesBaseInput {
  referenceType: Exclude<ReferenceTypeState, "given">;
}

export const getReferencesReceivedForUser = async ({
  userId,
  pageToken = "0",
  referenceType,
}: GetReferencesReceivedInput) => {
  const req = new ListReferencesReq();
  req.setToUserId(userId);
  req.setReferenceTypeFilterList(
    referenceType !== "all" ? [referenceType] : [],
  );
  req.setPageSize(REFERENCES_PAGE_SIZE);
  req.setPageToken(pageToken);

  const res = await client.references.listReferences(req);
  return res.toObject();
};

export const getAvailableReferences = async ({
  userId,
}: GetAvailableReferencesInput) => {
  const req = new AvailableWriteReferencesReq();
  req.setToUserId(userId);

  const res = await client.references.availableWriteReferences(req);
  return res.toObject();
};

export const writeHostRequestReference = async ({
  hostRequestId,
  text,
  wasAppropriate,
  rating,
  privateText,
}: WriteHostRequestReferenceInput) => {
  const req = new WriteHostRequestReferenceReq();
  req.setHostRequestId(hostRequestId);
  req.setText(text);
  req.setWasAppropriate(wasAppropriate);
  req.setRating(rating);

  if (privateText) {
    req.setPrivateText(privateText);
  }

  const res = await client.references.writeHostRequestReference(req);
  return res.toObject();
};

export const writeFriendRequestReference = async ({
  toUserId,
  text,
  wasAppropriate,
  rating,
}: WriteFriendReferenceInput) => {
  const req = new WriteFriendReferenceReq();
  req.setToUserId(toUserId);
  req.setText(text);
  req.setWasAppropriate(wasAppropriate);
  req.setRating(rating);

  const res = await client.references.writeFriendReference(req);
  return res.toObject();
};

export const listPendingReferencesToWrite = async () => {
  const res = await client.references.listPendingReferencesToWrite(new Empty());
  return res.toObject();
};

export const indicateDidntMeetup = async ({
  hostRequestId,
  reasonDidntMeetup,
}: {
  hostRequestId: HostRequest.AsObject["hostRequestId"];
  reasonDidntMeetup: string;
}) => {
  const req = new HostRequestIndicateDidntMeetupReq();
  req.setHostRequestId(hostRequestId);
  req.setReasonDidntMeetup(reasonDidntMeetup);
  const res = await client.references.hostRequestIndicateDidntMeetup(req);
  return res.toObject();
};
