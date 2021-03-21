import type { ReferenceTypeState } from "features/profile/view/References";
import { ListReferencesReq } from "pb/references_pb";

import client from "./client";

interface GetReferencesBaseInput {
  userId: number;
  pageToken?: string;
}

type GetReferencesGivenInput = GetReferencesBaseInput;

export async function getReferencesGivenByUser({
  userId,
  pageToken = "0",
}: GetReferencesGivenInput) {
  const req = new ListReferencesReq();
  req.setFromUserId(userId);
  req.setReferenceTypeFilterList([]);
  req.setPageSize(1);
  req.setPageToken(pageToken);

  const res = await client.references.listReferences(req);
  return res.toObject();
}

interface GetReferencesReceivedInput extends GetReferencesBaseInput {
  referenceType?: Exclude<ReferenceTypeState, "given">;
}

export async function getReferencesReceivedForUser({
  userId,
  pageToken = "0",
  referenceType = "all",
}: GetReferencesReceivedInput) {
  const req = new ListReferencesReq();
  req.setToUserId(userId);
  req.setReferenceTypeFilterList(
    referenceType !== "all" ? [referenceType] : []
  );
  req.setPageSize(1);
  req.setPageToken(pageToken);

  const res = await client.references.listReferences(req);
  return res.toObject();
}
